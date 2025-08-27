import React, { useState } from 'react';
import { IContact, IContactList } from '@kinect/shared';
import { subDays } from 'date-fns';
import { FormError, FormField } from '../common/FormError';
import { LoadingButton } from '../common/LoadingButton';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import toast from 'react-hot-toast';

interface StatusUpdateModalProps {
  contact: IContact;
  lists: IContactList[];
  onUpdate: (contactId: string, updates: Partial<IContact>) => void;
  onClose: () => void;
}

const CONTACT_METHODS = [
  { value: 'PHONE_CALL', label: 'Phone Call', icon: '📞' },
  { value: 'TEXT', label: 'Text Message', icon: '💬' },
  { value: 'EMAIL', label: 'Email', icon: '📧' },
  { value: 'IN_PERSON', label: 'In Person', icon: '👥' },
  { value: 'OTHER', label: 'Other', icon: '📝' },
];

const QUICK_ACTIONS = [
  { label: 'Contacted Today', date: new Date() },
  { label: 'Contacted Yesterday', date: subDays(new Date(), 1) },
  { label: 'Contacted This Week', date: subDays(new Date(), 7) },
];

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  contact,
  lists,
  onUpdate,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState('PHONE_CALL');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [notes, setNotes] = useState('');
  const [selectedListId, setSelectedListId] = useState(contact.listId || '');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const handleError = useErrorHandler();

  const handleQuickAction = async (actionDate: Date) => {
    await handleUpdate(actionDate);
  };

  const handleCustomUpdate = async () => {
    const timestamp = new Date(`${customDate}T${customTime}`);
    await handleUpdate(timestamp);
  };

  const handleUpdate = async (lastContactDate: Date) => {
    setApiError(null);
    try {
      setLoading(true);

      const updates: Partial<IContact> = {
        lastContactDate,
        listId: selectedListId || contact.listId,
      };

      await onUpdate(contact._id!, updates);

      // Also log the communication if notes are provided
      if (notes.trim()) {
        // This would typically call the log communication API
        console.log('Logging communication:', {
          contactId: contact._id,
          type: contactMethod,
          timestamp: lastContactDate,
          notes: notes.trim(),
        });
      }

      toast.success('Contact status updated successfully');
      onClose();
    } catch (error: any) {
      const message = handleError(error, 'Failed to update contact status');
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Update Status: {contact.firstName} {contact.lastName}
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

        {apiError && <FormError error={apiError} className="mb-4" />}
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.date)}
                  disabled={loading}
                  className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">{action.label}</div>
                  <div className="text-sm text-gray-600">{action.date.toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Custom Date & Time</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useCustomDate}
                  onChange={(e) => setUseCustomDate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Use custom date</span>
              </label>
            </div>

            {useCustomDate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date" required>
                    <input
                      type="date"
                      id="customDate"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                  <FormField label="Time" required>
                    <input
                      type="time"
                      id="customTime"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormField>
                </div>

                <LoadingButton
                  onClick={handleCustomUpdate}
                  loading={loading}
                  loadingText="Updating..."
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Update with Custom Date
                </LoadingButton>
              </div>
            )}
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Method</label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setContactMethod(method.value)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    contactMethod === method.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{method.icon}</div>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Assignment */}
          {lists.length > 0 && (
            <FormField label="Assign to List">
              <select
                id="listSelect"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No List</option>
                {lists.map((list) => (
                  <option key={list._id} value={list._id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          {/* Notes */}
          <FormField label="Notes (optional)">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this interaction..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormField>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
