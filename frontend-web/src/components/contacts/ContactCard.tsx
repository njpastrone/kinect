import React, { useState } from 'react';
import { IContact, IContactList } from '@kinect/shared';
import { useContacts } from '../../hooks/useContacts';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { StatusUpdateModal } from './StatusUpdateModal';

interface ContactCardProps {
  contact: IContact;
  lists?: IContactList[];
  onEdit: (contact: IContact) => void;
  onDelete?: (contactId: string) => void;
  onUpdate?: (contactId: string, updates: Partial<IContact>) => void;
  viewMode?: 'grid' | 'list';
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  lists = [],
  onEdit,
  onDelete,
  onUpdate,
  viewMode = 'grid',
}) => {
  const { deleteContact, logInteraction, updateContact } = useContacts();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (contactId: string) => {
    if (onDelete) {
      await onDelete(contactId);
    } else {
      await deleteContact(contactId);
    }
    setShowDeleteModal(false);
  };

  const handleStatusUpdate = async (contactId: string, updates: Partial<IContact>) => {
    if (onUpdate) {
      await onUpdate(contactId, updates);
    } else {
      await updateContact(contactId, updates);
    }
    setShowStatusModal(false);
  };

  const handleLogContact = async () => {
    await logInteraction(contact._id!, 'OTHER', 'Manual contact log');
  };

  const daysSinceContact = contact.lastContactDate
    ? Math.floor((Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getListInfo = () => {
    const list = lists.find(l => l._id === contact.listId);
    return list || { name: 'No List', color: '#6B7280' }; // Gray fallback
  };

  const getListColorClasses = (color?: string) => {
    // Convert hex color to Tailwind classes or use a mapping
    if (!color) return 'bg-gray-100 text-gray-800';
    
    // Simple color mapping - could be enhanced with a more sophisticated system
    switch (color.toLowerCase()) {
      case '#ef4444': return 'bg-red-100 text-red-800';
      case '#f59e0b': return 'bg-yellow-100 text-yellow-800';
      case '#3b82f6': return 'bg-blue-100 text-blue-800';
      case '#10b981': return 'bg-green-100 text-green-800';
      case '#8b5cf6': return 'bg-purple-100 text-purple-800';
      case '#f97316': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // List view (compact horizontal layout)
  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contact.firstName}{contact.lastName ? ` ${contact.lastName}` : ''}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${getListColorClasses(getListInfo().color)}`}
                    >
                      {getListInfo().name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    {contact.email && <span>📧 {contact.email}</span>}
                    {contact.phoneNumber && <span>📞 {contact.phoneNumber}</span>}
                    {daysSinceContact !== null && (
                      <span className={daysSinceContact > 30 ? 'text-red-600 font-medium' : ''}>
                        Last contact: {daysSinceContact} days ago
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogContact}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Log Contact
              </button>
              <button
                onClick={() => onEdit(contact)}
                className="px-3 py-1 text-blue-600 hover:bg-blue-50 text-sm rounded-md transition-colors"
              >
                Edit Info
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3 py-1 text-green-600 hover:bg-green-50 text-sm rounded-md transition-colors"
              >
                Update Status
              </button>
              <button
                onClick={handleDeleteClick}
                className="px-3 py-1 text-red-600 hover:bg-red-50 text-sm rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <DeleteConfirmationModal
            contact={contact}
            onDelete={handleDeleteConfirm}
            onClose={() => setShowDeleteModal(false)}
          />
        )}

        {showStatusModal && (
          <StatusUpdateModal
            contact={contact}
            lists={lists}
            onUpdate={handleStatusUpdate}
            onClose={() => setShowStatusModal(false)}
          />
        )}
      </>
    );
  }

  // Grid view (original card layout)
  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {contact.firstName}{contact.lastName ? ` ${contact.lastName}` : ''}
            </h3>
            <span
              className={`inline-block px-2 py-1 text-xs rounded-full ${getListColorClasses(getListInfo().color)} mt-1`}
            >
              {getListInfo().name}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(contact)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Info
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Update Status
              </button>
            </div>
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-800 text-sm text-left"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          {contact.email && <p>Email: {contact.email}</p>}
          {contact.phoneNumber && <p>Phone: {contact.phoneNumber}</p>}
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

      {showDeleteModal && (
        <DeleteConfirmationModal
          contact={contact}
          onDelete={handleDeleteConfirm}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {showStatusModal && (
        <StatusUpdateModal
          contact={contact}
          lists={lists}
          onUpdate={handleStatusUpdate}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </>
  );
};
