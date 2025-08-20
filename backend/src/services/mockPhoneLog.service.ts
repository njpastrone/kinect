import { Contact } from '../models/Contact.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { User } from '../models/User.model';

export interface MockPhoneEvent {
  contactPhoneNumber: string;
  type: 'PHONE_CALL' | 'TEXT';
  timestamp: Date;
  duration?: number; // in seconds, for calls
  direction: 'INCOMING' | 'OUTGOING';
  answered?: boolean; // for calls
}

export interface PhoneLogSyncResult {
  processedEvents: number;
  updatedContacts: number;
  newLogs: number;
  errors: string[];
}

export class MockPhoneLogService {
  private isRunning = false;
  private syncInterval?: ReturnType<typeof setInterval>;
  
  /**
   * Simulates phone log sync for a user by generating random communication events
   */
  async syncUserPhoneLogs(userId: string): Promise<PhoneLogSyncResult> {
    console.warn(`📞 Syncing phone logs for user: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's contacts with phone numbers
    const contacts = await Contact.find({ 
      userId,
      phoneNumber: { $exists: true, $ne: '' }
    });
    
    if (contacts.length === 0) {
      return {
        processedEvents: 0,
        updatedContacts: 0,
        newLogs: 0,
        errors: ['No contacts with phone numbers found']
      };
    }
    
    // Generate random events for the last 24 hours
    const events = this.generateRandomEvents(contacts, 1);
    
    return this.processEvents(userId, events);
  }
  
  /**
   * Processes mock phone events and updates contacts/logs
   */
  async processEvents(userId: string, events: MockPhoneEvent[]): Promise<PhoneLogSyncResult> {
    const result: PhoneLogSyncResult = {
      processedEvents: 0,
      updatedContacts: 0,
      newLogs: 0,
      errors: []
    };
    
    for (const event of events) {
      try {
        // Find contact by phone number
        const contact = await Contact.findOne({
          userId,
          phoneNumber: { $regex: event.contactPhoneNumber.replace(/\D/g, '') }
        });
        
        if (!contact) {
          result.errors.push(`Contact not found for phone: ${event.contactPhoneNumber}`);
          continue;
        }
        
        // Create communication log
        await CommunicationLog.create({
          userId,
          contactId: contact._id?.toString(),
          type: event.type,
          timestamp: event.timestamp,
          duration: event.duration,
          notes: this.generateEventNotes(event)
        });
        
        // Update contact's last contact date if this event is more recent
        if (event.timestamp > contact.lastContactDate) {
          await Contact.findByIdAndUpdate(contact._id, {
            lastContactDate: event.timestamp
          });
          result.updatedContacts++;
        }
        
        result.newLogs++;
        result.processedEvents++;
        
      } catch (error) {
        result.errors.push(`Error processing event: ${error}`);
      }
    }
    
    console.warn(`✅ Phone log sync completed: ${result.processedEvents} events processed`);
    return result;
  }
  
  /**
   * Generates random phone events for contacts over specified days
   */
  generateRandomEvents(contacts: any[], days: number = 7): MockPhoneEvent[] {
    const events: MockPhoneEvent[] = [];
    const now = new Date();
    
    // Generate events for each day
    for (let day = 0; day < days; day++) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - day);
      
      // Random number of events per day (0-5)
      const eventsPerDay = Math.floor(Math.random() * 6);
      
      for (let i = 0; i < eventsPerDay; i++) {
        const contact = contacts[Math.floor(Math.random() * contacts.length)];
        const eventType = Math.random() > 0.3 ? 'TEXT' : 'PHONE_CALL';
        const direction = Math.random() > 0.5 ? 'OUTGOING' : 'INCOMING';
        
        // Random time during the day
        const eventTime = new Date(dayDate);
        eventTime.setHours(
          Math.floor(Math.random() * 16) + 6, // 6 AM to 10 PM
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );
        
        const event: MockPhoneEvent = {
          contactPhoneNumber: contact.phoneNumber,
          type: eventType,
          timestamp: eventTime,
          direction
        };
        
        if (eventType === 'PHONE_CALL') {
          event.answered = Math.random() > 0.2; // 80% answered
          event.duration = event.answered 
            ? Math.floor(Math.random() * 1800) + 30 // 30 seconds to 30 minutes
            : undefined;
        }
        
        events.push(event);
      }
    }
    
    // Sort events by timestamp (newest first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Generates realistic notes for phone events
   */
  private generateEventNotes(event: MockPhoneEvent): string {
    const { type, direction, answered, duration } = event;
    
    if (type === 'TEXT') {
      const textNotes = [
        'Quick text exchange',
        'Shared a photo',
        'Made plans to meet up',
        'Sent funny meme',
        'Quick question and answer',
        'Good morning/evening text'
      ];
      return textNotes[Math.floor(Math.random() * textNotes.length)];
    }
    
    // Phone call notes
    if (!answered) {
      return direction === 'OUTGOING' ? 'Missed call (unanswered)' : 'Missed call from contact';
    }
    
    const callNotes = [];
    
    if (duration && duration < 60) {
      callNotes.push('Quick check-in', 'Brief conversation', 'Quick question');
    } else if (duration && duration < 300) {
      callNotes.push('Regular catch-up', 'Made plans', 'Discussed work');
    } else if (duration && duration < 900) {
      callNotes.push('Long conversation', 'Deep catch-up', 'Heart-to-heart');
    } else {
      callNotes.push('Extended chat', 'Long overdue catch-up', 'Marathon conversation');
    }
    
    return callNotes[Math.floor(Math.random() * callNotes.length)];
  }
  
  /**
   * Starts automatic phone log simulation (runs every hour)
   */
  startAutoSync(userIds: string[], intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.warn('📞 Phone log auto-sync already running');
      return;
    }
    
    console.warn(`📞 Starting phone log auto-sync for ${userIds.length} users (every ${intervalMinutes} minutes)`);
    this.isRunning = true;
    
    this.syncInterval = setInterval(async () => {
      for (const userId of userIds) {
        try {
          await this.syncUserPhoneLogs(userId);
        } catch (error) {
          console.error(`Error syncing logs for user ${userId}:`, error);
        }
      }
    }, intervalMinutes * 60 * 1000);
  }
  
  /**
   * Stops automatic phone log simulation
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.isRunning = false;
    console.warn('📞 Phone log auto-sync stopped');
  }
  
  /**
   * Simulates a bulk sync (like initial phone log import)
   */
  async bulkSync(userId: string, days: number = 30): Promise<PhoneLogSyncResult> {
    console.warn(`📞 Starting bulk phone log sync for ${days} days`);
    
    const contacts = await Contact.find({ 
      userId,
      phoneNumber: { $exists: true, $ne: '' }
    });
    
    if (contacts.length === 0) {
      return {
        processedEvents: 0,
        updatedContacts: 0,
        newLogs: 0,
        errors: ['No contacts with phone numbers found']
      };
    }
    
    // Generate more events for bulk sync
    const events = this.generateBulkEvents(contacts, days);
    
    return this.processEvents(userId, events);
  }
  
  /**
   * Generates realistic bulk events with patterns
   */
  private generateBulkEvents(contacts: any[], days: number): MockPhoneEvent[] {
    const events: MockPhoneEvent[] = [];
    const now = new Date();
    
    // Create communication patterns for each contact
    contacts.forEach(contact => {
      const baseFrequency = this.getContactFrequency(contact.category);
      const eventsForContact = Math.floor((days / baseFrequency) * (0.5 + Math.random()));
      
      for (let i = 0; i < eventsForContact; i++) {
        const daysAgo = Math.floor(Math.random() * days);
        const eventTime = new Date(now);
        eventTime.setDate(eventTime.getDate() - daysAgo);
        eventTime.setHours(
          Math.floor(Math.random() * 16) + 6,
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60)
        );
        
        const eventType = Math.random() > 0.4 ? 'TEXT' : 'PHONE_CALL';
        const direction = Math.random() > 0.5 ? 'OUTGOING' : 'INCOMING';
        
        const event: MockPhoneEvent = {
          contactPhoneNumber: contact.phoneNumber,
          type: eventType,
          timestamp: eventTime,
          direction
        };
        
        if (eventType === 'PHONE_CALL') {
          event.answered = Math.random() > 0.2;
          event.duration = event.answered 
            ? Math.floor(Math.random() * 2400) + 30
            : undefined;
        }
        
        events.push(event);
      }
    });
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Gets expected communication frequency based on contact category
   */
  private getContactFrequency(category: string): number {
    switch (category) {
      case 'BEST_FRIEND': return 7; // Weekly
      case 'FRIEND': return 14; // Bi-weekly
      case 'ACQUAINTANCE': return 30; // Monthly
      default: return 21; // Default ~3 weeks
    }
  }
  
  /**
   * Gets sync statistics
   */
  getStats(): { isRunning: boolean; interval?: number } {
    return {
      isRunning: this.isRunning,
      interval: this.syncInterval ? 60 : undefined
    };
  }
}