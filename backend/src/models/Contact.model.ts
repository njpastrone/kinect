import mongoose, { Document, Schema } from 'mongoose';
import { IContact } from '@kinect/shared';

export interface IContactDocument extends Omit<IContact, '_id'>, Document {}

const contactSchema = new Schema<IContactDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    listId: {
      type: String,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    customReminderDays: {
      type: Number,
      min: 1,
      max: 365,
    },
    lastContactDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ userId: 1, lastName: 1, firstName: 1 });
contactSchema.index({ userId: 1, lastContactDate: 1 });

export const Contact = mongoose.model<IContactDocument>('Contact', contactSchema);
