import { Router, Response } from 'express';
import { Contact } from '../../models/Contact.model';
import { CommunicationLog } from '../../models/CommunicationLog.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { contactValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, category, listId } = req.query;

    const query: Record<string, any> = { userId: req.userId };
    if (category) query.category = category;
    if (listId) query.listId = listId;

    const contacts = await Contact.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        items: contacts,
        totalItems: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: Number(page) < Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Get all overdue contacts with list information (must come before /:id route)
router.get(
  '/overdue',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Aggregate to get overdue contacts with list information
    const pipeline: any[] = [
      // Match contacts for this user
      { $match: { userId: req.userId } },

      // Add computed field for days since last contact
      {
        $addFields: {
          daysSinceLastContact: {
            $divide: [{ $subtract: [new Date(), '$lastContactDate'] }, 1000 * 60 * 60 * 24],
          },
        },
      },

      // Join with ContactList to get list info
      {
        $lookup: {
          from: 'contactlists',
          localField: 'listId',
          foreignField: '_id',
          as: 'list',
        },
      },

      // Unwind list (convert array to object)
      {
        $unwind: {
          path: '$list',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Add computed field for reminder threshold
      {
        $addFields: {
          reminderThreshold: {
            $ifNull: ['$customReminderDays', '$list.reminderDays', 30],
          },
        },
      },

      // Filter for overdue contacts
      {
        $match: {
          $expr: {
            $gt: ['$daysSinceLastContact', '$reminderThreshold'],
          },
        },
      },

      // Sort by days overdue (most overdue first)
      {
        $sort: { daysSinceLastContact: -1 },
      },

      // Skip and limit for pagination
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const overdueContacts = await Contact.aggregate(pipeline);

    // Get total count of overdue contacts
    const countPipeline: any[] = pipeline.slice(0, -2); // Remove skip and limit
    const totalOverdue = await Contact.aggregate([...countPipeline, { $count: 'total' }]);

    const total = totalOverdue[0]?.total || 0;

    res.json({
      success: true,
      data: {
        items: overdueContacts,
        totalItems: total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: Number(page) < Math.ceil(total / Number(limit)),
      },
    });
  })
);


router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    res.json({
      success: true,
      data: contact,
    });
  })
);

router.post(
  '/',
  validate(contactValidation.create),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await Contact.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json({
      success: true,
      data: contact,
    });
  })
);

router.put(
  '/:id',
  validate(contactValidation.update),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    res.json({
      success: true,
      data: contact,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    await CommunicationLog.deleteMany({ contactId: req.params.id });

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  })
);

router.post(
  '/:id/log-contact',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type = 'OTHER', notes = '' } = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { lastContactDate: new Date() },
      { new: true }
    );

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const log = await CommunicationLog.create({
      userId: req.userId,
      contactId: req.params.id,
      type,
      timestamp: new Date(),
      notes,
    });

    res.json({
      success: true,
      data: { contact, log },
    });
  })
);


// Mark contact as contacted (update lastContact to current timestamp)
router.patch(
  '/:id/mark-contacted',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { lastContactDate: new Date() },
      { new: true }
    );

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    // Create a communication log entry
    const log = await CommunicationLog.create({
      userId: req.userId,
      contactId: req.params.id,
      type: 'OTHER',
      timestamp: new Date(),
      notes: 'Marked as contacted',
    });

    res.json({
      success: true,
      data: { contact, log },
      message: 'Contact marked as contacted',
    });
  })
);

// Schedule reminder for future date
router.post(
  '/:id/schedule-reminder',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reminderDate, notes } = req.body;

    if (!reminderDate) {
      throw new AppError('Reminder date is required', 400);
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { nextReminderDate: new Date(reminderDate) },
      { new: true }
    );

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    // Create a log entry for the scheduled reminder
    const log = await CommunicationLog.create({
      userId: req.userId,
      contactId: req.params.id,
      type: 'OTHER',
      timestamp: new Date(),
      notes: notes || `Reminder scheduled for ${new Date(reminderDate).toLocaleDateString()}`,
    });

    res.json({
      success: true,
      data: { contact, log },
      message: 'Reminder scheduled successfully',
    });
  })
);

export default router;
