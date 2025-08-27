/**
 * Migration Script: Categories to Lists Consolidation
 * 
 * This script migrates existing contacts from category-based organization
 * to list-based organization by:
 * 1. Creating default lists for existing users
 * 2. Migrating contacts to appropriate lists based on their categories
 * 3. Removing category field from contacts
 */

import mongoose from 'mongoose';
import { Contact } from '../models/Contact.model';
import { ContactList } from '../models/ContactList.model';
import { User } from '../models/User.model';
import { DEFAULT_LISTS } from '@kinect/shared';

interface ContactWithCategory extends mongoose.Document {
  userId: string;
  listId?: string;
  category?: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface ListMapping {
  [userId: string]: {
    [listName: string]: string; // list name -> list _id
  };
}

async function migrateCategoriestoLists() {
  console.log('🚀 Starting Categories → Lists migration...');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kinect');
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);

    const listMapping: ListMapping = {};

    // Step 1: Create default lists for all users
    console.log('\n📋 Step 1: Creating default lists...');
    for (const user of users) {
      const userId = user._id!.toString();
      
      // Check if user already has lists
      const existingLists = await ContactList.find({ userId });
      if (existingLists.length > 0) {
        console.log(`⏭️  User ${user.email} already has lists, skipping default creation`);
        // Map existing lists
        listMapping[userId] = {};
        existingLists.forEach(list => {
          listMapping[userId][list.name] = list._id!.toString();
        });
        continue;
      }

      // Create default lists
      const defaultLists = DEFAULT_LISTS.map(template => ({
        userId,
        name: template.name,
        description: template.description,
        color: template.color,
        reminderDays: template.reminderDays,
        contactIds: [],
      }));

      const createdLists = await ContactList.insertMany(defaultLists);
      console.log(`✨ Created ${createdLists.length} default lists for ${user.email}`);

      // Build mapping
      listMapping[userId] = {};
      createdLists.forEach(list => {
        listMapping[userId][list.name] = list._id!.toString();
      });
    }

    // Step 2: Migrate contacts from categories to lists
    console.log('\n👥 Step 2: Migrating contacts...');
    const contacts = await Contact.find({}).lean() as ContactWithCategory[];
    console.log(`📊 Found ${contacts.length} contacts to migrate`);

    let migratedCount = 0;
    const migrationStats = {
      'Best Friends': 0,
      'Friends': 0,
      'Acquaintances': 0,
      'No category': 0,
    };

    for (const contact of contacts) {
      const userId = contact.userId;
      const userLists = listMapping[userId];
      
      if (!userLists) {
        console.warn(`⚠️  No lists found for user ${userId}, skipping contact ${contact.firstName} ${contact.lastName}`);
        continue;
      }

      // Skip if contact already has a list assigned
      if (contact.listId) {
        console.log(`⏭️  Contact ${contact.firstName} ${contact.lastName} already has listId, skipping`);
        continue;
      }

      // Determine target list based on category
      let targetListName = 'Friends'; // Default
      switch (contact.category?.toUpperCase()) {
        case 'BEST_FRIEND':
          targetListName = 'Best Friends';
          migrationStats['Best Friends']++;
          break;
        case 'FRIEND':
          targetListName = 'Friends';
          migrationStats['Friends']++;
          break;
        case 'ACQUAINTANCE':
          targetListName = 'Acquaintances';
          migrationStats['Acquaintances']++;
          break;
        default:
          targetListName = 'Friends';
          migrationStats['No category']++;
      }

      const targetListId = userLists[targetListName];
      if (!targetListId) {
        console.warn(`⚠️  Target list "${targetListName}" not found for user ${userId}`);
        continue;
      }

      // Update contact with listId
      await Contact.updateOne(
        { _id: contact._id },
        { 
          $set: { listId: targetListId },
          $unset: { category: "" } // Remove category field
        }
      );

      // Add contact to list's contactIds array
      await ContactList.updateOne(
        { _id: targetListId },
        { $addToSet: { contactIds: contact._id!.toString() } }
      );

      migratedCount++;
    }

    console.log(`\n📈 Migration Statistics:`);
    console.log(`   Contacts migrated: ${migratedCount}/${contacts.length}`);
    console.log(`   → Best Friends: ${migrationStats['Best Friends']}`);
    console.log(`   → Friends: ${migrationStats['Friends']}`);
    console.log(`   → Acquaintances: ${migrationStats['Acquaintances']}`);
    console.log(`   → No category: ${migrationStats['No category']}`);

    // Step 3: Remove category field from Contact schema (manual step)
    console.log('\n🗑️  Step 3: Category field removal');
    console.log('   ℹ️  The category field has been removed from new documents.');
    console.log('   ℹ️  Existing documents will ignore the old category field.');
    console.log('   ℹ️  Run db.contacts.updateMany({}, {$unset: {category: ""}}) to clean up existing docs.');

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateCategoriestoLists().catch(console.error);
}

export { migrateCategoriestoLists };