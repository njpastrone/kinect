/**
 * Integration Tests for Full Reminder Flow
 * Tests complete reminder system with real database and services
 */

const request = require('supertest');
const app = require('../../src/app.ts').default;
const { User } = require('../../src/models/User.model');
const { Contact } = require('../../src/models/Contact.model');
const { ContactList } = require('../../src/models/ContactList.model');
const { notificationService } = require('../../src/services/notification.service.simple');
const { emailService } = require('../../src/services/email.service');
const mongoose = require('mongoose');

describe('Full Reminder Flow Integration', () => {
  let testUser, testContact, testList, authToken;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/kinect-test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Contact.deleteMany({});
    await ContactList.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.data.tokens.accessToken;

    // Create test list
    testList = await ContactList.create({
      userId: testUser._id.toString(),
      name: 'Test Friends',
      description: 'Test contacts',
      color: '#3B82F6',
      reminderDays: 30,
      contactIds: []
    });

    // Create overdue test contact (35 days since last contact, 30 day reminder)
    testContact = await Contact.create({
      userId: testUser._id.toString(),
      listId: testList._id.toString(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1-555-0123',
      lastContactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
    });

    // Update list with contact ID
    testList.contactIds = [testContact._id.toString()];
    await testList.save();
  });

  describe('End-to-End Reminder Processing', () => {
    test('should detect overdue contact and prepare reminder', async () => {
      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      await notificationService.processWeeklyReminders();
      
      expect(emailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: testUser.email,
          firstName: testUser.firstName
        }),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'John Doe',
            daysSince: expect.any(Number)
          })
        ])
      );
      
      emailSpy.mockRestore();
    });

    test('should not send duplicate reminders', async () => {
      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      // First run
      await notificationService.processWeeklyReminders();
      expect(emailSpy).toHaveBeenCalledTimes(1);
      
      // Second run immediately (should not send duplicate)
      await notificationService.processWeeklyReminders();
      expect(emailSpy).toHaveBeenCalledTimes(1); // Still only 1
      
      emailSpy.mockRestore();
    });

    test('should respect user notification preferences', async () => {
      // Disable email reminders for user
      testUser.preferences = { emailReminders: false };
      await testUser.save();
      
      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      await notificationService.processWeeklyReminders();
      
      expect(emailSpy).not.toHaveBeenCalled();
      
      emailSpy.mockRestore();
    });

    test('should handle custom reminder days correctly', async () => {
      // Create contact with custom 20-day reminder (should be overdue)
      const customContact = await Contact.create({
        userId: testUser._id.toString(),
        listId: testList._id.toString(),
        firstName: 'Jane',
        lastName: 'Smith',
        customReminderDays: 20,
        lastContactDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
      });

      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      await notificationService.processWeeklyReminders();
      
      // Should get reminder for both contacts
      expect(emailSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe' }),
          expect.objectContaining({ name: 'Jane Smith' })
        ])
      );
      
      emailSpy.mockRestore();
    });
  });

  describe('API Integration', () => {
    test('should get upcoming reminders via API', async () => {
      const response = await request(app)
        .get('/api/notifications/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        contact: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe'
        }),
        isOverdue: true,
        daysOverdue: expect.any(Number)
      });
    });

    test('should send test reminder via API', async () => {
      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      const response = await request(app)
        .post(`/api/notifications/test/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(emailSpy).toHaveBeenCalled();
      
      emailSpy.mockRestore();
    });

    test('should return reminder stats via API', async () => {
      const response = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        overdueCount: expect.any(Number),
        upcomingCount: expect.any(Number)
      });
    });
  });

  describe('Database Operations', () => {
    test('should handle concurrent reminder processing', async () => {
      // Create multiple test users
      const users = await Promise.all([
        User.create({
          email: 'user1@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'One'
        }),
        User.create({
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Two'
        }),
        User.create({
          email: 'user3@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Three'
        })
      ]);

      // Create overdue contacts for each user
      for (const user of users) {
        const list = await ContactList.create({
          userId: user._id.toString(),
          name: 'Friends',
          reminderDays: 30,
          contactIds: []
        });

        await Contact.create({
          userId: user._id.toString(),
          listId: list._id.toString(),
          firstName: 'Overdue',
          lastName: 'Contact',
          lastContactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
        });
      }

      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      // Simulate multiple server instances processing simultaneously
      const promises = Array(3).fill().map(() => 
        notificationService.processWeeklyReminders()
      );
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      // Should have sent emails to all users (but no duplicates)
      expect(emailSpy).toHaveBeenCalledTimes(users.length + 1); // +1 for original testUser
      
      emailSpy.mockRestore();
    });

    test('should recover from database connection loss', async () => {
      // Simulate DB connection loss
      await mongoose.disconnect();
      
      // Attempt to send reminder (should fail gracefully)
      const result = await notificationService.sendTestReminder(testUser._id);
      expect(result.error).toBeDefined();
      
      // Reconnect
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/kinect-test');
      
      // Retry should work
      const retryResult = await notificationService.sendTestReminder(testUser._id);
      expect(retryResult.success).toBe(true);
    });

    test('should handle deleted contacts gracefully', async () => {
      // Delete the contact
      await Contact.findByIdAndDelete(testContact._id);
      
      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      // Should not crash or send reminder for deleted contact
      await expect(notificationService.processWeeklyReminders()).resolves.toBeDefined();
      
      // Should not have sent any emails
      expect(emailSpy).not.toHaveBeenCalled();
      
      emailSpy.mockRestore();
    });

    test('should handle orphaned contacts (no list)', async () => {
      // Create contact without list
      const orphanContact = await Contact.create({
        userId: testUser._id.toString(),
        firstName: 'Orphan',
        lastName: 'Contact',
        lastContactDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // Very old
      });

      const emailSpy = jest.spyOn(emailService, 'sendContactReminderEmail');
      
      await notificationService.processWeeklyReminders();
      
      // Should still send reminder using default 90-day rule
      expect(emailSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ name: 'Orphan Contact' })
        ])
      );
      
      emailSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle email service failure gracefully', async () => {
      // Mock email service failure
      const originalSend = emailService.sendContactReminderEmail;
      emailService.sendContactReminderEmail = jest.fn().mockRejectedValue(
        new Error('SMTP service unavailable')
      );
      
      // Should not crash the entire process
      await expect(notificationService.processWeeklyReminders()).resolves.toBeDefined();
      
      // Restore original function
      emailService.sendContactReminderEmail = originalSend;
    });

    test('should validate user permissions for API endpoints', async () => {
      const response = await request(app)
        .get('/api/notifications/upcoming')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/notifications/test/invalid-user-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should handle large number of contacts efficiently', async () => {
      // Create 100 overdue contacts
      const contacts = Array(100).fill().map((_, i) => ({
        userId: testUser._id.toString(),
        listId: testList._id.toString(),
        firstName: `Contact`,
        lastName: `${i}`,
        lastContactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      }));

      await Contact.insertMany(contacts);

      const startTime = Date.now();
      await notificationService.processWeeklyReminders();
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should batch email sends with proper delays', async () => {
      // Create multiple users to test batching
      const users = await Promise.all(
        Array(5).fill().map(async (_, i) => {
          const user = await User.create({
            email: `batch-user-${i}@test.com`,
            password: 'password123',
            firstName: `User${i}`,
            lastName: 'Test'
          });

          // Create overdue contact for each user
          const list = await ContactList.create({
            userId: user._id.toString(),
            name: 'Friends',
            reminderDays: 30,
            contactIds: []
          });

          await Contact.create({
            userId: user._id.toString(),
            listId: list._id.toString(),
            firstName: 'Overdue',
            lastName: 'Contact',
            lastContactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
          });

          return user;
        })
      );

      const startTime = Date.now();
      await notificationService.processWeeklyReminders();
      const endTime = Date.now();

      // Should take time due to delays between sends
      expect(endTime - startTime).toBeGreaterThan(4000); // At least 4 seconds for 5 users + original
    }, 30000); // 30 second timeout for this test
  });
});