import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Contact } from '../models/Contact.model';
import { ContactList } from '../models/ContactList.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { ContactCategory } from '@kinect/shared';
import connectDB from '../config/database';

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profile: 'active' | 'moderate' | 'minimal';
}

interface SeedContactList {
  name: string;
  description: string;
  color: string;
}

interface SeedContact {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  birthday?: Date;
  category: ContactCategory;
  listName: string;
  lastContactDaysAgo: number;
  notes?: string;
  customReminderDays?: number;
}

const DEMO_USERS: SeedUser[] = [
  {
    email: 'demo.active@kinect.app',
    password: 'demo123',
    firstName: 'Alex',
    lastName: 'Johnson',
    profile: 'active',
  },
  {
    email: 'demo.moderate@kinect.app',
    password: 'demo123',
    firstName: 'Sarah',
    lastName: 'Chen',
    profile: 'moderate',
  },
  {
    email: 'demo.minimal@kinect.app',
    password: 'demo123',
    firstName: 'Mike',
    lastName: 'Rodriguez',
    profile: 'minimal',
  },
];

const CONTACT_LISTS: SeedContactList[] = [
  { name: 'Best Friends', description: 'My closest friends', color: '#EF4444' },
  { name: 'Family', description: 'Family members', color: '#F59E0B' },
  { name: 'Work', description: 'Professional contacts', color: '#3B82F6' },
  { name: 'College Friends', description: 'University connections', color: '#10B981' },
  { name: 'Neighbors', description: 'People in my neighborhood', color: '#8B5CF6' },
  { name: 'Gym Buddies', description: 'Workout partners', color: '#F97316' },
];

const DEMO_CONTACTS: SeedContact[] = [
  // Best Friends - Should be contacted frequently
  {
    firstName: 'Emma',
    lastName: 'Thompson',
    phoneNumber: '+1-555-0101',
    email: 'emma.t@email.com',
    category: ContactCategory.BEST_FRIEND,
    listName: 'Best Friends',
    lastContactDaysAgo: 15,
    birthday: new Date('1995-03-15'),
    notes: 'Met in college, loves hiking',
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    phoneNumber: '+1-555-0102',
    email: 'j.wilson@email.com',
    category: ContactCategory.BEST_FRIEND,
    listName: 'Best Friends',
    lastContactDaysAgo: 45, // OVERDUE
    birthday: new Date('1993-08-22'),
    notes: 'Best friend since high school',
  },
  {
    firstName: 'Lisa',
    lastName: 'Garcia',
    phoneNumber: '+1-555-0103',
    email: 'lisa.garcia@email.com',
    category: ContactCategory.BEST_FRIEND,
    listName: 'Best Friends',
    lastContactDaysAgo: 5,
    birthday: new Date('1996-12-03'),
    notes: 'Travel buddy, speaks Spanish',
  },

  // Family - Mix of contact frequencies
  {
    firstName: 'Mom',
    lastName: 'Johnson',
    phoneNumber: '+1-555-0201',
    email: 'mom@email.com',
    category: ContactCategory.FRIEND,
    listName: 'Family',
    lastContactDaysAgo: 3,
    birthday: new Date('1965-05-12'),
    notes: 'Call every Sunday',
  },
  {
    firstName: 'Dad',
    lastName: 'Johnson',
    phoneNumber: '+1-555-0202',
    email: 'dad@email.com',
    category: ContactCategory.FRIEND,
    listName: 'Family',
    lastContactDaysAgo: 7,
    birthday: new Date('1963-09-28'),
    notes: 'Loves talking about sports',
  },
  {
    firstName: 'Rachel',
    lastName: 'Johnson',
    phoneNumber: '+1-555-0203',
    email: 'rachel.j@email.com',
    category: ContactCategory.FRIEND,
    listName: 'Family',
    lastContactDaysAgo: 120, // OVERDUE for friends
    birthday: new Date('1998-01-17'),
    notes: 'Younger sister, in college',
  },
  {
    firstName: 'Uncle',
    lastName: 'Bob',
    phoneNumber: '+1-555-0204',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'Family',
    lastContactDaysAgo: 200, // OVERDUE for acquaintance
    birthday: new Date('1960-07-04'),
    notes: "Dad's brother, lives in Texas",
  },

  // Work - Professional contacts
  {
    firstName: 'David',
    lastName: 'Kumar',
    phoneNumber: '+1-555-0301',
    email: 'dkumar@company.com',
    category: ContactCategory.FRIEND,
    listName: 'Work',
    lastContactDaysAgo: 30,
    notes: 'Team lead, great mentor',
    customReminderDays: 60,
  },
  {
    firstName: 'Jennifer',
    lastName: 'Lee',
    phoneNumber: '+1-555-0302',
    email: 'jlee@company.com',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'Work',
    lastContactDaysAgo: 90,
    notes: 'Project manager, very organized',
  },
  {
    firstName: 'Mark',
    lastName: 'Stevens',
    phoneNumber: '+1-555-0303',
    email: 'mstevens@company.com',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'Work',
    lastContactDaysAgo: 250, // OVERDUE
    notes: 'Former colleague, now at different company',
  },

  // College Friends - Mix of engagement levels
  {
    firstName: 'Sophie',
    lastName: 'Miller',
    phoneNumber: '+1-555-0401',
    email: 'sophie.m@email.com',
    category: ContactCategory.FRIEND,
    listName: 'College Friends',
    lastContactDaysAgo: 60,
    birthday: new Date('1994-11-25'),
    notes: 'Roommate freshman year',
  },
  {
    firstName: 'Alex',
    lastName: 'Brown',
    phoneNumber: '+1-555-0402',
    email: 'alex.brown@email.com',
    category: ContactCategory.FRIEND,
    listName: 'College Friends',
    lastContactDaysAgo: 150, // OVERDUE
    birthday: new Date('1995-06-30'),
    notes: 'Study group partner',
  },
  {
    firstName: 'Tyler',
    lastName: 'Davis',
    phoneNumber: '+1-555-0403',
    email: 'tyler.d@email.com',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'College Friends',
    lastContactDaysAgo: 365, // Way overdue
    notes: 'Fraternity brother, lives in Seattle',
  },

  // Neighbors - Local connections
  {
    firstName: 'Nancy',
    lastName: 'Wong',
    phoneNumber: '+1-555-0501',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'Neighbors',
    lastContactDaysAgo: 45,
    notes: 'Next door, has two dogs',
  },
  {
    firstName: 'Bill',
    lastName: 'Thompson',
    phoneNumber: '+1-555-0502',
    category: ContactCategory.ACQUAINTANCE,
    listName: 'Neighbors',
    lastContactDaysAgo: 90,
    notes: 'Across the street, retired teacher',
  },

  // Gym Buddies - Activity-based friends
  {
    firstName: 'Carlos',
    lastName: 'Mendez',
    phoneNumber: '+1-555-0601',
    email: 'carlos.m@email.com',
    category: ContactCategory.FRIEND,
    listName: 'Gym Buddies',
    lastContactDaysAgo: 10,
    notes: 'Workout partner, morning routine',
  },
  {
    firstName: 'Jessica',
    lastName: 'Park',
    phoneNumber: '+1-555-0602',
    email: 'jess.park@email.com',
    category: ContactCategory.FRIEND,
    listName: 'Gym Buddies',
    lastContactDaysAgo: 100, // OVERDUE
    notes: 'Yoga class friend, very zen',
  },
];

const COMMUNICATION_TYPES = ['PHONE_CALL', 'TEXT', 'EMAIL', 'IN_PERSON', 'OTHER'] as const;

function getRandomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo + Math.floor(Math.random() * 7) - 3); // Add some randomness
  return date;
}

function generateCommunicationLogs(
  userId: string,
  contactId: string,
  lastContactDaysAgo: number
): any[] {
  const logs = [];
  const numLogs = Math.floor(Math.random() * 5) + 2; // 2-6 logs per contact

  for (let i = 0; i < numLogs; i++) {
    const daysAgo = lastContactDaysAgo + (i * Math.floor(Math.random() * 30) + 10);
    const type = COMMUNICATION_TYPES[Math.floor(Math.random() * COMMUNICATION_TYPES.length)];

    logs.push({
      userId,
      contactId,
      type,
      timestamp: getRandomPastDate(daysAgo),
      duration: type === 'PHONE_CALL' ? Math.floor(Math.random() * 1800) + 60 : undefined, // 1-30 minutes
      notes: generateCommNotes(type),
    });
  }

  return logs;
}

function generateCommNotes(type: string): string {
  const phoneNotes = [
    'Quick catch up',
    'Long chat',
    'Birthday call',
    'Just checking in',
    'Made dinner plans',
  ];
  const textNotes = [
    'Sent funny meme',
    'Quick question',
    'Made plans',
    'Shared photo',
    'Good morning text',
  ];
  const emailNotes = [
    'Work update',
    'Shared article',
    'Event invitation',
    'Follow up',
    'Newsletter forward',
  ];
  const inPersonNotes = [
    'Coffee meetup',
    'Dinner together',
    'Ran into at store',
    'Gym session',
    'House party',
  ];
  const otherNotes = [
    'Social media interaction',
    'Video call',
    'Left voicemail',
    'Sent card',
    'Group chat',
  ];

  switch (type) {
    case 'PHONE_CALL':
      return phoneNotes[Math.floor(Math.random() * phoneNotes.length)];
    case 'TEXT':
      return textNotes[Math.floor(Math.random() * textNotes.length)];
    case 'EMAIL':
      return emailNotes[Math.floor(Math.random() * emailNotes.length)];
    case 'IN_PERSON':
      return inPersonNotes[Math.floor(Math.random() * inPersonNotes.length)];
    default:
      return otherNotes[Math.floor(Math.random() * otherNotes.length)];
  }
}

export async function seedDatabase(): Promise<void> {
  console.warn('🌱 Starting database seed...');

  try {
    await connectDB();

    // Clear existing data
    console.warn('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } }),
      Contact.deleteMany({}),
      ContactList.deleteMany({}),
      CommunicationLog.deleteMany({}),
    ]);

    // Create demo users
    console.warn('👥 Creating demo users...');
    const createdUsers = [];

    for (const userData of DEMO_USERS) {
      // Don't hash password here - the User model pre-save hook will handle it
      const user = await User.create({
        ...userData,
        password: userData.password,
      });
      createdUsers.push(user);
      console.warn(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    }

    // Create contact lists and contacts for each user
    for (let userIndex = 0; userIndex < createdUsers.length; userIndex++) {
      const user = createdUsers[userIndex];
      const profile = DEMO_USERS[userIndex].profile;

      console.warn(`📋 Creating lists and contacts for ${user.firstName}...`);

      // Determine how many lists and contacts based on profile
      const listCount = profile === 'active' ? 6 : profile === 'moderate' ? 4 : 2;
      const listsToCreate = CONTACT_LISTS.slice(0, listCount);

      // Create contact lists
      const createdLists = [];
      for (const listData of listsToCreate) {
        const list = await ContactList.create({
          ...listData,
          userId: user._id?.toString(),
        });
        createdLists.push(list);
      }

      // Filter contacts based on available lists
      const availableListNames = createdLists.map((l) => l.name);
      const contactsForUser = DEMO_CONTACTS.filter((c) => availableListNames.includes(c.listName));

      // Adjust contact count based on profile
      const contactCount =
        profile === 'active'
          ? contactsForUser.length
          : profile === 'moderate'
            ? Math.ceil(contactsForUser.length * 0.7)
            : Math.ceil(contactsForUser.length * 0.4);

      const contactsToCreate = contactsForUser.slice(0, contactCount);

      // Create contacts
      const createdContacts = [];
      for (const contactData of contactsToCreate) {
        const list = createdLists.find((l) => l.name === contactData.listName);
        const contact = await Contact.create({
          ...contactData,
          userId: user._id?.toString(),
          listId: list?._id?.toString(),
          lastContactDate: getRandomPastDate(contactData.lastContactDaysAgo),
        });
        createdContacts.push(contact);

        // Generate communication logs for this contact
        const logs = generateCommunicationLogs(
          user._id?.toString() || '',
          contact._id?.toString() || '',
          contactData.lastContactDaysAgo
        );

        await CommunicationLog.insertMany(logs);
      }

      console.warn(
        `✅ Created ${createdLists.length} lists and ${createdContacts.length} contacts for ${user.firstName}`
      );
    }

    console.warn('🎉 Database seeding completed successfully!');

    // Print summary
    const userCount = await User.countDocuments({ email: { $in: DEMO_USERS.map((u) => u.email) } });
    const contactCount = await Contact.countDocuments();
    const listCount = await ContactList.countDocuments();
    const logCount = await CommunicationLog.countDocuments();

    console.warn('\n📊 Seed Summary:');
    console.warn(`   Users: ${userCount}`);
    console.warn(`   Contact Lists: ${listCount}`);
    console.warn(`   Contacts: ${contactCount}`);
    console.warn(`   Communication Logs: ${logCount}`);

    console.warn('\n🔐 Demo Login Credentials:');
    DEMO_USERS.forEach((user) => {
      console.warn(`   ${user.firstName} (${user.profile}): ${user.email} / ${user.password}`);
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

export async function resetDatabase(): Promise<void> {
  console.warn('🔄 Resetting database...');

  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Contact.deleteMany({}),
      ContactList.deleteMany({}),
      CommunicationLog.deleteMany({}),
    ]);

    console.warn('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

export async function seedDemoDataForUser(user: any): Promise<void> {
  console.warn(`🌱 Seeding demo data for user: ${user.firstName} ${user.lastName}...`);

  try {
    // Determine profile type based on email
    const profile = user.email.includes('active')
      ? 'active'
      : user.email.includes('moderate')
        ? 'moderate'
        : 'minimal';

    // Determine how many lists and contacts based on profile
    const listCount = profile === 'active' ? 6 : profile === 'moderate' ? 4 : 2;
    const listsToCreate = CONTACT_LISTS.slice(0, listCount);

    // Create contact lists
    const createdLists = [];
    for (const listData of listsToCreate) {
      const list = await ContactList.create({
        ...listData,
        userId: user._id?.toString(),
      });
      createdLists.push(list);
    }

    // Filter contacts based on available lists
    const availableListNames = createdLists.map((l) => l.name);
    const contactsForUser = DEMO_CONTACTS.filter((c) => availableListNames.includes(c.listName));

    // Adjust contact count based on profile
    const contactCount =
      profile === 'active'
        ? contactsForUser.length
        : profile === 'moderate'
          ? Math.ceil(contactsForUser.length * 0.7)
          : Math.ceil(contactsForUser.length * 0.4);

    const contactsToCreate = contactsForUser.slice(0, contactCount);

    // Create contacts
    const createdContacts = [];
    for (const contactData of contactsToCreate) {
      const list = createdLists.find((l) => l.name === contactData.listName);
      const contact = await Contact.create({
        ...contactData,
        userId: user._id?.toString(),
        listId: list?._id?.toString(),
        lastContactDate: getRandomPastDate(contactData.lastContactDaysAgo),
      });
      createdContacts.push(contact);

      // Generate communication logs for this contact
      const logs = generateCommunicationLogs(
        user._id?.toString() || '',
        contact._id?.toString() || '',
        contactData.lastContactDaysAgo
      );

      await CommunicationLog.insertMany(logs);
    }

    console.warn(
      `✅ Seeded ${createdLists.length} lists and ${createdContacts.length} contacts for ${user.firstName}`
    );
  } catch (error) {
    console.error('❌ Seeding for user failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'reset') {
    resetDatabase().catch(console.error);
  } else {
    seedDatabase().catch(console.error);
  }
}
