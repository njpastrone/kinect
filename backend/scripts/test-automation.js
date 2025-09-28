#!/usr/bin/env node
/**
 * Test Automated Reminder System
 * 
 * This script tests the notification service automation
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function testAutomation() {
  try {
    console.log('🔄 Testing automated reminder system...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import and test the notification service
    const { notificationService } = require('../dist/backend/src/services/notification.service.simple');
    
    console.log('\n📅 Testing daily reminders process...');
    await notificationService.processDailyReminders();
    
    console.log('\n✅ Automation test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Deploy to production (git push)');
    console.log('   2. Cron jobs will run automatically:');
    console.log('      - Daily: Every day at 9 AM UTC');
    console.log('   3. Check your email for reminders!');

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
  testAutomation();
}

module.exports = { testAutomation };