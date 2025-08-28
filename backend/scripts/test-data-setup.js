#!/usr/bin/env node
/**
 * Test Data Setup Script
 * 
 * Creates comprehensive test data for various testing scenarios
 */

const mongoose = require('mongoose');

const TEST_DATABASE = 'mongodb://localhost:27017/kinect-test-data';

// Test user profiles
const TEST_USERS = [
  {
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    preferences: { emailReminders: true, quietHours: { start: 22, end: 8 } }
  },
  {
    email: 'mike.chen@example.com',
    firstName: 'Mike',
    lastName: 'Chen', 
    preferences: { emailReminders: true, maxContactsPerEmail: 3 }
  },
  {
    email: 'lisa.rodriguez@example.com',
    firstName: 'Lisa',
    lastName: 'Rodriguez',
    preferences: { emailReminders: false } // Disabled for testing
  }
];

// Contact templates with realistic reminder scenarios
const CONTACT_TEMPLATES = [
  // Best Friends (15-day reminders)
  { firstName: 'Alex', lastName: 'Thompson', customReminderDays: 15, category: 'best-friends' },
  { firstName: 'Jordan', lastName: 'Lee', customReminderDays: 15, category: 'best-friends' },
  { firstName: 'Sam', lastName: 'Taylor', customReminderDays: 15, category: 'best-friends' },
  
  // Close Friends (30-day reminders)
  { firstName: 'Casey', lastName: 'Morgan', customReminderDays: 30, category: 'friends' },
  { firstName: 'Riley', lastName: 'Parker', customReminderDays: 30, category: 'friends' },
  { firstName: 'Avery', lastName: 'Brooks', customReminderDays: 30, category: 'friends' },
  
  // Work Contacts (60-day reminders)
  { firstName: 'Jamie', lastName: 'Walsh', customReminderDays: 60, category: 'work' },
  { firstName: 'Morgan', lastName: 'Reed', customReminderDays: 60, category: 'work' },
  { firstName: 'Blake', lastName: 'Cooper', customReminderDays: 60, category: 'work' },
  
  // Family (90-day reminders - default)
  { firstName: 'Cameron', lastName: 'Johnson', category: 'family' },
  { firstName: 'Taylor', lastName: 'Davis', category: 'family' },
  { firstName: 'Robin', lastName: 'Wilson', category: 'family' },
  
  // Custom scenarios
  { firstName: 'Sage', lastName: 'Miller', customReminderDays: 7, category: 'daily-checkin' },
  { firstName: 'River', lastName: 'Garcia', customReminderDays: 120, category: 'distant' },
  { firstName: 'Phoenix', lastName: 'Martinez', customReminderDays: 45, category: 'custom' }
];

class TestDataSetup {
  constructor() {
    this.UserSchema = new mongoose.Schema({
      email: String,
      firstName: String,
      lastName: String,
      preferences: Object,
      createdAt: { type: Date, default: Date.now }
    });

    this.ContactSchema = new mongoose.Schema({
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      lastContactDate: Date,
      customReminderDays: Number,
      category: String,
      createdAt: { type: Date, default: Date.now }
    });

    this.ContactListSchema = new mongoose.Schema({
      userId: String,
      name: String,
      description: String,
      color: String,
      reminderDays: Number,
      contactIds: [String],
      createdAt: { type: Date, default: Date.now }
    });
  }

  async connect() {
    await mongoose.connect(TEST_DATABASE);
    console.log('✅ Connected to test database');
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  async clearData() {
    const User = mongoose.model('TestUser', this.UserSchema);
    const Contact = mongoose.model('TestContact', this.ContactSchema);
    const ContactList = mongoose.model('TestContactList', this.ContactListSchema);

    await User.deleteMany({});
    await Contact.deleteMany({});
    await ContactList.deleteMany({});
    
    console.log('🧹 Cleared existing test data');
  }

  async createUsers() {
    const User = mongoose.model('TestUser', this.UserSchema);
    const users = await User.insertMany(TEST_USERS);
    
    console.log(`👥 Created ${users.length} test users:`);
    users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    return users;
  }

  async createContactLists(users) {
    const ContactList = mongoose.model('TestContactList', this.ContactListSchema);
    const lists = [];

    for (const user of users) {
      const userLists = [
        {
          userId: user._id.toString(),
          name: 'Best Friends',
          description: 'My closest friends',
          color: '#ef4444',
          reminderDays: 15,
          contactIds: []
        },
        {
          userId: user._id.toString(),
          name: 'Work Colleagues',
          description: 'Professional contacts',
          color: '#3b82f6',
          reminderDays: 60,
          contactIds: []
        },
        {
          userId: user._id.toString(),
          name: 'Family',
          description: 'Family members',
          color: '#10b981',
          reminderDays: 90,
          contactIds: []
        }
      ];

      const savedLists = await ContactList.insertMany(userLists);
      lists.push(...savedLists);
    }

    console.log(`📋 Created ${lists.length} contact lists (${lists.length / users.length} per user)`);
    return lists;
  }

  async createContacts(users) {
    const Contact = mongoose.model('TestContact', this.ContactSchema);
    const allContacts = [];

    for (const user of users) {
      const userContacts = [];

      CONTACT_TEMPLATES.forEach((template, index) => {
        // Create varied contact dates for realistic testing
        const scenarios = [
          { daysAgo: 10, status: 'recent' },
          { daysAgo: 25, status: 'approaching' },
          { daysAgo: 40, status: 'overdue' },
          { daysAgo: 75, status: 'very-overdue' },
          { daysAgo: 120, status: 'extremely-overdue' }
        ];

        const scenario = scenarios[index % scenarios.length];
        const lastContactDate = new Date(Date.now() - scenario.daysAgo * 24 * 60 * 60 * 1000);

        const contact = {
          userId: user._id.toString(),
          firstName: template.firstName,
          lastName: template.lastName,
          email: `${template.firstName.toLowerCase()}.${template.lastName.toLowerCase()}@example.com`,
          phoneNumber: `+1-555-${String(index).padStart(4, '0')}`,
          lastContactDate,
          customReminderDays: template.customReminderDays,
          category: template.category
        };

        userContacts.push(contact);
      });

      const savedContacts = await Contact.insertMany(userContacts);
      allContacts.push(...savedContacts);
    }

    console.log(`📱 Created ${allContacts.length} test contacts (${allContacts.length / users.length} per user)`);
    
    // Show overdue analysis
    this.analyzeOverdueContacts(allContacts);
    
    return allContacts;
  }

  analyzeOverdueContacts(contacts) {
    const now = new Date();
    let overdue = 0;
    let approaching = 0;
    let recent = 0;

    const analysis = contacts.map(contact => {
      const daysSince = Math.floor((now - contact.lastContactDate) / (1000 * 60 * 60 * 24));
      const threshold = contact.customReminderDays || 90;
      const daysOverdue = Math.max(0, daysSince - threshold);
      
      if (daysOverdue > 0) {
        overdue++;
        return { ...contact, status: 'overdue', daysOverdue, daysSince, threshold };
      } else if (daysSince > threshold - 7) {
        approaching++;
        return { ...contact, status: 'approaching', daysOverdue: 0, daysSince, threshold };
      } else {
        recent++;
        return { ...contact, status: 'recent', daysOverdue: 0, daysSince, threshold };
      }
    });

    console.log(`\n📊 Contact Analysis:`);
    console.log(`   - Overdue contacts: ${overdue}`);
    console.log(`   - Approaching reminder (within 7 days): ${approaching}`);
    console.log(`   - Recently contacted: ${recent}`);

    // Show sample overdue contacts
    const overdueExamples = analysis.filter(c => c.status === 'overdue').slice(0, 5);
    if (overdueExamples.length > 0) {
      console.log(`\n   📝 Sample overdue contacts:`);
      overdueExamples.forEach(contact => {
        console.log(`      - ${contact.firstName} ${contact.lastName}: ${contact.daysOverdue} days overdue (${contact.daysSince} days since contact, ${contact.threshold}-day threshold)`);
      });
    }
  }

  async createScenarios() {
    console.log('\n🎭 Creating Special Test Scenarios:');

    const Contact = mongoose.model('TestContact', this.ContactSchema);
    const User = mongoose.model('TestUser', this.UserSchema);
    
    const firstUser = await User.findOne();

    // Scenario 1: Contacts due exactly today
    const todayContacts = [
      {
        userId: firstUser._id.toString(),
        firstName: 'Due',
        lastName: 'Today',
        email: 'due.today@example.com',
        lastContactDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        customReminderDays: 30,
        category: 'test-due-today'
      }
    ];

    // Scenario 2: Edge case dates
    const edgeCases = [
      {
        userId: firstUser._id.toString(),
        firstName: 'Leap',
        lastName: 'Year',
        email: 'leap.year@example.com',
        lastContactDate: new Date('2024-02-29'),
        customReminderDays: 365,
        category: 'edge-case'
      },
      {
        userId: firstUser._id.toString(),
        firstName: 'Invalid',
        lastName: 'Date',
        email: 'invalid.date@example.com',
        lastContactDate: null, // Will use createdAt
        customReminderDays: 30,
        category: 'edge-case'
      }
    ];

    await Contact.insertMany([...todayContacts, ...edgeCases]);
    console.log('   ✅ Created special scenario contacts');
  }

  async run(options = {}) {
    const { clearFirst = true, includeScenarios = true } = options;

    try {
      await this.connect();
      
      if (clearFirst) {
        await this.clearData();
      }

      console.log('\n🚀 Setting up comprehensive test data...\n');

      const users = await this.createUsers();
      const lists = await this.createContactLists(users);
      const contacts = await this.createContacts(users);

      if (includeScenarios) {
        await this.createScenarios();
      }

      console.log('\n✅ Test data setup complete!');
      console.log('\nNext steps:');
      console.log('  🧪 npm run test:reminders:process - Process reminders');
      console.log('  🌐 http://localhost:8025 - View emails in MailHog');
      console.log('  🔍 npm run db:view-contacts - Inspect created contacts');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    clearFirst: !args.includes('--no-clear'),
    includeScenarios: !args.includes('--no-scenarios')
  };

  const setup = new TestDataSetup();
  setup.run(options).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = TestDataSetup;