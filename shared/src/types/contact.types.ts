export interface IContact {
  _id?: string;
  userId: string;
  listId?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  birthday?: Date;
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

export interface IImportContactPreview {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
  duplicateOf?: IContact;
}

export interface IImportResult {
  totalParsed: number;
  validContacts: number;
  invalidContacts: number;
  duplicatesFound: number;
  imported: number;
  skipped: number;
  errors: string[];
}
