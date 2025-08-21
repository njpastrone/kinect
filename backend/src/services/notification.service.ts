import cron from 'node-cron';
import { User } from '../models/User.model';
import { Contact } from '../models/Contact.model';
import { emailService } from './email.service';
import { ContactCategory } from '@kinect/shared';

interface OverdueContact {
  name: string;
  daysSince: number;
  email?: string;
  phone?: string;
  listName?: string;
}

interface UserNotificationPreferences {
  emailReminders: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  quietHours: { start: number; end: number }; // 24-hour format
  maxContactsPerEmail: number;
}

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  emailReminders: true,
  reminderFrequency: 'weekly',
  quietHours: { start: 22, end: 8 }, // 10 PM to 8 AM
  maxContactsPerEmail: 5,
};

class NotificationService {
  private isRunning = false;

  constructor() {
    this.initializeCronJobs();
  }

  private initializeCronJobs() {
    // Daily check at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.processDailyReminders().catch((error) => {
        console.error('Daily reminders processing failed:', error);
      });
    });

    // Weekly check on Monday at 9 AM
    cron.schedule('0 9 * * 1', () => {
      this.processWeeklyReminders().catch((error) => {
        console.error('Weekly reminders processing failed:', error);
      });
    });

    // Monthly check on 1st of month at 9 AM
    cron.schedule('0 9 1 * *', () => {
      this.processMonthlyReminders().catch((error) => {
        console.error('Monthly reminders processing failed:', error);
      });
    });

    console.log('📅 Notification cron jobs initialized');
  }

  async processDailyReminders() {
    console.log('🔄 Processing daily reminders...');
    await this.processReminders('daily');
  }

  async processWeeklyReminders() {
    console.log('🔄 Processing weekly reminders...');
    await this.processReminders('weekly');
  }

  async processMonthlyReminders() {
    console.log('🔄 Processing monthly reminders...');
    await this.processReminders('monthly');
  }

  private async processReminders(frequency: 'daily' | 'weekly' | 'monthly') {
    if (this.isRunning) {
      console.log('⏳ Notification processing already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    let processedUsers = 0;
    let sentEmails = 0;

    try {
      // Get all users who want reminders at this frequency
      const users = await User.find({
        // Note: In production, you'd filter by user preferences stored in DB
        // For now, we'll use default preferences
      });

      for (const user of users) {
        try {
          const preferences = this.getUserPreferences(user);

          if (!preferences.emailReminders || preferences.reminderFrequency !== frequency) {
            continue;
          }

          const overdueContacts = await this.getOverdueContacts(user._id?.toString() || '');

          if (overdueContacts.length === 0) {
            continue;
          }

          // Respect max contacts per email
          const contactsToNotify = overdueContacts.slice(0, preferences.maxContactsPerEmail);

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
      const contacts = await Contact.find({ userId }).populate('listId');
      const overdueContacts: OverdueContact[] = [];

      for (const contact of contacts) {
        const daysSinceLastContact = this.getDaysSinceLastContact(contact.lastContactDate);
        const reminderThreshold = this.getReminderThreshold(contact);

        if (daysSinceLastContact > reminderThreshold) {
          overdueContacts.push({
            name: `${contact.firstName} ${contact.lastName}`,
            daysSince: daysSinceLastContact,
            email: contact.email || undefined,
            phone: contact.phoneNumber || undefined,
            listName: (contact.listId as any)?.name || 'Default',
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

  private getReminderThreshold(contact: any): number {
    if (contact.customReminderDays) {
      return contact.customReminderDays;
    }

    // Use list-specific reminder interval if available
    if ((contact.listId as any)?.reminderDays) {
      return (contact.listId as any).reminderDays;
    }

    // Default based on category
    switch (contact.category) {
      case ContactCategory.BEST_FRIEND:
        return 30;
      case ContactCategory.FRIEND:
        return 90;
      case ContactCategory.ACQUAINTANCE:
        return 180;
      default:
        return 90;
    }
  }

  private getUserPreferences(_user: any): UserNotificationPreferences {
    // In production, this would come from user settings in the database
    // For now, return default preferences
    return DEFAULT_PREFERENCES;
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
    nextReminderDate?: Date;
  }> {
    try {
      const contacts = await Contact.find({ userId });
      let overdueCount = 0;
      let upcomingCount = 0;

      for (const contact of contacts) {
        const daysSince = this.getDaysSinceLastContact(contact.lastContactDate);
        const threshold = this.getReminderThreshold(contact);

        if (daysSince > threshold) {
          overdueCount++;
        } else if (daysSince > threshold - 7) {
          // Within 7 days of being overdue
          upcomingCount++;
        }
      }

      // Calculate next reminder date based on user preferences
      const preferences = DEFAULT_PREFERENCES;
      const nextReminderDate = this.getNextReminderDate(preferences.reminderFrequency);

      return {
        overdueCount,
        upcomingCount,
        nextReminderDate,
      };
    } catch (error) {
      console.error('Failed to get reminder stats:', error);
      return { overdueCount: 0, upcomingCount: 0 };
    }
  }

  private getNextReminderDate(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7) || 7); // Next Monday
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1, 1); // First of next month
        break;
    }

    next.setHours(9, 0, 0, 0); // 9 AM
    return next;
  }
}

export const notificationService = new NotificationService();
