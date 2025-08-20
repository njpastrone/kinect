import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IContact, ContactCategory } from '@kinect/shared';
import { useContacts } from '../../hooks/useContacts';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: IContact | null;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, contact }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Partial<IContact>>();
  const { createContact, updateContact } = useContacts();

  useEffect(() => {
    if (contact) {
      reset(contact);
    } else {
      reset({});
    }
  }, [contact, reset]);

  const onSubmit = async (data: Partial<IContact>) => {
    try {
      if (contact?._id) {
        await updateContact(contact._id, data);
      } else {
        await createContact(data);
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {contact ? 'Edit Contact' : 'Add New Contact'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              {...register('phoneNumber')}
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value={ContactCategory.BEST_FRIEND}>Best Friend</option>
              <option value={ContactCategory.FRIEND}>Friend</option>
              <option value={ContactCategory.ACQUAINTANCE}>Acquaintance</option>
              <option value={ContactCategory.CUSTOM}>Custom</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {contact ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};