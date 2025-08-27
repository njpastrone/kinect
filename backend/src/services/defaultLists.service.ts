import { ContactList } from '../models/ContactList.model';
import { DEFAULT_LISTS } from '@kinect/shared';

export class DefaultListsService {
  /**
   * Create default lists for a new user
   */
  static async createDefaultListsForUser(userId: string): Promise<void> {
    try {
      // Check if user already has lists
      const existingLists = await ContactList.countDocuments({ userId });
      
      if (existingLists > 0) {
        return; // User already has lists, don't create defaults
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

      await ContactList.insertMany(defaultLists);
      console.log(`Created ${defaultLists.length} default lists for user ${userId}`);
    } catch (error) {
      console.error('Error creating default lists:', error);
      // Don't throw - this is a nice-to-have feature
    }
  }

  /**
   * Get suggested lists for migration from categories
   */
  static getSuggestedListForCategory(category: string): string {
    switch (category?.toUpperCase()) {
      case 'BEST_FRIEND':
        return 'Best Friends';
      case 'FRIEND':
        return 'Friends';
      case 'ACQUAINTANCE':
        return 'Acquaintances';
      default:
        return 'Friends'; // Default fallback
    }
  }
}