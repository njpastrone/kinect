import { Router, Response } from 'express';
import { Contact } from '../../models/Contact.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { DEFAULT_REMINDER_INTERVALS } from '@kinect/shared';
import { notificationService } from '../../services/notification.service.simple';

const router = Router();

router.use(authenticate);

router.get(
  '/upcoming',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contacts = await Contact.find({ userId: req.userId });

    const now = new Date();
    const upcomingReminders = contacts
      .map((contact) => {
        const lastContact = contact.lastContactDate || contact.createdAt || new Date();
        const daysSinceContact = Math.floor(
          (now.getTime() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
        );

        let reminderDays: number = DEFAULT_REMINDER_INTERVALS.FRIEND;
        switch (contact.category) {
          case 'BEST_FRIEND':
            reminderDays = DEFAULT_REMINDER_INTERVALS.BEST_FRIEND;
            break;
          case 'FRIEND':
            reminderDays = DEFAULT_REMINDER_INTERVALS.FRIEND;
            break;
          case 'ACQUAINTANCE':
            reminderDays = DEFAULT_REMINDER_INTERVALS.ACQUAINTANCE;
            break;
          case 'CUSTOM':
            reminderDays = contact.customReminderDays || DEFAULT_REMINDER_INTERVALS.CUSTOM;
            break;
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
    res.json({
      success: true,
      data: {
        userId: req.userId,
        bestFriendDays: DEFAULT_REMINDER_INTERVALS.BEST_FRIEND,
        friendDays: DEFAULT_REMINDER_INTERVALS.FRIEND,
        acquaintanceDays: DEFAULT_REMINDER_INTERVALS.ACQUAINTANCE,
        enablePushNotifications: true,
        enableEmailNotifications: true, // Default to enabled
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
