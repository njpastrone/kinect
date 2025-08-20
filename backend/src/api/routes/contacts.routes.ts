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

export default router;
