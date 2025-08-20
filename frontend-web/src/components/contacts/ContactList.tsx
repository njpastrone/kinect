import React from 'react';
import { IContact } from '@kinect/shared';
import { ContactCard } from './ContactCard';

interface ContactListProps {
  contacts: IContact[];
  onEditContact: (contact: IContact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ contacts, onEditContact }) => {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No contacts yet. Add your first contact to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contacts.map((contact) => (
        <ContactCard
          key={contact._id}
          contact={contact}
          onEdit={onEditContact}
        />
      ))}
    </div>
  );
};