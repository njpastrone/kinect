export enum ContactCategory {
  BEST_FRIEND = 'BEST_FRIEND',
  FRIEND = 'FRIEND',
  ACQUAINTANCE = 'ACQUAINTANCE',
  CUSTOM = 'CUSTOM',
}

export interface IContact {
  _id?: string;
  userId: string;
  listId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  birthday?: Date;
  category: ContactCategory;
  customReminderDays?: number;
  lastContactDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactList {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  reminderDays?: number;
  contactIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICommunicationLog {
  _id?: string;
  userId: string;
  contactId: string;
  type: 'PHONE_CALL' | 'TEXT' | 'EMAIL' | 'IN_PERSON' | 'OTHER';
  timestamp: Date;
  duration?: number;
  notes?: string;
  createdAt?: Date;
}
