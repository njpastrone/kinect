#!/usr/bin/env node
/**
 * Migrate User from Test to Production Database
 * 
 * This script copies a user from the test database to the kinect database
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function migrateUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    // Connect to test database
    const baseUri = mongoUri.split('?')[0].replace(/\/[^/]*$/, '');
    const queryParams = mongoUri.includes('?') ? '?' + mongoUri.split('?')[1] : '';
    
    console.log('🔄 Migrating user from test to production database...\n');

    // Connect to test database
    const testUri = `${baseUri}/test${queryParams}`;
    const testConn = await mongoose.createConnection(testUri).asPromise();
    const testDb = testConn.db;
    
    // Connect to kinect database  
    const kinectUri = `${baseUri}/kinect${queryParams}`;
    const kinectConn = await mongoose.createConnection(kinectUri).asPromise();
    const kinectDb = kinectConn.db;
    
    // Find user in test database
    const testUsersCollection = testDb.collection('users');
    const userToMigrate = await testUsersCollection.findOne({ email: 'njpastrone@gmail.com' });
    
    if (!userToMigrate) {
      console.log('❌ User not found in test database');
      await testConn.close();
      await kinectConn.close();
      process.exit(1);
    }
    
    console.log('✅ Found user in test database:');
    console.log(`  Name: ${userToMigrate.firstName} ${userToMigrate.lastName}`);
    console.log(`  Email: ${userToMigrate.email}`);
    console.log(`  ID: ${userToMigrate._id}`);
    
    // Check if user already exists in kinect database
    const kinectUsersCollection = kinectDb.collection('users');
    const existingUser = await kinectUsersCollection.findOne({ email: 'njpastrone@gmail.com' });
    
    if (existingUser) {
      console.log('\n⚠️  User already exists in kinect database');
      console.log('  ID:', existingUser._id);
      await testConn.close();
      await kinectConn.close();
      process.exit(0);
    }
    
    // Copy user to kinect database
    console.log('\n📝 Copying user to kinect database...');
    
    // Create new user object without _id so MongoDB generates a new one
    const newUser = {
      ...userToMigrate,
      _id: undefined,
      createdAt: userToMigrate.createdAt || new Date(),
      updatedAt: new Date()
    };
    delete newUser._id;
    
    const result = await kinectUsersCollection.insertOne(newUser);
    console.log('✅ User migrated successfully!');
    console.log('  New ID:', result.insertedId);
    
    // Check for contacts in test database and migrate them too
    const testContactsCollection = testDb.collection('contacts');
    const contacts = await testContactsCollection.find({ userId: userToMigrate._id }).toArray();
    
    if (contacts.length > 0) {
      console.log(`\n📝 Found ${contacts.length} contacts to migrate...`);
      const kinectContactsCollection = kinectDb.collection('contacts');
      
      const migratedContacts = contacts.map(contact => ({
        ...contact,
        _id: undefined,
        userId: result.insertedId,  // Update to new user ID
        createdAt: contact.createdAt || new Date(),
        updatedAt: new Date()
      }));
      
      // Remove old _id fields
      migratedContacts.forEach(c => delete c._id);
      
      await kinectContactsCollection.insertMany(migratedContacts);
      console.log(`✅ Migrated ${contacts.length} contacts`);
    } else {
      console.log('\n📱 No contacts to migrate');
    }
    
    console.log('\n🎉 Migration complete!');
    console.log('You can now use your account with the production database.');
    
    await testConn.close();
    await kinectConn.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateUser();
}

module.exports = { migrateUser };