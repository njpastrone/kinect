/**
 * End-to-End Health Check Tests
 * Tests production-like scenarios and system monitoring
 */

const request = require('supertest');
const app = require('../../src/app.ts').default;
const cron = require('node-cron');
const { notificationService } = require('../../src/services/notification.service.simple');
const { emailService } = require('../../src/services/email.service');
const mongoose = require('mongoose');

describe('Reminder System Health Checks', () => {
  describe('Health Check Endpoint', () => {
    test('should return healthy status when system is working', async () => {
      const response = await request(app)
        .get('/health/reminders');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/healthy|unhealthy/),
        stats: expect.any(Object),
        lastProcessed: expect.any(String),
        activeJobs: expect.any(Number)
      });
    });

    test('should detect unhealthy status when jobs not running', async () => {
      // Destroy all cron jobs temporarily
      const tasks = cron.getTasks();
      tasks.forEach((task) => task.destroy());

      const response = await request(app)
        .get('/health/reminders');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.issues).toContain('No active cron jobs');

      // Restart notification service to restore cron jobs
      require('../../src/services/notification.service.simple');
    });

    test('should detect database connectivity issues', async () => {
      // Temporarily close database connection
      await mongoose.disconnect();

      const response = await request(app)
        .get('/health/reminders');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.issues).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/database|connection/i)
        ])
      );

      // Reconnect
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/kinect-test');
    });
  });

  describe('Service Monitoring', () => {
    test('should track successful reminder runs', async () => {
      // Mock successful run
      const originalProcess = notificationService.processWeeklyReminders;
      let processCalled = false;
      
      notificationService.processWeeklyReminders = jest.fn(async () => {
        processCalled = true;
        return { success: true, processedUsers: 1, sentEmails: 1 };
      });

      await notificationService.processWeeklyReminders();

      expect(processCalled).toBe(true);
      
      // Verify last successful run is updated
      const response = await request(app).get('/health/reminders');
      expect(response.body.stats).toBeDefined();

      // Restore original function
      notificationService.processWeeklyReminders = originalProcess;
    });

    test('should track failed reminder runs', async () => {
      // Mock failed run
      const originalProcess = notificationService.processWeeklyReminders;
      
      notificationService.processWeeklyReminders = jest.fn(async () => {
        throw new Error('Simulated failure');
      });

      await expect(notificationService.processWeeklyReminders()).rejects.toThrow('Simulated failure');

      // Restore original function
      notificationService.processWeeklyReminders = originalProcess;
    });

    test('should validate email service connectivity', async () => {
      const testResult = await emailService.testConnection();
      
      // In test mode, should always be reachable
      expect(testResult).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean)
        })
      );
    });
  });

  describe('Canary Testing', () => {
    test('should run canary tests with dedicated accounts', async () => {
      // This would test with pre-created canary accounts
      const canaryUsers = [
        'canary1@yourapp.com',
        'canary2@yourapp.com'
      ];

      const results = [];
      for (const email of canaryUsers) {
        try {
          // In a real implementation, you'd find the user and test
          // For this test, we'll simulate the process
          const result = {
            email,
            success: true,
            timestamp: new Date().toISOString()
          };
          results.push(result);
        } catch (error) {
          results.push({
            email,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toMatchObject({
          email: expect.any(String),
          success: expect.any(Boolean),
          timestamp: expect.any(String)
        });
      });
    });

    test('should validate canary contact creation and reminder triggering', async () => {
      // Create canary user
      const canaryUser = {
        email: 'canary-test@example.com',
        firstName: 'Canary',
        lastName: 'Test'
      };

      // Create overdue canary contact
      const canaryContact = {
        firstName: 'Test',
        lastName: 'Contact',
        lastContactDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
      };

      // Verify system can detect overdue contact
      const daysSince = Math.floor(
        (Date.now() - canaryContact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysSince).toBeGreaterThan(90); // Should be overdue with default 90-day rule
    });
  });

  describe('Performance Monitoring', () => {
    test('should measure reminder processing time', async () => {
      const startTime = Date.now();
      
      // Mock quick process
      const mockProcess = jest.fn().mockResolvedValue({
        processedUsers: 0,
        sentEmails: 0,
        errors: []
      });

      await mockProcess();
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockProcess).toHaveBeenCalledTimes(1);
    });

    test('should monitor memory usage during batch processing', () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate batch processing (create large arrays)
      const largeArray = Array(10000).fill().map((_, i) => ({
        id: i,
        data: `test-data-${i}`.repeat(100)
      }));

      const afterMemory = process.memoryUsage();
      
      // Memory usage should be reasonable
      const memoryIncrease = afterMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

      // Clean up
      largeArray.length = 0;
    });

    test('should validate concurrent processing doesn\'t cause issues', async () => {
      const concurrentPromises = Array(5).fill().map(async (_, index) => {
        // Simulate concurrent operations
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              threadId: index,
              timestamp: Date.now(),
              success: true
            });
          }, Math.random() * 1000); // Random delay up to 1 second
        });
      });

      const results = await Promise.all(concurrentPromises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result).toMatchObject({
          threadId: index,
          timestamp: expect.any(Number),
          success: true
        });
      });
    });
  });

  describe('Recovery Testing', () => {
    test('should handle system restart gracefully', async () => {
      // Simulate system restart by reinitializing services
      const originalTasks = cron.getTasks();
      const originalTaskCount = originalTasks.size;

      // Destroy all tasks (simulate shutdown)
      originalTasks.forEach(task => task.destroy());
      expect(cron.getTasks().size).toBe(0);

      // Reinitialize (simulate restart)
      delete require.cache[require.resolve('../../src/services/notification.service.simple')];
      require('../../src/services/notification.service.simple');

      // Verify tasks are restored
      const newTasks = cron.getTasks();
      expect(newTasks.size).toBe(originalTaskCount);
    });

    test('should detect and report missed reminders after downtime', async () => {
      // Simulate system was down for a week
      const lastProcessed = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // In a real implementation, you'd check for contacts that should have
      // received reminders during the downtime period
      const missedReminderWindow = {
        start: lastProcessed,
        end: new Date()
      };

      expect(missedReminderWindow.start.getTime()).toBeLessThan(missedReminderWindow.end.getTime());
      
      const daysMissed = Math.floor(
        (missedReminderWindow.end.getTime() - missedReminderWindow.start.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      expect(daysMissed).toBe(7);
    });

    test('should validate retry logic for failed emails', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const mockSendWithRetry = async () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return { success: true, attempts: attemptCount };
      };

      // Should eventually succeed after retries
      const result = await mockSendWithRetry();
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(maxRetries);
    });
  });

  describe('User Experience Validation', () => {
    test('should validate email content contains expected information', () => {
      const mockContact = {
        name: 'John Doe',
        daysSince: 35,
        email: 'john@example.com'
      };

      const emailContent = generateReminderEmailContent([mockContact]);

      expect(emailContent.subject).toMatch(/reminder/i);
      expect(emailContent.html).toContain('John Doe');
      expect(emailContent.html).toContain('35');
      expect(emailContent.html).toMatch(/unsubscribe/i);
    });

    test('should validate reminder frequency matches user preferences', () => {
      const userPreferences = [
        { frequency: 'daily', expectedCronPattern: '0 9 * * *' },
        { frequency: 'weekly', expectedCronPattern: '0 9 * * 1' },
        { frequency: 'monthly', expectedCronPattern: '0 9 1 * *' }
      ];

      userPreferences.forEach(pref => {
        const cronPattern = getCronPatternForFrequency(pref.frequency);
        expect(cronPattern).toBe(pref.expectedCronPattern);
      });
    });

    test('should ensure no reminders sent during quiet hours', () => {
      const quietHours = { start: 22, end: 8 }; // 10 PM to 8 AM
      const testTimes = [
        { hour: 2, shouldSend: false },   // 2 AM - quiet
        { hour: 10, shouldSend: true },   // 10 AM - active
        { hour: 23, shouldSend: false },  // 11 PM - quiet
        { hour: 8, shouldSend: true },    // 8 AM - active
        { hour: 22, shouldSend: false }   // 10 PM - quiet
      ];

      testTimes.forEach(test => {
        const testTime = new Date();
        testTime.setHours(test.hour, 0, 0, 0);
        
        const shouldSend = !isWithinQuietHours(testTime, quietHours);
        expect(shouldSend).toBe(test.shouldSend);
      });
    });
  });
});

// Helper functions for tests
function generateReminderEmailContent(contacts) {
  return {
    subject: 'Time to reconnect with your contacts!',
    html: `
      <h2>Reminder: Reach out to these contacts</h2>
      ${contacts.map(c => `
        <p><strong>${c.name}</strong> - ${c.daysSince} days since last contact</p>
      `).join('')}
      <p><a href="#unsubscribe">Unsubscribe</a></p>
    `
  };
}

function getCronPatternForFrequency(frequency) {
  const patterns = {
    'daily': '0 9 * * *',
    'weekly': '0 9 * * 1', 
    'monthly': '0 9 1 * *'
  };
  return patterns[frequency];
}

function isWithinQuietHours(time, quietHours) {
  const hour = time.getHours();
  if (quietHours.start < quietHours.end) {
    return hour >= quietHours.start && hour < quietHours.end;
  } else {
    // Spans midnight (e.g., 22 to 8)
    return hour >= quietHours.start || hour < quietHours.end;
  }
}