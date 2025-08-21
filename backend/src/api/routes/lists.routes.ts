import { Router, Response } from 'express';
import { ContactList } from '../../models/ContactList.model';
import { Contact } from '../../models/Contact.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { listValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const lists = await ContactList.find({ userId: req.userId }).sort({ name: 1 });

    // Get contact counts and statistics for each list
    const listsWithStats = await Promise.all(
      lists.map(async (list) => {
        const totalContacts = await Contact.countDocuments({
          listId: list._id,
          userId: req.userId,
        });

        // Get overdue contacts in this list
        const now = new Date();
        const overdueContacts = await Contact.countDocuments({
          listId: list._id,
          userId: req.userId,
          $expr: {
            $gt: [
              { $subtract: [now, '$lastContactDate'] },
              { $multiply: [list.reminderDays || 30, 24 * 60 * 60 * 1000] },
            ],
          },
        });

        return {
          ...list.toObject(),
          contactCount: totalContacts,
          overdueCount: overdueContacts,
        };
      })
    );

    res.json({
      success: true,
      data: listsWithStats,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!list) {
      throw new AppError('List not found', 404);
    }

    const contacts = await Contact.find({
      listId: req.params.id,
      userId: req.userId,
    }).sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: {
        ...list.toObject(),
        contacts,
        contactCount: contacts.length,
      },
    });
  })
);

// Get contacts in a specific list
router.get(
  '/:id/contacts',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!list) {
      throw new AppError('List not found', 404);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find({
      listId: req.params.id,
      userId: req.userId,
    })
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments({
      listId: req.params.id,
      userId: req.userId,
    });

    res.json({
      success: true,
      data: {
        items: contacts,
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  })
);

router.post(
  '/',
  validate(listValidation.create),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existingList = await ContactList.findOne({
      userId: req.userId,
      name: req.body.name,
    });

    if (existingList) {
      throw new AppError('List with this name already exists', 409);
    }

    const list = await ContactList.create({
      ...req.body,
      userId: req.userId,
      contactIds: [],
    });

    res.status(201).json({
      success: true,
      data: list,
    });
  })
);

router.put(
  '/:id',
  validate(listValidation.update),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!list) {
      throw new AppError('List not found', 404);
    }

    res.json({
      success: true,
      data: list,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!list) {
      throw new AppError('List not found', 404);
    }

    await Contact.updateMany({ listId: req.params.id }, { $unset: { listId: '' } });

    res.json({
      success: true,
      message: 'List deleted successfully',
    });
  })
);

router.post(
  '/:id/contacts/:contactId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!list) {
      throw new AppError('List not found', 404);
    }

    const contact = await Contact.findOne({
      _id: req.params.contactId,
      userId: req.userId,
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    if (!list.contactIds.includes(req.params.contactId)) {
      list.contactIds.push(req.params.contactId);
      await list.save();
    }

    contact.listId = req.params.id;
    await contact.save();

    res.json({
      success: true,
      data: list,
    });
  })
);

router.delete(
  '/:id/contacts/:contactId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const list = await ContactList.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!list) {
      throw new AppError('List not found', 404);
    }

    list.contactIds = list.contactIds.filter((id) => id !== req.params.contactId);
    await list.save();

    await Contact.updateOne(
      { _id: req.params.contactId, userId: req.userId },
      { $unset: { listId: '' } }
    );

    res.json({
      success: true,
      data: list,
    });
  })
);

export default router;
