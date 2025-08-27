import { Router, Response } from 'express';
import { Contact } from '../../models/Contact.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { ContactList } from '../../models/ContactList.model';
import { notificationService } from '../../services/notification.service.simple';

const router = Router();

router.use(authenticate);

router.get(
  '/upcoming',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get contacts with their associated lists
    const contacts = await Contact.find({ userId: req.userId });
    const lists = await ContactList.find({ userId: req.userId });
    const listMap = new Map(lists.map(list => [list._id!.toString(), list]));

    const now = new Date();
    const upcomingReminders = contacts
      .map((contact) => {
        const lastContact = contact.lastContactDate || contact.createdAt || new Date();
        const daysSinceContact = Math.floor(
          (now.getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine reminder interval: custom > list > default (90 days)
        let reminderDays = contact.customReminderDays;
        if (!reminderDays && contact.listId) {
          const contactList = listMap.get(contact.listId);
          reminderDays = contactList?.reminderDays;
        }
        if (!reminderDays) {
          reminderDays = 90; // Default reminder interval
        }

        const daysOverdue = daysSinceContact - reminderDays;

        return {
          contact,
          daysSinceContact,
          reminderDays,
          daysOverdue,
          isOverdue: daysOverdue > 0,
        };
      })
      .filter((reminder) => reminder.isOverdue)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    res.json({
      success: true,
      data: upcomingReminders,
    });
  })
);

router.get(
  '/settings',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get user's lists for notification settings
    const lists = await ContactList.find({ userId: req.userId });
    
    res.json({
      success: true,
      data: {
        userId: req.userId,
        lists: lists.map(list => ({
          _id: list._id,
          name: list.name,
          reminderDays: list.reminderDays || 90,
        })),
        enablePushNotifications: true,
        enableEmailNotifications: true,
      },
    });
  })
);

// Get reminder statistics
router.get(
  '/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await notificationService.getReminderStats(req.userId!);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// Send test reminder email
router.post(
  '/test',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      await notificationService.sendTestReminder(req.userId!);

      res.json({
        success: true,
        message: 'Test reminder sent successfully',
      });
    } catch (error) {
      throw new AppError('Failed to send test reminder', 500);
    }
  })
);

// Manual trigger for processing reminders (dev/admin only)
router.post(
  '/process',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    // In production, this should be admin-only or removed
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Not available in production', 403);
    }

    try {
      await notificationService.processWeeklyReminders();

      res.json({
        success: true,
        message: 'Weekly reminders processed successfully',
      });
    } catch (error) {
      throw new AppError('Failed to process reminders', 500);
    }
  })
);

export default router;
