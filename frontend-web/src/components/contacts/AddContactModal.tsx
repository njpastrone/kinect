import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IContact } from '@kinect/shared';
import { useContacts } from '../../hooks/useContacts';
import { FormError, FormField, FormErrorSummary } from '../common/FormError';
import { LoadingButton } from '../common/LoadingButton';
import { useErrorHandler, extractErrorMessage } from '../../hooks/useErrorHandler';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: IContact | null;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, contact }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Partial<IContact>>();
  const { createContact, updateContact, lists, fetchLists, isCreating, isUpdating } = useContacts();
  const [apiError, setApiError] = useState<string | null>(null);
  const handleError = useErrorHandler();

  useEffect(() => {
    if (contact) {
      reset(contact);
    } else {
      reset({});
    }
  }, [contact, reset]);

  useEffect(() => {
    if (isOpen && lists.length === 0) {
      fetchLists();
    }
  }, [isOpen, lists.length, fetchLists]);

  const onSubmit = async (data: Partial<IContact>) => {
    setApiError(null);
    try {
      if (contact?._id) {
        await updateContact(contact._id, data);
      } else {
        await createContact(data);
      }

      onClose();
      reset();
    } catch (error) {
      const message = extractErrorMessage(error);
      setApiError(message);
      handleError(error, contact?._id ? 'Failed to update contact' : 'Failed to create contact');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{contact ? 'Edit Contact' : 'Add New Contact'}</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormErrorSummary errors={Object.values(errors).filter(Boolean).map(err => err?.message).filter(Boolean) as string[]} />
          {apiError && <FormError error={apiError} className="mb-4" />}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <FormError error={errors.firstName?.message} />
            </FormField>

            <FormField label="Last Name" required>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <FormError error={errors.lastName?.message} />
            </FormField>
          </div>

          <FormField label="Email">
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <FormError error={errors.email?.message} />
          </FormField>

          <FormField label="Phone Number">
            <input
              {...register('phoneNumber')}
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <FormError error={errors.phoneNumber?.message} />
          </FormField>

          <FormField label="List">
            <select
              {...register('listId')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No list (use default reminders)</option>
              {lists.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name} {list.reminderDays ? `(${list.reminderDays} days)` : ''}
                </option>
              ))}
            </select>
            <FormError error={errors.listId?.message} />
          </FormField>

          <FormField label="Custom Reminder Days (Optional)">
            <input
              {...register('customReminderDays', { 
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1 day' },
                max: { value: 365, message: 'Must be less than 365 days' }
              })}
              type="number"
              min="1"
              max="365"
              placeholder="Override reminder interval (days)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <FormError error={errors.customReminderDays?.message} />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to use list's reminder interval, or 90 days if no list selected
            </p>
          </FormField>

          <FormField label="Notes">
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <FormError error={errors.notes?.message} />
          </FormField>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              loading={isCreating || isUpdating}
              loadingText={contact ? 'Updating...' : 'Creating...'}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {contact ? 'Update' : 'Create'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};
