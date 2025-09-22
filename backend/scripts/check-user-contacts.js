#!/usr/bin/env node
/**
 * Check User Contacts
 * 
 * This script shows all contacts for a specific user in detail
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function checkUserContacts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const contactsCollection = db.collection('contacts');

    // Find the user
    const userEmail = process.env.TEST_USER_EMAIL || 'njpastrone@gmail.com';
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User ${userEmail} not found`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📧 User ID: ${user._id}`);
    console.log(`📅 Created: ${user.createdAt}`);

    // Find all contacts for this user
    const contacts = await contactsCollection.find({ userId: user._id }).toArray();
    console.log(`\n📱 Found ${contacts.length} contacts:`);
    console.log('━'.repeat(80));

    if (contacts.length === 0) {
      console.log('  No contacts found for this user.');
    } else {
      contacts.forEach((contact, index) => {
        console.log(`\n${index + 1}. ${contact.firstName} ${contact.lastName}`);
        console.log(`   ID: ${contact._id}`);
        console.log(`   Email: ${contact.email || 'Not set'}`);
        console.log(`   Phone: ${contact.phone || 'Not set'}`);
        console.log(`   Last Contact: ${contact.lastContactDate || 'Never'}`);
        console.log(`   Reminder Days: ${contact.customReminderDays || 'Default (30)'}`);
        console.log(`   Created: ${contact.createdAt}`);
        console.log(`   Updated: ${contact.updatedAt || 'Not set'}`);
        
        // Calculate if overdue
        if (contact.lastContactDate) {
          const daysSince = Math.floor((Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
          const threshold = contact.customReminderDays || 30;
          const isOverdue = daysSince > threshold;
          
          if (isOverdue) {
            console.log(`   📅 Status: 🔴 OVERDUE (${daysSince - threshold} days overdue)`);
          } else {
            console.log(`   📅 Status: 🟢 OK (${threshold - daysSince} days remaining)`);
          }
        } else {
          console.log(`   📅 Status: ⚪ No last contact date`);
        }
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkUserContacts();
}

module.exports = { checkUserContacts };