#!/usr/bin/env node
/**
 * Test Notification Service Direct Methods
 * 
 * This script tests the notification service methods directly without API authentication
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function testNotificationService() {
  try {
    console.log('🧪 Testing Notification Service Direct Methods...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the notification service
    const { notificationService } = require('../dist/backend/src/services/notification.service.simple');
    
    console.log('📊 Testing getReminderStats...');
    try {
      // Get a user ID from the database first
      const { User } = require('../dist/backend/src/models/User.model');
      const user = await User.findOne({ email: 'njpastrone@gmail.com' });
      
      if (!user) {
        console.log('❌ Test user not found in database');
        return;
      }
      
      console.log(`✅ Found test user: ${user.email} (ID: ${user._id})`);
      
      const stats = await notificationService.getReminderStats(user._id.toString());
      console.log('✅ Reminder stats:', stats);
    } catch (error) {
      console.log('❌ Stats error:', error.message);
    }
    console.log('');

    console.log('📧 Testing sendTestReminder...');
    try {
      const { User } = require('../dist/backend/src/models/User.model');
      const user = await User.findOne({ email: 'njpastrone@gmail.com' });
      
      if (user) {
        await notificationService.sendTestReminder(user._id.toString());
        console.log('✅ Test reminder sent successfully');
      }
    } catch (error) {
      console.log('❌ Send test reminder error:', error.message);
    }
    console.log('');

    console.log('🔄 Testing processDailyReminders...');
    try {
      await notificationService.processDailyReminders();
      console.log('✅ Daily reminders processed successfully');
    } catch (error) {
      console.log('❌ Process daily reminders error:', error.message);
    }

    console.log('\n🎉 Notification service tests completed!');
    console.log('\n📋 Verification:');
    console.log('   1. Check your email for test reminders');
    console.log('   2. Check backend logs for processing details');
    console.log('   3. API endpoints should work if service methods work');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPossible fixes:');
    console.error('   1. Ensure backend is built: npm run build');
    console.error('   2. Check SMTP configuration in .env');
    console.error('   3. Verify MongoDB connection');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testNotificationService();
}

module.exports = { testNotificationService };