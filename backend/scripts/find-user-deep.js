#!/usr/bin/env node
/**
 * Deep Search for User Account
 * 
 * This script does a thorough search across all possible locations
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function findUserDeep() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
    console.log('🔗 Connecting to:', maskedUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Try using Mongoose models directly
    console.log('🔍 Method 1: Using Mongoose Models...');
    try {
      // Import the User model
      const User = require('../dist/backend/src/models/User.model').User || 
                   require('../src/models/User.model').User;
      
      const userCount = await User.countDocuments();
      console.log(`  Found ${userCount} users via Mongoose model`);
      
      const targetUser = await User.findOne({ email: 'njpastrone@gmail.com' });
      if (targetUser) {
        console.log('  ✅ Found njpastrone@gmail.com via Mongoose!');
        console.log('    ID:', targetUser._id);
        console.log('    Name:', targetUser.firstName, targetUser.lastName);
      } else {
        console.log('  ❌ Not found via Mongoose model');
      }
      
      // List all users via Mongoose
      const allUsers = await User.find({}).select('email firstName lastName createdAt');
      console.log(`\n  All users via Mongoose (${allUsers.length} total):`);
      allUsers.forEach(u => {
        console.log(`    - ${u.email} (${u.firstName} ${u.lastName})`);
      });
    } catch (modelError) {
      console.log('  ⚠️ Could not use Mongoose models:', modelError.message);
    }

    // Check all databases on the cluster
    console.log('\n🔍 Method 2: Checking all databases on cluster...');
    const admin = db.admin();
    const dbList = await admin.listDatabases();
    console.log('  Available databases:', dbList.databases.map(d => d.name).join(', '));

    // Check for variations in collection names
    console.log('\n🔍 Method 3: Checking collection name variations...');
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      if (collection.name.toLowerCase().includes('user')) {
        console.log(`\n  Checking collection: ${collection.name}`);
        const coll = db.collection(collection.name);
        const count = await coll.countDocuments();
        console.log(`    Total documents: ${count}`);
        
        // Search for the email
        const user = await coll.findOne({ email: 'njpastrone@gmail.com' });
        if (user) {
          console.log('    ✅ FOUND njpastrone@gmail.com in', collection.name);
          console.log('    User:', JSON.stringify(user, null, 2));
        }
        
        // Try case-insensitive search
        const userCaseInsensitive = await coll.findOne({ 
          email: { $regex: /njpastrone@gmail\.com/i } 
        });
        if (userCaseInsensitive && !user) {
          console.log('    ⚠️ Found with different casing:', userCaseInsensitive.email);
        }
      }
    }

    // Test authentication directly
    console.log('\n🔍 Method 4: Testing authentication logic...');
    const usersCollection = db.collection('users');
    
    // Check if email exists (case-insensitive)
    const emailRegex = new RegExp('^njpastrone@gmail.com$', 'i');
    const existingUser = await usersCollection.findOne({ email: emailRegex });
    
    if (existingUser) {
      console.log('  ✅ Found user with case-insensitive search:', existingUser.email);
    } else {
      console.log('  ❌ Not found even with case-insensitive search');
      
      // Check for similar emails
      console.log('\n  Checking for similar emails...');
      const similarUsers = await usersCollection.find({
        email: { $regex: /njpastrone/i }
      }).toArray();
      
      if (similarUsers.length > 0) {
        console.log('  Found similar emails:');
        similarUsers.forEach(u => console.log('    -', u.email));
      }
    }

    // Check for hidden characters or spaces
    console.log('\n🔍 Method 5: Checking for hidden characters...');
    const allEmails = await usersCollection.find({}).project({ email: 1 }).toArray();
    allEmails.forEach(u => {
      const email = u.email;
      if (email && email.includes('njpastrone')) {
        console.log(`  Found containing 'njpastrone': "${email}"`);
        console.log(`    Length: ${email.length}`);
        console.log(`    Char codes:`, Array.from(email).map(c => c.charCodeAt(0)));
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  findUserDeep();
}

module.exports = { findUserDeep };