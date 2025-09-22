#!/usr/bin/env node
/**
 * Cleanup Duplicate Contacts
 * 
 * This script removes duplicate test contacts, keeping only one of each
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function cleanupDuplicateContacts() {
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
    const usersCollection = db.collection('users');

    // Find the user
    const userEmail = process.env.TEST_USER_EMAIL || 'njpastrone@gmail.com';
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User ${userEmail} not found`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`👤 Processing contacts for: ${user.firstName} ${user.lastName}`);

    // Find all contacts for this user
    const contacts = await contactsCollection.find({ 
      userId: user._id.toString() 
    }).toArray();

    console.log(`📱 Found ${contacts.length} total contacts\n`);

    // Group contacts by name to find duplicates
    const contactsByName = {};
    contacts.forEach(contact => {
      const key = `${contact.firstName}_${contact.lastName}`;
      if (!contactsByName[key]) {
        contactsByName[key] = [];
      }
      contactsByName[key].push(contact);
    });

    // Process duplicates
    let removedCount = 0;
    console.log('🔍 Checking for duplicates...\n');

    for (const [name, duplicates] of Object.entries(contactsByName)) {
      if (duplicates.length > 1) {
        console.log(`Found ${duplicates.length} copies of: ${name.replace('_', ' ')}`);
        
        // Sort by creation date, keep the oldest one
        duplicates.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const toKeep = duplicates[0];
        const toRemove = duplicates.slice(1);

        console.log(`  Keeping: ID ${toKeep._id} (created ${toKeep.createdAt})`);
        
        for (const contact of toRemove) {
          console.log(`  Removing: ID ${contact._id} (created ${contact.createdAt})`);
          await contactsCollection.deleteOne({ _id: contact._id });
          removedCount++;
        }
        console.log();
      }
    }

    // Show final summary
    const remainingContacts = await contactsCollection.find({ 
      userId: user._id.toString() 
    }).toArray();

    console.log('━'.repeat(60));
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Removed: ${removedCount} duplicate contacts`);
    console.log(`  Remaining: ${remainingContacts.length} unique contacts`);
    
    console.log('\n📱 Final contact list:');
    remainingContacts.forEach(contact => {
      console.log(`  - ${contact.firstName} ${contact.lastName} (${contact.email || 'no email'})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupDuplicateContacts();
}

module.exports = { cleanupDuplicateContacts };