import mongoose, { Document, Schema } from 'mongoose';
import { ICommunicationLog } from '@kinect/shared';

export interface ICommunicationLogDocument extends ICommunicationLog, Document {}

const communicationLogSchema = new Schema<ICommunicationLogDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  contactId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['PHONE_CALL', 'TEXT', 'EMAIL', 'IN_PERSON', 'OTHER'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

communicationLogSchema.index({ userId: 1, timestamp: -1 });
communicationLogSchema.index({ contactId: 1, timestamp: -1 });

export const CommunicationLog = mongoose.model<ICommunicationLogDocument>('CommunicationLog', communicationLogSchema);