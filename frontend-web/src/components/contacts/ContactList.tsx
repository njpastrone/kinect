import React from 'react';
import { IContact, IContactList } from '@kinect/shared';
import { ContactCard } from './ContactCard';

interface ContactListProps {
  contacts: IContact[];
  lists?: IContactList[];
  onEditContact: (contact: IContact) => void;
  onDeleteContact?: (contactId: string) => void;
  onUpdateContact?: (contactId: string, updates: Partial<IContact>) => void;
  viewMode?: 'grid' | 'list';
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  lists = [],
  onEditContact,
  onDeleteContact,
  onUpdateContact,
  viewMode = 'grid',
}) => {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No contacts yet. Add your first contact to get started!</p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'
      }
    >
      {contacts.map((contact) => (
        <ContactCard
          key={contact._id}
          contact={contact}
          lists={lists}
          onEdit={() => onEditContact(contact)}
          onDelete={onDeleteContact}
          onUpdate={onUpdateContact}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};
