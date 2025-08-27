import { EventEmitter } from 'events';
import * as cron from 'node-cron';
import { Contact } from '../models/Contact.model';
import { ContactList } from '../models/ContactList.model';
import { User } from '../models/User.model';
import selfHostedConfig from '../config/selfhosted.config';

export interface LocalNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

/**
 * Local notification service for self-hosted installations
 * Replaces cloud-based push notifications with local notifications
 */
export class LocalNotificationService extends EventEmitter {
  private notifications: Map<string, LocalNotification[]> = new Map();
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    super();
    this.initializeScheduler();
  }

  /**
   * Initialize the notification scheduler
   */
  private initializeScheduler(): void {
    if (!selfHostedConfig.notifications.enabled) {
      return;
    }

    // Run every hour to check for overdue contacts
    this.cronJob = cron.schedule('0 * * * *', async () => {
      await this.checkOverdueContacts();
    });

    this.cronJob.start();
    console.log('📨 Local notification scheduler started');
  }

  /**
   * Check for overdue contacts and send notifications
   */
  private async checkOverdueContacts(): Promise<void> {
    try {
      const users = await User.find({ 
        isActive: true,
        'preferences.notifications.enabled': { $ne: false }
      });

      for (const user of users) {
        const userId = (user._id as any).toString();
        const overdueContacts = await this.getOverdueContactsForUser(userId);
        
        if (overdueContacts.length > 0) {
          await this.sendOverdueContactsNotification(userId, overdueContacts);
        }
      }
    } catch (error) {
      console.error('Error checking overdue contacts:', error);
    }
  }

  /**
   * Get overdue contacts for a specific user
   */
  private async getOverdueContactsForUser(userId: string): Promise<any[]> {
    const now = new Date();
    const contacts = await Contact.find({ userId });
    const lists = await ContactList.find({ userId });
    
    // Create a map of list IDs to reminder days
    const listReminderMap = new Map<string, number>();
    lists.forEach(list => {
      if (list.reminderDays !== undefined) {
        listReminderMap.set(list._id!.toString(), list.reminderDays);
      }
    });
    
    return contacts.filter(contact => {
      if (!contact.lastContactDate) return false;
      
      const daysSinceContact = Math.floor(
        (now.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Determine reminder interval: custom > list > default (90 days)
      let reminderInterval = contact.customReminderDays;
      if (!reminderInterval && contact.listId) {
        reminderInterval = listReminderMap.get(contact.listId) || 90;
      }
      if (!reminderInterval) {
        reminderInterval = 90; // Default
      }
      
      return daysSinceContact >= reminderInterval;
    });
  }


  /**
   * Send a local notification
   */
  public async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    const notification: LocalNotification = {
      id: this.generateNotificationId(),
      userId,
      title,
      body,
      data,
      timestamp: new Date(),
      read: false,
    };

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId)!;
    userNotifications.unshift(notification);
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }

    // Emit notification event for real-time updates
    this.emit('notification', notification);
    
    console.log(`📨 Notification sent to user ${userId}: ${title}`);
  }

  /**
   * Send overdue contacts notification
   */
  private async sendOverdueContactsNotification(
    userId: string,
    overdueContacts: any[]
  ): Promise<void> {
    const count = overdueContacts.length;
    const title = count === 1 
      ? 'Time to reconnect!' 
      : `${count} contacts need attention`;
    
    const contactNames = overdueContacts
      .slice(0, 3)
      .map(c => c.name)
      .join(', ');
    
    const body = count === 1
      ? `It's been a while since you contacted ${contactNames}`
      : `You haven't contacted ${contactNames}${count > 3 ? ` and ${count - 3} others` : ''} recently`;

    await this.sendNotification(userId, title, body, {
      type: 'overdue_contacts',
      contactIds: overdueContacts.map(c => c._id.toString()),
    });
  }

  /**
   * Get notifications for a user
   */
  public getNotifications(userId: string, limit = 20): LocalNotification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(0, limit);
  }

  /**
   * Get unread notification count for a user
   */
  public getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  public markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  public markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      userNotifications.forEach(n => n.read = true);
    }
  }

  /**
   * Clear all notifications for a user
   */
  public clearNotifications(userId: string): void {
    this.notifications.delete(userId);
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send birthday reminder
   */
  public async sendBirthdayReminder(userId: string, contact: any): Promise<void> {
    await this.sendNotification(
      userId,
      `🎂 ${contact.name}'s Birthday!`,
      `Don't forget to wish ${contact.name} a happy birthday today!`,
      {
        type: 'birthday',
        contactId: contact._id.toString(),
      }
    );
  }

  /**
   * Send custom reminder
   */
  public async sendCustomReminder(
    userId: string,
    title: string,
    message: string,
    contactId?: string
  ): Promise<void> {
    await this.sendNotification(userId, title, message, {
      type: 'custom',
      contactId,
    });
  }

  /**
   * Stop the notification scheduler
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  /**
   * Get notification statistics
   */
  public getStats(): {
    totalNotifications: number;
    activeUsers: number;
    avgNotificationsPerUser: number;
  } {
    const totalNotifications = Array.from(this.notifications.values())
      .reduce((sum, notifications) => sum + notifications.length, 0);
    
    const activeUsers = this.notifications.size;
    const avgNotificationsPerUser = activeUsers > 0 ? totalNotifications / activeUsers : 0;

    return {
      totalNotifications,
      activeUsers,
      avgNotificationsPerUser: Math.round(avgNotificationsPerUser * 100) / 100,
    };
  }
}

// Export singleton instance
export const localNotificationService = new LocalNotificationService();
export default localNotificationService;