/**
 * Unit Tests for Reminder Calculation Logic
 * Tests core reminder functionality without external dependencies
 */

const {
  getReminderThreshold,
  calculateDaysOverdue,
  isWithinQuietHours,
  convertToUserTimezone,
  calculateNextReminderDate,
  sortContactsByOverdue,
  batchContactsForEmail,
  processUsersWithDelay
} = require('../utils/reminderHelpers');

describe('Reminder Calculation Logic', () => {
  describe('getReminderThreshold', () => {
    test('should use custom reminder days when set', () => {
      const contact = {
        customReminderDays: 45,
        listId: 'list123',
        lastContactDate: new Date('2024-01-01')
      };
      const list = { reminderDays: 90 };
      
      expect(getReminderThreshold(contact, list)).toBe(45);
    });

    test('should fall back to list reminder days', () => {
      const contact = {
        listId: 'list123',
        lastContactDate: new Date('2024-01-01')
      };
      const list = { reminderDays: 30 };
      
      expect(getReminderThreshold(contact, list)).toBe(30);
    });

    test('should use 90-day default when no other setting', () => {
      const contact = {
        lastContactDate: new Date('2024-01-01')
      };
      
      expect(getReminderThreshold(contact, null)).toBe(90);
    });
  });

  describe('calculateDaysOverdue', () => {
    test('should correctly calculate days overdue', () => {
      const mockDate = new Date('2024-04-01'); // 91 days after Jan 1
      jest.useFakeTimers().setSystemTime(mockDate);
      
      const contact = {
        lastContactDate: new Date('2024-01-01'),
        customReminderDays: 80
      };
      
      expect(calculateDaysOverdue(contact)).toBe(11); // 91 - 80 = 11 days overdue
      
      jest.useRealTimers();
    });

    test('should return 0 for contacts not yet overdue', () => {
      const mockDate = new Date('2024-01-15'); // 14 days after Jan 1
      jest.useFakeTimers().setSystemTime(mockDate);
      
      const contact = {
        lastContactDate: new Date('2024-01-01'),
        customReminderDays: 30
      };
      
      expect(calculateDaysOverdue(contact)).toBe(0);
      
      jest.useRealTimers();
    });

    test('should handle contacts with no lastContactDate', () => {
      const contact = {
        createdAt: new Date('2024-01-01'),
        customReminderDays: 30
      };
      
      // Should use createdAt as fallback
      expect(() => calculateDaysOverdue(contact)).not.toThrow();
    });
  });

  describe('Date/Time Edge Cases', () => {
    test('should handle leap year calculations', () => {
      const contact = {
        lastContactDate: new Date('2024-02-29'), // Leap year
        customReminderDays: 365
      };
      
      expect(() => calculateDaysOverdue(contact)).not.toThrow();
    });

    test('should handle DST transitions', () => {
      // Test spring forward (2 AM becomes 3 AM)
      const springForward = new Date('2024-03-10T02:30:00-04:00');
      expect(isWithinQuietHours(springForward, { start: 22, end: 8 })).toBe(true);
      
      // Test fall back (2 AM happens twice)
      const fallBack = new Date('2024-11-03T01:30:00-05:00');
      expect(isWithinQuietHours(fallBack, { start: 22, end: 8 })).toBe(true);
    });

    test('should handle timezone conversions', () => {
      const utcDate = new Date('2024-01-01T09:00:00Z');
      const userTimezone = 'America/New_York';
      
      const converted = convertToUserTimezone(utcDate, userTimezone);
      // Test that function returns a valid date (basic sanity check)
      expect(converted).toBeInstanceOf(Date);
      expect(converted.getTime()).not.toBe(utcDate.getTime()); // Should be different
    });

    test('should handle end-of-month edge cases', () => {
      const contact = {
        lastContactDate: new Date('2024-01-31'),
        customReminderDays: 30
      };
      
      const nextReminder = calculateNextReminderDate(contact);
      // Should return a valid future date
      expect(nextReminder).toBeInstanceOf(Date);
      expect(nextReminder.getTime()).toBeGreaterThan(contact.lastContactDate.getTime());
      // Should be roughly 30 days later (allow some variance for month boundaries)
      const daysDifference = Math.floor((nextReminder - contact.lastContactDate) / (24 * 60 * 60 * 1000));
      expect(daysDifference).toBe(30);
    });
  });

  describe('Quiet Hours Logic', () => {
    test('should detect quiet hours correctly', () => {
      const quietHours = { start: 22, end: 8 }; // 10 PM to 8 AM
      
      expect(isWithinQuietHours(new Date('2024-01-01T02:00:00'), quietHours)).toBe(true);
      expect(isWithinQuietHours(new Date('2024-01-01T10:00:00'), quietHours)).toBe(false);
      expect(isWithinQuietHours(new Date('2024-01-01T23:00:00'), quietHours)).toBe(true);
      expect(isWithinQuietHours(new Date('2024-01-01T07:59:00'), quietHours)).toBe(true);
      expect(isWithinQuietHours(new Date('2024-01-01T08:00:00'), quietHours)).toBe(false);
    });

    test('should handle same start and end hour', () => {
      const noQuietHours = { start: 9, end: 9 };
      
      expect(isWithinQuietHours(new Date('2024-01-01T09:00:00'), noQuietHours)).toBe(false);
      expect(isWithinQuietHours(new Date('2024-01-01T10:00:00'), noQuietHours)).toBe(false);
    });
  });

  describe('Batch Processing Logic', () => {
    test('should respect maxContactsPerEmail limit', () => {
      const overdueContacts = Array(10).fill().map((_, i) => ({
        name: `Contact ${i}`,
        daysOverdue: i + 1,
        email: `contact${i}@test.com`
      }));
      
      const preferences = { maxContactsPerEmail: 5 };
      const batched = batchContactsForEmail(overdueContacts, preferences);
      
      expect(batched.length).toBe(5);
      expect(batched[0].daysOverdue).toBe(10); // Most overdue first
      expect(batched[4].daysOverdue).toBe(6);
    });

    test('should sort contacts by most overdue first', () => {
      const overdueContacts = [
        { name: 'Contact A', daysOverdue: 5 },
        { name: 'Contact B', daysOverdue: 15 },
        { name: 'Contact C', daysOverdue: 3 },
        { name: 'Contact D', daysOverdue: 10 }
      ];
      
      const sorted = sortContactsByOverdue(overdueContacts);
      
      expect(sorted[0].daysOverdue).toBe(15);
      expect(sorted[1].daysOverdue).toBe(10);
      expect(sorted[2].daysOverdue).toBe(5);
      expect(sorted[3].daysOverdue).toBe(3);
    });

    test('should calculate correct batch delay timing', async () => {
      const users = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const startTime = Date.now();
      
      // Mock the actual processing to just return success
      const mockProcessor = jest.fn().mockResolvedValue({ success: true });
      
      await processUsersWithDelay(users, mockProcessor, 1000); // 1s delay
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThan(2000); // At least 2s for 3 users
      expect(mockProcessor).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid dates gracefully', () => {
      const contact = {
        lastContactDate: 'invalid-date',
        customReminderDays: 30
      };
      
      expect(() => calculateDaysOverdue(contact)).not.toThrow();
      expect(calculateDaysOverdue(contact)).toBe(0); // Should default safely
    });

    test('should handle negative reminder days', () => {
      const contact = {
        customReminderDays: -10,
        listId: 'list123'
      };
      const list = { reminderDays: 30 };
      
      // Should fall back to list or default
      expect(getReminderThreshold(contact, list)).toBe(30);
    });

    test('should handle extremely large reminder days', () => {
      const contact = {
        customReminderDays: 999999,
        lastContactDate: new Date('2024-01-01')
      };
      
      expect(() => calculateDaysOverdue(contact)).not.toThrow();
      expect(calculateDaysOverdue(contact)).toBe(0); // Won't be overdue for a long time
    });
  });
});