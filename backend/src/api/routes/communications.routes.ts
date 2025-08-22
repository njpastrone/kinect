import { Router, Response } from 'express';
import { Contact } from '../../models/Contact.model';
import { CommunicationLog } from '../../models/CommunicationLog.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);

// Log communication with timestamp
router.post(
  '/log',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contactId, type, timestamp, notes, duration } = req.body;

    if (!contactId || !type || !timestamp) {
      throw new AppError('Contact ID, type, and timestamp are required', 400);
    }

    // Verify contact belongs to user
    const contact = await Contact.findOne({
      _id: contactId,
      userId: req.userId,
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    const logTimestamp = new Date(timestamp);

    // Update contact's lastContactDate if this is the most recent communication
    if (!contact.lastContactDate || logTimestamp > contact.lastContactDate) {
      await Contact.findByIdAndUpdate(contactId, {
        lastContactDate: logTimestamp,
      });
    }

    const log = await CommunicationLog.create({
      userId: req.userId,
      contactId,
      type,
      timestamp: logTimestamp,
      notes,
      duration,
    });

    res.json({
      success: true,
      data: { log },
      message: 'Communication logged successfully',
    });
  })
);

export default router;
