#!/usr/bin/env node
/**
 * Check All Databases for User
 * 
 * This script checks all databases on the cluster for the user
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function checkAllDatabases() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    // Connect without specifying a database
    const baseUri = mongoUri.split('?')[0].replace(/\/[^/]*$/, '');
    const queryParams = mongoUri.includes('?') ? '?' + mongoUri.split('?')[1] : '';
    
    console.log('🔗 Connecting to MongoDB cluster...\n');

    // Check each database
    const databases = ['kinect', 'test'];
    
    for (const dbName of databases) {
      const dbUri = `${baseUri}/${dbName}${queryParams}`;
      console.log(`\n📊 Checking database: ${dbName}`);
      console.log('━'.repeat(50));
      
      const connection = await mongoose.createConnection(dbUri).asPromise();
      const db = connection.db;
      
      try {
        // Check users collection
        const usersCollection = db.collection('users');
        const userCount = await usersCollection.countDocuments();
        console.log(`  Users found: ${userCount}`);
        
        if (userCount > 0) {
          // Look for njpastrone@gmail.com
          const targetUser = await usersCollection.findOne({ email: 'njpastrone@gmail.com' });
          
          if (targetUser) {
            console.log(`  ✅ FOUND njpastrone@gmail.com in ${dbName} database!`);
            console.log(`    ID: ${targetUser._id}`);
            console.log(`    Name: ${targetUser.firstName} ${targetUser.lastName}`);
            console.log(`    Created: ${targetUser.createdAt}`);
            
            // Check for contacts
            const contactsCollection = db.collection('contacts');
            const contactCount = await contactsCollection.countDocuments({ userId: targetUser._id });
            console.log(`    Contacts: ${contactCount}`);
            
            console.log(`\n  🎯 This is the database being used for authentication!`);
            console.log(`  To use this database, update your MONGODB_URI to include "/${dbName}" in the path`);
          } else {
            // List first few users
            const sampleUsers = await usersCollection.find({}).limit(3).toArray();
            console.log('  Sample users:');
            sampleUsers.forEach(u => console.log(`    - ${u.email}`));
          }
        }
      } catch (error) {
        console.log(`  Error accessing ${dbName}: ${error.message}`);
      }
      
      await connection.close();
    }
    
    // Also check what the app is actually using by testing registration
    console.log('\n\n🔍 Testing Registration Logic...');
    console.log('━'.repeat(50));
    
    try {
      const authTestUri = mongoUri;
      const testConn = await mongoose.createConnection(authTestUri).asPromise();
      const testDb = testConn.db;
      console.log(`  App is using database: ${testDb.databaseName}`);
      
      const usersInAppDb = await testDb.collection('users').countDocuments();
      console.log(`  Users in app database: ${usersInAppDb}`);
      
      // Check if njpastrone exists here
      const user = await testDb.collection('users').findOne({ email: 'njpastrone@gmail.com' });
      if (user) {
        console.log('  ✅ Found njpastrone@gmail.com in app database');
      } else {
        console.log('  ❌ njpastrone@gmail.com NOT in app database');
        console.log('\n  💡 This means either:');
        console.log('     1. The "User already exists" error is coming from somewhere else');
        console.log('     2. The frontend and backend are using different databases');
        console.log('     3. There might be a caching issue');
      }
      
      await testConn.close();
    } catch (error) {
      console.log('  Error:', error.message);
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkAllDatabases();
}

module.exports = { checkAllDatabases };