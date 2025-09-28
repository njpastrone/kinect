#!/usr/bin/env node
/**
 * Test Production Reminders
 * 
 * This script creates overdue contacts in production for testing reminders
 * Usage: MONGODB_URI="your-production-uri" node scripts/test-production-reminders.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function testProductionReminders() {
  try {
    // Ensure we have MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      console.log('Usage: MONGODB_URI="mongodb+srv://..." node scripts/test-production-reminders.js');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const contactsCollection = db.collection('contacts');

    // Find your specific user account
    const userEmail = process.env.TEST_USER_EMAIL || 'welcometest@example.com';
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User ${userEmail} not found.`);
      console.log('Available users:');
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(u => console.log(`  - ${u.email}`));
      console.log('\nPlease create an account at https://kinect-web.onrender.com or update the email in this script');
      process.exit(1);
    }

    console.log(`\n👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Get existing contacts - userId is stored as String in database
    const existingContacts = await contactsCollection.find({ userId: user._id.toString() }).toArray();
    console.log(`📱 Found ${existingContacts.length} existing contacts`);

    if (existingContacts.length === 0) {
      console.log('\n📝 No contacts found. Creating test contacts...');
      
      // Create test contacts with various overdue states
      const testContacts = [
        {
          userId: user._id.toString(),
          firstName: 'Test',
          lastName: 'Contact1',
          email: 'test1@example.com',
          lastContactDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          customReminderDays: 30, // 15 days overdue
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: user._id.toString(),
          firstName: 'Test',
          lastName: 'Contact2',
          email: 'test2@example.com',
          lastContactDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          customReminderDays: 30, // 30 days overdue
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: user._id.toString(),
          firstName: 'Test',
          lastName: 'Contact3',
          email: 'test3@example.com',
          lastContactDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          // No customReminderDays, will use default (30 days) - 70 days overdue
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await contactsCollection.insertMany(testContacts);
      console.log(`✅ Created ${testContacts.length} test contacts`);
    } else {
      console.log('\n🔄 Making existing contacts overdue for testing...');
      
      // Update first 3 contacts to be overdue
      const contactsToUpdate = existingContacts.slice(0, Math.min(3, existingContacts.length));
      
      for (let i = 0; i < contactsToUpdate.length; i++) {
        const contact = contactsToUpdate[i];
        const daysAgo = 45 + (i * 20); // 45, 65, 85 days ago
        const newDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await contactsCollection.updateOne(
          { _id: contact._id },
          { 
            $set: { 
              lastContactDate: newDate,
              customReminderDays: 30 // Set threshold to 30 days
            } 
          }
        );
        
        const daysOverdue = daysAgo - 30;
        console.log(`  ✅ ${contact.firstName} ${contact.lastName}: Set to ${daysAgo} days ago (${daysOverdue} days overdue)`);
      }
    }

    // Check overdue contacts
    console.log('\n📊 Checking overdue contacts...');
    const allContacts = await contactsCollection.find({ userId: user._id.toString() }).toArray();
    
    let overdueCount = 0;
    for (const contact of allContacts) {
      const daysSince = Math.floor((Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
      const threshold = contact.customReminderDays || 30;
      const isOverdue = daysSince > threshold;
      
      if (isOverdue) {
        overdueCount++;
        console.log(`  🔴 ${contact.firstName} ${contact.lastName}: ${daysSince - threshold} days overdue`);
      } else {
        console.log(`  🟢 ${contact.firstName} ${contact.lastName}: Not overdue (${threshold - daysSince} days remaining)`);
      }
    }

    console.log(`\n📈 Summary: ${overdueCount} contacts are overdue`);

    if (overdueCount > 0) {
      console.log('\n✅ Test data is ready! Now you can run:');
      console.log('   node scripts/send-reminders.js');
      console.log('\nThis will send a reminder email to:', user.email);
    } else {
      console.log('\n⚠️  No overdue contacts. Adjust the dates and try again.');
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
  testProductionReminders();
}

module.exports = { testProductionReminders };