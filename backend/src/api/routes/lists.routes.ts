import { Router } from 'express';
import { ContactList } from '../../models/ContactList.model';
import { Contact } from '../../models/Contact.model';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { listValidation, validate } from '../../utils/validation';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const lists = await ContactList.find({ userId: req.userId })
    .sort({ name: 1 });

  res.json({
    success: true,
    data: lists
  });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    throw new AppError('List not found', 404);
  }

  const contacts = await Contact.find({
    _id: { $in: list.contactIds },
    userId: req.userId
  });

  res.json({
    success: true,
    data: {
      ...list.toObject(),
      contacts
    }
  });
}));

router.post('/', validate(listValidation.create), asyncHandler(async (req: AuthRequest, res) => {
  const existingList = await ContactList.findOne({
    userId: req.userId,
    name: req.body.name
  });

  if (existingList) {
    throw new AppError('List with this name already exists', 409);
  }

  const list = await ContactList.create({
    ...req.body,
    userId: req.userId,
    contactIds: []
  });

  res.status(201).json({
    success: true,
    data: list
  });
}));

router.put('/:id', validate(listValidation.update), asyncHandler(async (req: AuthRequest, res) => {
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
    data: list
  });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const list = await ContactList.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    throw new AppError('List not found', 404);
  }

  await Contact.updateMany(
    { listId: req.params.id },
    { $unset: { listId: '' } }
  );

  res.json({
    success: true,
    message: 'List deleted successfully'
  });
}));

router.post('/:id/contacts/:contactId', asyncHandler(async (req: AuthRequest, res) => {
  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    throw new AppError('List not found', 404);
  }

  const contact = await Contact.findOne({
    _id: req.params.contactId,
    userId: req.userId
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
    data: list
  });
}));

router.delete('/:id/contacts/:contactId', asyncHandler(async (req: AuthRequest, res) => {
  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    throw new AppError('List not found', 404);
  }

  list.contactIds = list.contactIds.filter(id => id !== req.params.contactId);
  await list.save();

  await Contact.updateOne(
    { _id: req.params.contactId, userId: req.userId },
    { $unset: { listId: '' } }
  );

  res.json({
    success: true,
    data: list
  });
}));

export default router;