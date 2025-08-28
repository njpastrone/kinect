#!/usr/bin/env node
/**
 * Kinect Reminder System - Live Demo Script
 * 
 * This script demonstrates the complete reminder system in action:
 * 1. Checks prerequisites and starts services
 * 2. Creates realistic test data
 * 3. Processes overdue reminders
 * 4. Shows actual emails in MailHog
 * 5. Provides visual confirmation
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for beautiful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const { green, yellow, blue, red, cyan, bright, reset } = colors;

// Demo configuration
const DEMO_CONFIG = {
  mongodb_uri: 'mongodb://localhost:27017/kinect-demo',
  mailhog_smtp: 1025,
  mailhog_web: 8025,
  backend_port: 3001,
  demo_user: {
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson'
  }
};

class ReminderDemo {
  constructor() {
    this.startTime = Date.now();
    this.services = {
      mongodb: false,
      mailhog: false,
      backend: false
    };
  }

  // Utility methods
  log(message, color = reset) {
    console.log(`${color}${message}${reset}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runCommand(command, silent = false) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          if (!silent) console.error(`Error: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr && !silent) {
          console.error(`Warning: ${stderr}`);
        }
        resolve(stdout.trim());
      });
    });
  }

  // Main demo flow
  async run() {
    try {
      this.showHeader();
      await this.checkPrerequisites();
      await this.startServices();
      await this.createTestData();
      await this.processReminders();
      await this.showResults();
      await this.openMailHog();
      this.showFooter();
    } catch (error) {
      this.log(`\n${red}❌ Demo failed: ${error.message}`, red);
      this.log(`\n🛠️  Try running: npm run demo:reset`, yellow);
      process.exit(1);
    }
  }

  showHeader() {
    console.clear();
    this.log('🎬 KINECT REMINDER SYSTEM - LIVE DEMO', bright + blue);
    this.log('='.repeat(50), blue);
    this.log('');
    this.log('This demo will:', cyan);
    this.log('  🚀 Start all required services', cyan);
    this.log('  📝 Create realistic test contacts', cyan);
    this.log('  📧 Send actual reminder emails', cyan);
    this.log('  🌐 Show results in your browser', cyan);
    this.log('');
    this.log('⏱️  Estimated time: 2-3 minutes', yellow);
    this.log('');
  }

  async checkPrerequisites() {
    this.log('🔍 Checking Prerequisites...', bright + yellow);
    
    const checks = [
      { name: 'Node.js', command: 'node --version', expected: 'v' },
      { name: 'Docker', command: 'docker --version', expected: 'Docker version' },
      { name: 'MongoDB', command: 'mongosh --version || mongo --version', expected: '' }
    ];

    for (const check of checks) {
      try {
        const result = await this.runCommand(check.command, true);
        if (result.includes(check.expected) || check.expected === '') {
          this.log(`  ✅ ${check.name}: ${result.split('\n')[0]}`, green);
        } else {
          throw new Error(`${check.name} not found or invalid version`);
        }
      } catch (error) {
        this.log(`  ❌ ${check.name}: Not found`, red);
        throw new Error(`${check.name} is required but not installed`);
      }
    }

    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('Please run this from the backend directory');
    }

    this.log('');
  }

  async startServices() {
    this.log('🚀 Starting Services...', bright + yellow);

    // Start MailHog
    try {
      await this.runCommand('docker stop mailhog-demo 2>/dev/null || true', true);
      await this.runCommand('docker rm mailhog-demo 2>/dev/null || true', true);
      await this.runCommand(`docker run -d --name mailhog-demo -p ${DEMO_CONFIG.mailhog_smtp}:1025 -p ${DEMO_CONFIG.mailhog_web}:8025 mailhog/mailhog`);
      await this.sleep(3000); // Give MailHog time to start
      this.log(`  ✅ MailHog: Running on ports ${DEMO_CONFIG.mailhog_smtp} (SMTP) and ${DEMO_CONFIG.mailhog_web} (Web)`, green);
      this.services.mailhog = true;
    } catch (error) {
      throw new Error('Failed to start MailHog. Is Docker running?');
    }

    // Check MongoDB
    try {
      await this.runCommand('mongosh --eval "db.adminCommand({ping: 1})" --quiet', true);
      this.log('  ✅ MongoDB: Connected and ready', green);
      this.services.mongodb = true;
    } catch (error) {
      this.log('  ⚠️  MongoDB: Starting local instance...', yellow);
      // Try to start MongoDB (this varies by system)
      try {
        await this.runCommand('brew services start mongodb-community 2>/dev/null || sudo systemctl start mongod 2>/dev/null || mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data 2>/dev/null', true);
        await this.sleep(3000);
        await this.runCommand('mongosh --eval "db.adminCommand({ping: 1})" --quiet');
        this.log('  ✅ MongoDB: Started successfully', green);
        this.services.mongodb = true;
      } catch (mongoError) {
        this.log('  ❌ MongoDB: Please start MongoDB manually', red);
        this.log('    macOS: brew services start mongodb-community', cyan);
        this.log('    Linux: sudo systemctl start mongod', cyan);
        throw new Error('MongoDB not available');
      }
    }

    // Test email connection
    try {
      const testResult = await this.testEmailConnection();
      this.log('  ✅ SMTP: MailHog ready to receive emails', green);
    } catch (error) {
      throw new Error('MailHog SMTP not responding');
    }

    this.log('');
  }

  async testEmailConnection() {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: 'localhost',
      port: DEMO_CONFIG.mailhog_smtp,
      secure: false,
      connectionTimeout: 10000,
      greetingTimeout: 5000
    });

    // Retry logic for SMTP connection
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        await transporter.verify();
        return true;
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          await this.sleep(1000); // Wait 1 second before retry
        } else {
          throw error;
        }
      }
    }
  }

  async createTestData() {
    this.log('📝 Creating Test Data...', bright + yellow);

    const mongoose = require('mongoose');
    await mongoose.connect(DEMO_CONFIG.mongodb_uri);

    // Define schemas
    const UserSchema = new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      createdAt: { type: Date, default: Date.now }
    });

    const ContactSchema = new mongoose.Schema({
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      lastContactDate: Date,
      customReminderDays: Number,
      createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('DemoUser', UserSchema);
    const Contact = mongoose.model('DemoContact', ContactSchema);

    // Clear existing demo data
    await User.deleteMany({});
    await Contact.deleteMany({});

    // Create demo user
    const user = await User.create(DEMO_CONFIG.demo_user);
    this.log(`  👤 User: ${user.firstName} ${user.lastName} (${user.email})`, cyan);

    // Create realistic contacts with various reminder scenarios
    const contacts = [
      {
        userId: user._id.toString(),
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phoneNumber: '+1-555-0123',
        lastContactDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        customReminderDays: 30 // 15 days overdue
      },
      {
        userId: user._id.toString(),
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@example.com',
        phoneNumber: '+1-555-0124',
        lastContactDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        customReminderDays: 20 // 5 days overdue
      },
      {
        userId: user._id.toString(),
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phoneNumber: '+1-555-0125',
        lastContactDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        customReminderDays: 60 // 40 days overdue
      },
      {
        userId: user._id.toString(),
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@example.com',
        lastContactDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        customReminderDays: 30 // Not overdue yet
      },
      {
        userId: user._id.toString(),
        firstName: 'David',
        lastName: 'Martinez',
        email: 'david.martinez@example.com',
        lastContactDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
        // No custom reminder days, will use default 90 days → 5 days overdue
      }
    ];

    const savedContacts = await Contact.insertMany(contacts);
    
    // Calculate and display overdue status
    let overdueCount = 0;
    savedContacts.forEach(contact => {
      const daysSince = Math.floor((Date.now() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
      const threshold = contact.customReminderDays || 90;
      const daysOverdue = Math.max(0, daysSince - threshold);
      
      if (daysOverdue > 0) {
        overdueCount++;
        this.log(`  📱 ${contact.firstName} ${contact.lastName}: ${daysOverdue} days overdue (${daysSince} days since contact, ${threshold}-day threshold)`, cyan);
      } else {
        this.log(`  📱 ${contact.firstName} ${contact.lastName}: Not overdue (${daysSince} days since contact, ${threshold}-day threshold)`, cyan);
      }
    });

    this.log(`  ✅ Created ${savedContacts.length} contacts, ${overdueCount} are overdue`, green);
    
    await mongoose.disconnect();
    this.log('');

    return { user, contacts: savedContacts, overdueCount };
  }

  async processReminders() {
    this.log('📧 Processing Reminders...', bright + yellow);

    const mongoose = require('mongoose');
    const nodemailer = require('nodemailer');
    
    await mongoose.connect(DEMO_CONFIG.mongodb_uri);

    const UserSchema = new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String
    });

    const ContactSchema = new mongoose.Schema({
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
      lastContactDate: Date,
      customReminderDays: Number
    });

    const User = mongoose.model('DemoUser', UserSchema);
    const Contact = mongoose.model('DemoContact', ContactSchema);

    // Get user and contacts
    const user = await User.findOne();
    const contacts = await Contact.find({ userId: user._id });

    // Find overdue contacts
    const now = new Date();
    const overdueContacts = contacts.filter(contact => {
      const daysSince = Math.floor((now - contact.lastContactDate) / (1000 * 60 * 60 * 24));
      const threshold = contact.customReminderDays || 90;
      return daysSince > threshold;
    }).map(contact => {
      const daysSince = Math.floor((now - contact.lastContactDate) / (1000 * 60 * 60 * 24));
      return {
        name: `${contact.firstName} ${contact.lastName}`,
        daysSince,
        email: contact.email
      };
    }).sort((a, b) => b.daysSince - a.daysSince); // Most overdue first

    this.log(`  🔍 Found ${overdueContacts.length} overdue contacts`, cyan);

    if (overdueContacts.length > 0) {
      // Create email transporter
      const transporter = nodemailer.createTransporter({
        host: 'localhost',
        port: DEMO_CONFIG.mailhog_smtp,
        secure: false
      });

      // Generate email content
      const contactList = overdueContacts.slice(0, 5).map(contact => 
        `<li style="margin-bottom: 8px;"><strong>${contact.name}</strong> - ${contact.daysSince} days since last contact</li>`
      ).join('');

      const emailContent = {
        from: 'Kinect Reminders <reminders@kinect.app>',
        to: user.email,
        subject: 'Time to reconnect with your contacts!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">👋 Hi ${user.firstName}!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Time to reconnect with your contacts</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">You have contacts you haven't spoken to in a while:</p>
              
              <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                ${contactList}
              </ul>
              
              <p style="font-size: 16px; color: #333; margin: 20px 0;">Consider reaching out to maintain your relationships! A quick text, call, or coffee meetup can make all the difference.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View All Contacts</a>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e0e0e0; border-top: none;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                Generated by <strong>Kinect Reminder System</strong><br>
                <a href="#" style="color: #667eea; text-decoration: none;">Update Preferences</a> | 
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        text: `
Hi ${user.firstName}!

You have contacts you haven't spoken to in a while:

${overdueContacts.slice(0, 5).map(contact => `• ${contact.name} - ${contact.daysSince} days since last contact`).join('\n')}

Consider reaching out to maintain your relationships!

Generated by Kinect Reminder System
        `.trim()
      };

      // Send email
      const result = await transporter.sendMail(emailContent);
      this.log(`  ✅ Email sent to ${user.email}`, green);
      this.log(`  📮 Message ID: ${result.messageId}`, cyan);
      this.log(`  📊 Included ${Math.min(overdueContacts.length, 5)} overdue contacts`, cyan);
      
      // Add small delay to ensure email is processed
      await this.sleep(1000);
    } else {
      this.log('  ℹ️  No overdue contacts found - no reminders needed', yellow);
    }

    await mongoose.disconnect();
    this.log('');
  }

  async showResults() {
    this.log('🌐 Checking Results...', bright + yellow);

    try {
      // Check MailHog for emails
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://localhost:${DEMO_CONFIG.mailhog_web}/api/v1/messages`);
      const messages = await response.json();

      const demoEmails = messages.filter(msg => 
        msg.Content.Headers.Subject && 
        msg.Content.Headers.Subject[0].includes('reconnect')
      );

      this.log(`  📬 MailHog received ${demoEmails.length} reminder email(s)`, green);
      
      if (demoEmails.length > 0) {
        const latestEmail = demoEmails[0];
        this.log(`  📧 Latest email:`, cyan);
        this.log(`     To: ${latestEmail.Content.Headers.To[0]}`, cyan);
        this.log(`     Subject: ${latestEmail.Content.Headers.Subject[0]}`, cyan);
        this.log(`     Time: ${new Date(latestEmail.Created).toLocaleTimeString()}`, cyan);
      }
    } catch (error) {
      this.log('  ⚠️  Could not verify emails in MailHog', yellow);
    }

    this.log('');
  }

  async openMailHog() {
    this.log('🚀 Opening MailHog in Browser...', bright + yellow);
    
    const mailhogUrl = `http://localhost:${DEMO_CONFIG.mailhog_web}`;
    this.log(`  🌐 URL: ${mailhogUrl}`, cyan);

    try {
      // Try to open browser (works on most systems)
      const openCommand = process.platform === 'darwin' ? 'open' : 
                         process.platform === 'win32' ? 'start' : 'xdg-open';
      await this.runCommand(`${openCommand} ${mailhogUrl}`, true);
      this.log('  ✅ Browser opened automatically', green);
    } catch (error) {
      this.log('  ⚠️  Please manually open: http://localhost:8025', yellow);
    }

    this.log('');
  }

  showFooter() {
    const totalTime = Math.round((Date.now() - this.startTime) / 1000);
    
    this.log('🎉 Demo Complete!', bright + green);
    this.log('='.repeat(50), green);
    this.log(`⏱️  Total time: ${totalTime} seconds`, cyan);
    this.log('');
    this.log('What you should see:', bright);
    this.log('  🌐 MailHog opened in your browser', cyan);
    this.log('  📧 Professional reminder email in the inbox', cyan);
    this.log('  👥 List of overdue contacts with days since last contact', cyan);
    this.log('  🎨 Beautiful HTML formatting with your name', cyan);
    this.log('');
    this.log('Try these next:', bright + yellow);
    this.log('  📚 npm run test:scenarios    - Test different reminder scenarios', cyan);
    this.log('  🔄 npm run demo:reset        - Clean up and reset demo data', cyan);
    this.log('  🧪 npm test                  - Run comprehensive test suite', cyan);
    this.log('  📖 cat README_TESTING.md     - Read full testing guide', cyan);
    this.log('');
    this.log('🧹 Cleanup:', yellow);
    this.log('  When finished testing, run: npm run demo:cleanup', cyan);
    this.log('');
  }

  // Cleanup method
  static async cleanup() {
    console.log('🧹 Cleaning up demo environment...');
    
    try {
      // Stop MailHog
      await new ReminderDemo().runCommand('docker stop mailhog-demo && docker rm mailhog-demo', true);
      console.log('  ✅ Stopped MailHog');
      
      // Clear demo database
      const mongoose = require('mongoose');
      await mongoose.connect(DEMO_CONFIG.mongodb_uri);
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
      console.log('  ✅ Cleared demo database');
      
      console.log('');
      console.log('✅ Cleanup complete!');
    } catch (error) {
      console.log('⚠️  Cleanup had some issues - this is usually fine');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new ReminderDemo();
  
  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Demo interrupted - cleaning up...');
    await ReminderDemo.cleanup();
    process.exit(0);
  });

  // Check for cleanup flag
  if (process.argv.includes('--cleanup')) {
    ReminderDemo.cleanup();
  } else {
    demo.run();
  }
}

module.exports = ReminderDemo;