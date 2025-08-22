import React, { useState } from 'react';
import { IContact } from '@kinect/shared';

interface DeleteConfirmationModalProps {
  contact: IContact;
  onDelete: (contactId: string) => void;
  onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  contact,
  onDelete,
  onClose,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const contactName = `${contact.firstName} ${contact.lastName}`;
  const isConfirmValid = confirmText === 'DELETE' || confirmText === contactName;

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    try {
      setLoading(true);
      await onDelete(contact._id!);
      onClose();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-red-600">Delete Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Delete {contactName}?</h3>
              <p className="text-sm text-red-700 mt-1">This action cannot be undone.</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Contact information and details</li>
              <li>All communication history and logs</li>
              <li>Any reminders associated with this contact</li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
            To confirm deletion, type <span className="font-bold">DELETE</span> or the
            contact&apos;s full name:
          </label>
          <input
            type="text"
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type "DELETE" or "${contactName}"`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmValid || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Contact'}
          </button>
        </div>
      </div>
    </div>
  );
};
