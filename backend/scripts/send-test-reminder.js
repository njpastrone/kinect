#!/usr/bin/env node
/**
 * Send Test Reminder Email Directly
 * 
 * This script sends a reminder email for a specific user's overdue contacts
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

// Import nodemailer - try multiple locations
let nodemailer;
try {
  // Try root node_modules first (monorepo structure)
  nodemailer = require('../../../node_modules/nodemailer');
} catch (e) {
  try {
    // Try backend node_modules
    nodemailer = require('../node_modules/nodemailer');
  } catch (e2) {
    // Try direct require
    nodemailer = require('nodemailer');
  }
}

async function sendTestReminder() {
  try {
    // Check for required environment variables
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is required');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
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

    console.log(`👤 Processing reminders for: ${user.firstName} ${user.lastName} (${user.email})`);

    // Find overdue contacts
    const contacts = await contactsCollection.find({ userId: user._id }).toArray();
    const now = new Date();
    const overdueContacts = [];

    for (const contact of contacts) {
      const daysSince = Math.floor((now - new Date(contact.lastContactDate)) / (1000 * 60 * 60 * 24));
      const threshold = contact.customReminderDays || 30;
      
      if (daysSince > threshold) {
        overdueContacts.push({
          name: `${contact.firstName} ${contact.lastName}`,
          daysSince,
          daysOverdue: daysSince - threshold,
          email: contact.email || 'No email',
          phone: contact.phone || 'No phone'
        });
      }
    }

    console.log(`📊 Found ${overdueContacts.length} overdue contacts`);

    if (overdueContacts.length === 0) {
      console.log('ℹ️  No overdue contacts, no reminder needed');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Display overdue contacts
    overdueContacts.sort((a, b) => b.daysOverdue - a.daysOverdue);
    overdueContacts.forEach(contact => {
      console.log(`  🔴 ${contact.name}: ${contact.daysOverdue} days overdue (${contact.daysSince} days since contact)`);
    });

    // Configure email
    console.log('\n📧 Preparing to send reminder email...');
    
    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST || 'localhost';
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || 'kinect.exec.team@gmail.com';

    console.log(`  SMTP Host: ${smtpHost}:${smtpPort}`);
    console.log(`  From: ${fromEmail}`);
    console.log(`  To: ${user.email}`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass
      } : undefined,
      // For local testing without auth
      ignoreTLS: smtpHost === 'localhost',
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('  ✅ SMTP connection verified');
    } catch (verifyError) {
      console.log('  ⚠️  SMTP verification failed:', verifyError.message);
      console.log('  Attempting to send anyway...');
    }

    // Prepare email content
    const contactList = overdueContacts.slice(0, 5).map(contact => 
      `• ${contact.name} - ${contact.daysSince} days since last contact (${contact.daysOverdue} days overdue)`
    ).join('\n');

    const htmlContactList = overdueContacts.slice(0, 5).map(contact => 
      `<li><strong>${contact.name}</strong> - ${contact.daysSince} days since last contact (${contact.daysOverdue} days overdue)</li>`
    ).join('\n');

    const emailOptions = {
      from: `Kinect Reminders <${fromEmail}>`,
      to: user.email,
      subject: `Time to reconnect with ${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''}!`,
      text: `Hi ${user.firstName}!

You have ${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''} you haven't spoken to in a while:

${contactList}

Consider reaching out to maintain your relationships! A quick text, call, or coffee meetup can make all the difference.

Best regards,
Kinect Reminder System`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hi ${user.firstName}! 👋</h2>
          <p>You have <strong>${overdueContacts.length} contact${overdueContacts.length > 1 ? 's' : ''}</strong> you haven't spoken to in a while:</p>
          <ul style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            ${htmlContactList}
          </ul>
          <p>Consider reaching out to maintain your relationships! A quick text, call, or coffee meetup can make all the difference.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent by Kinect Reminder System<br>
            <a href="https://kinect-web.onrender.com">Manage your contacts</a>
          </p>
        </div>
      `
    };

    // Send email
    console.log('\n📮 Sending email...');
    try {
      const info = await transporter.sendMail(emailOptions);
      console.log('✅ Email sent successfully!');
      console.log(`  Message ID: ${info.messageId}`);
      if (info.accepted) {
        console.log(`  Accepted by: ${info.accepted.join(', ')}`);
      }
    } catch (sendError) {
      console.error('❌ Failed to send email:', sendError.message);
      console.log('\n💡 Troubleshooting tips:');
      console.log('  1. Check your SMTP settings in .env file');
      console.log('  2. If using Gmail, ensure you have an app-specific password');
      console.log('  3. For local testing, consider using MailHog:');
      console.log('     docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog');
      console.log('     Then set SMTP_HOST=localhost and SMTP_PORT=1025');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  sendTestReminder();
}

module.exports = { sendTestReminder };