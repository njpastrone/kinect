import React, { useState } from 'react';
import { IContact } from '@kinect/shared';
import api from '../../services/api';

interface LogContactModalProps {
  contact: IContact;
  onClose: () => void;
  onContactLogged: () => void;
}

const CONTACT_METHODS = [
  { value: 'PHONE_CALL', label: 'Phone Call', icon: '📞' },
  { value: 'TEXT', label: 'Text Message', icon: '💬' },
  { value: 'EMAIL', label: 'Email', icon: '📧' },
  { value: 'IN_PERSON', label: 'In Person', icon: '👥' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

export const LogContactModal: React.FC<LogContactModalProps> = ({
  contact,
  onClose,
  onContactLogged,
}) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('PHONE_CALL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Combine date and time
      const timestamp = new Date(`${date}T${time}`);

      await api.logCommunication({
        contactId: contact._id!,
        type: method,
        timestamp,
        notes: notes.trim() || undefined,
      });

      onContactLogged();
      onClose();
    } catch (error) {
      console.error('Failed to log contact:', error);
      alert('Failed to log contact. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Log Contact with {contact.firstName} {contact.lastName}
          </h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Method</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_METHODS.map((methodOption) => (
                <button
                  key={methodOption.value}
                  type="button"
                  onClick={() => setMethod(methodOption.value)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    method === methodOption.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{methodOption.icon}</div>
                  {methodOption.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this interaction..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Logging...' : 'Log Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
