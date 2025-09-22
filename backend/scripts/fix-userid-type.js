#!/usr/bin/env node
/**
 * Fix UserId Type in Contacts
 * 
 * This script converts all contact userId fields from ObjectId to String
 * to match the schema definition
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function fixUserIdType() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const contactsCollection = db.collection('contacts');

    // Find all contacts
    const allContacts = await contactsCollection.find({}).toArray();
    console.log(`📱 Found ${allContacts.length} total contacts\n`);

    let fixedCount = 0;
    let alreadyStringCount = 0;

    for (const contact of allContacts) {
      const currentUserId = contact.userId;
      const currentType = typeof currentUserId;
      
      if (currentType === 'object' && currentUserId) {
        // It's an ObjectId, convert to string
        const userIdString = currentUserId.toString();
        
        await contactsCollection.updateOne(
          { _id: contact._id },
          { 
            $set: { 
              userId: userIdString,
              updatedAt: new Date()
            } 
          }
        );
        
        console.log(`✅ Fixed: ${contact.firstName} ${contact.lastName}`);
        console.log(`   ObjectId(${userIdString}) → String("${userIdString}")`);
        fixedCount++;
      } else if (currentType === 'string') {
        alreadyStringCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Fixed: ${fixedCount} contacts (ObjectId → String)`);
    console.log(`   Already correct: ${alreadyStringCount} contacts`);
    
    // Verify the fix by testing a query
    console.log('\n🔍 Verification Test:');
    const usersCollection = db.collection('users');
    const testUser = await usersCollection.findOne({ email: 'njpastrone@gmail.com' });
    
    if (testUser) {
      const userIdString = testUser._id.toString();
      
      // Test query with string
      const contactsWithString = await contactsCollection.countDocuments({ 
        userId: userIdString 
      });
      
      console.log(`   User ID: ${userIdString}`);
      console.log(`   Contacts found with string query: ${contactsWithString}`);
      
      if (contactsWithString > 0) {
        console.log('   ✅ Query test successful! The fix worked.');
      } else {
        console.log('   ⚠️  No contacts found - there may be another issue');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 The contacts should now appear in the UI!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixUserIdType();
}

module.exports = { fixUserIdType };