import mongoose, { Document, Schema } from 'mongoose';
import { IContactList } from '@kinect/shared';

export interface IContactListDocument extends IContactList, Document {}

const contactListSchema = new Schema<IContactListDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  contactIds: [{
    type: String
  }]
}, {
  timestamps: true
});

contactListSchema.index({ userId: 1, name: 1 }, { unique: true });

export const ContactList = mongoose.model<IContactListDocument>('ContactList', contactListSchema);