/**
 * Test-specific app setup without cron jobs
 */

// Mock the notification service before any imports
jest.mock('../../src/services/notification.service.simple', () => ({
  notificationService: {
    processWeeklyReminders: jest.fn().mockResolvedValue({ success: true }),
    sendTestReminder: jest.fn().mockResolvedValue({ success: true }),
    getReminderStats: jest.fn().mockResolvedValue({ overdueCount: 0, upcomingCount: 0 })
  }
}));

// Import app after mocking
const app = require('../../src/app.ts').default;

module.exports = app;