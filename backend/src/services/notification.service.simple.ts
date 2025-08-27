import cron from 'node-cron';
import { User } from '../models/User.model';
import { Contact } from '../models/Contact.model';
import { ContactList } from '../models/ContactList.model';
import { emailService } from './email.service';

interface OverdueContact {
  name: string;
  daysSince: number;
  email?: string;
  phone?: string;
}

class NotificationService {
  private isRunning = false;

  constructor() {
    this.initializeCronJobs();
  }

  private initializeCronJobs() {
    // Weekly check on Monday at 9 AM
    cron.schedule('0 9 * * 1', () => {
      this.processWeeklyReminders().catch((error) => {
        console.error('Weekly reminders processing failed:', error);
      });
    });

    console.log('📅 Notification cron jobs initialized');
  }

  async processWeeklyReminders() {
    console.log('🔄 Processing weekly reminders...');

    if (this.isRunning) {
      console.log('⏳ Notification processing already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const users = await User.find({});
      let processedUsers = 0;
      let sentEmails = 0;

      for (const user of users) {
        try {
          const overdueContacts = await this.getOverdueContacts(String(user._id));

          if (overdueContacts.length === 0) {
            continue;
          }

          // Limit to 5 contacts per email
          const contactsToNotify = overdueContacts.slice(0, 5);

          await emailService.sendContactReminderEmail(user.toJSON() as any, contactsToNotify);
          sentEmails++;
          processedUsers++;

          // Add delay to avoid overwhelming email service
          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to process reminders for user ${user.email}:`, error);
        }
      }

      console.log(`✅ Processed ${processedUsers} users, sent ${sentEmails} reminder emails`);
    } catch (error) {
      console.error('❌ Failed to process reminders:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async getOverdueContacts(userId: string): Promise<OverdueContact[]> {
    try {
      const contacts = await Contact.find({ userId });
      const lists = await ContactList.find({ userId });
      const overdueContacts: OverdueContact[] = [];

      // Create a map of list IDs to reminder days
      const listReminderMap = new Map<string, number>();
      lists.forEach(list => {
        if (list.reminderDays !== undefined) {
          listReminderMap.set(list._id!.toString(), list.reminderDays);
        }
      });

      for (const contact of contacts) {
        const daysSinceLastContact = this.getDaysSinceLastContact(contact.lastContactDate);
        const reminderThreshold = await this.getReminderThreshold(contact, listReminderMap);

        if (daysSinceLastContact > reminderThreshold) {
          overdueContacts.push({
            name: `${contact.firstName} ${contact.lastName}`,
            daysSince: daysSinceLastContact,
            email: contact.email || undefined,
            phone: contact.phoneNumber || undefined,
          });
        }
      }

      // Sort by days since last contact (most overdue first)
      return overdueContacts.sort((a, b) => b.daysSince - a.daysSince);
    } catch (error) {
      console.error('Failed to get overdue contacts:', error);
      return [];
    }
  }

  private getDaysSinceLastContact(lastContactDate?: Date): number {
    if (!lastContactDate) {
      return 365; // Treat as very old if no contact date
    }

    const today = new Date();
    const diffTime = today.getTime() - lastContactDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getReminderThreshold(contact: any, listReminderMap?: Map<string, number>): Promise<number> {
    if (contact.customReminderDays) {
      return contact.customReminderDays;
    }

    // Use list reminder days if available
    if (contact.listId && listReminderMap) {
      const listReminderDays = listReminderMap.get(contact.listId);
      if (listReminderDays !== undefined) {
        return listReminderDays;
      }
    }

    // Default fallback
    return 90;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Manual trigger for testing
  async sendTestReminder(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const overdueContacts = await this.getOverdueContacts(userId);

      if (overdueContacts.length === 0) {
        console.log('No overdue contacts found for test reminder');
        return;
      }

      await emailService.sendContactReminderEmail(
        user.toJSON() as any,
        overdueContacts.slice(0, 3)
      );
      console.log(`✅ Test reminder sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send test reminder:', error);
      throw error;
    }
  }

  // Get reminder stats for dashboard
  async getReminderStats(userId: string): Promise<{
    overdueCount: number;
    upcomingCount: number;
  }> {
    try {
      const contacts = await Contact.find({ userId });
      const lists = await ContactList.find({ userId });
      let overdueCount = 0;
      let upcomingCount = 0;

      // Create a map of list IDs to reminder days
      const listReminderMap = new Map<string, number>();
      lists.forEach(list => {
        if (list.reminderDays !== undefined) {
          listReminderMap.set(list._id!.toString(), list.reminderDays);
        }
      });

      for (const contact of contacts) {
        const daysSince = this.getDaysSinceLastContact(contact.lastContactDate);
        const threshold = await this.getReminderThreshold(contact, listReminderMap);

        if (daysSince > threshold) {
          overdueCount++;
        } else if (daysSince > threshold - 7) {
          // Within 7 days of being overdue
          upcomingCount++;
        }
      }

      return { overdueCount, upcomingCount };
    } catch (error) {
      console.error('Failed to get reminder stats:', error);
      return { overdueCount: 0, upcomingCount: 0 };
    }
  }
}

export const notificationService = new NotificationService();
