import React from 'react';
import { IContact } from '@kinect/shared';
import { useContacts } from '../../hooks/useContacts';

interface ContactCardProps {
  contact: IContact;
  onEdit: (contact: IContact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit }) => {
  const { deleteContact, logInteraction } = useContacts();
  
  const handleDelete = async () => {
    if (window.confirm(`Delete ${contact.firstName} ${contact.lastName}?`)) {
      await deleteContact(contact._id!);
    }
  };

  const handleLogContact = async () => {
    await logInteraction(contact._id!, 'OTHER', 'Manual contact log');
  };

  const daysSinceContact = contact.lastContactDate 
    ? Math.floor((Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getCategoryColor = () => {
    switch (contact.category) {
      case 'BEST_FRIEND': return 'bg-green-100 text-green-800';
      case 'FRIEND': return 'bg-blue-100 text-blue-800';
      case 'ACQUAINTANCE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h3>
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor()} mt-1`}>
            {contact.category.replace('_', ' ')}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(contact)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {contact.email && (
          <p>Email: {contact.email}</p>
        )}
        {contact.phoneNumber && (
          <p>Phone: {contact.phoneNumber}</p>
        )}
        {daysSinceContact !== null && (
          <p className={daysSinceContact > 30 ? 'text-red-600 font-medium' : ''}>
            Last contact: {daysSinceContact} days ago
          </p>
        )}
      </div>

      <button
        onClick={handleLogContact}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Log Contact
      </button>
    </div>
  );
};