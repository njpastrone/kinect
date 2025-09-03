require('dotenv').config();
const mongoose = require('mongoose');
const { notificationService } = require('../dist/services/notification.service');

async function sendReminders() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Process weekly reminders
    await notificationService.processWeeklyReminders();
    console.log('✅ Reminders sent successfully');
    
    // Clean disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  sendReminders();
}

module.exports = { sendReminders };