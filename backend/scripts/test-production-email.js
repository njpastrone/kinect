#!/usr/bin/env node
/**
 * Test Production Email Delivery
 * 
 * This script tests the production email delivery system
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function testProductionEmail() {
  try {
    console.log('🧪 Testing Production Email Delivery...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the notification service
    const { notificationService } = require('../dist/backend/src/services/notification.service.simple');
    const { User } = require('../dist/backend/src/models/User.model');
    
    // Get the user
    console.log('👤 Finding user...');
    const user = await User.findOne({ email: 'njpastrone@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
    
    // Check reminder stats first
    console.log('\n📊 Checking reminder stats...');
    const stats = await notificationService.getReminderStats(user._id.toString());
    console.log(`✅ Reminder stats: ${stats.overdueCount} overdue, ${stats.upcomingCount} upcoming`);
    
    if (stats.overdueCount === 0) {
      console.log('⚠️  No overdue contacts found - test email may not be sent');
    }
    
    // Check SMTP configuration
    console.log('\n📧 Checking SMTP configuration...');
    console.log(`SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
    console.log(`SMTP Port: ${process.env.SMTP_PORT || 'NOT SET'}`);
    console.log(`SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
    console.log(`SMTP Pass: ${process.env.SMTP_PASS ? 'SET (****)' : 'NOT SET'}`);
    console.log(`From Email: ${process.env.FROM_EMAIL || 'NOT SET'}`);
    
    // Test email service directly
    console.log('\n📨 Testing email service...');
    try {
      await notificationService.sendTestReminder(user._id.toString());
      console.log('✅ Test reminder sent successfully');
      console.log('\n📋 Check your email:');
      console.log('   1. Check inbox for email from kinect.exec.team@gmail.com');
      console.log('   2. Check spam/junk folder');
      console.log('   3. Subject should be: "Time to reconnect with X contacts"');
    } catch (error) {
      console.log('❌ Email send error:', error.message);
      console.log('\nPossible issues:');
      console.log('   1. SMTP credentials incorrect');
      console.log('   2. Gmail app password expired');
      console.log('   3. Network connectivity issues');
      console.log('   4. No overdue contacts to send');
    }

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
  testProductionEmail();
}

module.exports = { testProductionEmail };