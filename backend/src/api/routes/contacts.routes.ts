import { Router, Response } from 'express';
import multer from 'multer';
import { Contact } from '../../models/Contact.model';
import { ContactList } from '../../models/ContactList.model';
import { CommunicationLog } from '../../models/CommunicationLog.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { contactValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';
import { VcfParserService } from '../../services/vcf-parser.service';

const router = Router();

// Configure multer for file uploads (memory storage for small VCF files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept .vcf and .vcard files
    if (file.mimetype === 'text/vcard' || file.mimetype === 'text/x-vcard' || file.originalname.endsWith('.vcf')) {
      cb(null, true);
    } else {
      cb(new Error('Only VCF files are allowed'));
    }
  },
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, listId } = req.query;

    const query: Record<string, any> = { userId: req.userId };
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

    // If contact is assigned to a list, update the list's contactIds array
    if (req.body.listId) {
      const list = await ContactList.findOne({
        _id: req.body.listId,
        userId: req.userId,
      });

      if (list && !list.contactIds.includes((contact._id as string).toString())) {
        list.contactIds.push((contact._id as string).toString());
        await list.save();
      }
    }

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

    // Remove contact from any lists that reference it
    if (contact.listId) {
      await ContactList.updateOne(
        { _id: contact.listId, userId: req.userId },
        { $pull: { contactIds: req.params.id } }
      );
    }

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

// Parse VCF file and return preview of contacts
router.post(
  '/import/parse',
  upload.single('vcfFile'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No VCF file uploaded', 400);
    }

    // Convert buffer to string
    const vcfContent = req.file.buffer.toString('utf-8');

    // Log first 500 characters for debugging
    console.log('VCF Content (first 500 chars):', vcfContent.substring(0, 500));

    // Parse the VCF file
    const parseResult = VcfParserService.parseVcf(vcfContent);

    console.log('Parse result:', {
      totalParsed: parseResult.totalParsed,
      validContacts: parseResult.validContacts,
      invalidContacts: parseResult.invalidContacts,
      errorsCount: parseResult.errors.length,
      errors: parseResult.errors,
    });

    // Get user's existing contacts to check for duplicates
    const existingContactDocs = await Contact.find({ userId: req.userId });

    // Convert Mongoose documents to plain objects for duplicate detection
    const existingContacts = existingContactDocs.map(doc => ({
      _id: (doc._id as any).toString(),
      userId: doc.userId,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      listId: doc.listId,
      customReminderDays: doc.customReminderDays,
      lastContactDate: doc.lastContactDate,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    // Find duplicates
    const duplicates = VcfParserService.findDuplicates(parseResult.contacts, existingContacts);

    // Mark duplicates in the preview
    const previewContacts = parseResult.contacts.map(contact => {
      const duplicate = duplicates.find(d => d.contact === contact);
      return {
        ...contact,
        isDuplicate: !!duplicate,
        duplicateOf: duplicate?.duplicateOf,
      };
    });

    res.json({
      success: true,
      data: {
        contacts: previewContacts,
        totalParsed: parseResult.totalParsed,
        validContacts: parseResult.validContacts,
        invalidContacts: parseResult.invalidContacts,
        duplicatesFound: duplicates.length,
        errors: parseResult.errors,
      },
    });
  })
);

// Import contacts after user confirmation
router.post(
  '/import/confirm',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    console.log('Import confirm endpoint called');
    console.log('Request body:', JSON.stringify(req.body).substring(0, 500));

    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      console.error('Invalid contacts data - not an array');
      throw new AppError('Invalid contacts data', 400);
    }

    console.log(`Attempting to import ${contacts.length} contacts`);

    if (contacts.length === 0) {
      throw new AppError('No contacts to import', 400);
    }

    if (contacts.length > 1000) {
      throw new AppError('Too many contacts. Maximum 1000 contacts per import.', 400);
    }

    const importedContacts = [];
    const skippedContacts = [];
    const errors: string[] = [];

    // Prepare contacts for bulk insertion
    const contactsToInsert = [];

    for (const contactData of contacts) {
      // Validate required fields
      if (!contactData.firstName || !contactData.lastName) {
        skippedContacts.push(contactData);
        errors.push(`Skipped contact: Missing required fields`);
        continue;
      }

      contactsToInsert.push({
        userId: req.userId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phoneNumber: contactData.phoneNumber,
        lastContactDate: new Date(),
      });
    }

    console.log(`Prepared ${contactsToInsert.length} contacts for insertion`);

    // Bulk insert contacts
    try {
      const insertedContacts = await Contact.insertMany(contactsToInsert, { ordered: false });
      importedContacts.push(...insertedContacts);
      console.log(`Successfully inserted ${insertedContacts.length} contacts`);
    } catch (error: any) {
      console.error('Bulk insert error:', error);

      // If bulk insert fails, try individual inserts
      console.log('Falling back to individual inserts...');
      for (const contactData of contactsToInsert) {
        try {
          const contact = await Contact.create(contactData);
          importedContacts.push(contact);
        } catch (err) {
          console.error(`Error importing contact ${contactData.firstName} ${contactData.lastName}:`, err);
          skippedContacts.push(contactData);
          errors.push(`Failed to import ${contactData.firstName} ${contactData.lastName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`Import complete: ${importedContacts.length} imported, ${skippedContacts.length} skipped`);

    res.json({
      success: true,
      data: {
        imported: importedContacts.length,
        skipped: skippedContacts.length,
        totalParsed: contacts.length,
        validContacts: importedContacts.length,
        invalidContacts: skippedContacts.length,
        duplicatesFound: 0, // Duplicates already filtered on client
        errors,
      },
      message: `Successfully imported ${importedContacts.length} contact${importedContacts.length !== 1 ? 's' : ''}`,
    });
  })
);

export default router;
