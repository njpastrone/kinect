import React from 'react';
import { IContact, IContactList } from '@kinect/shared';
import { ContactCard } from './ContactCard';

interface GroupedContactsData {
  list: IContactList | null;
  contacts: IContact[];
  overdueCount: number;
}

interface GroupedContactListProps {
  groupedContacts: GroupedContactsData[];
  onEditContact: (contact: IContact) => void;
  viewMode: 'grid' | 'list';
}

export const GroupedContactList: React.FC<GroupedContactListProps> = ({
  groupedContacts,
  onEditContact,
  viewMode,
}) => {
  if (groupedContacts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-600">Add your first contact to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedContacts.map((group, index) => (
        <div key={group.list?._id || 'no-list'} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {group.list?.name || 'No List'}
              </h2>
              <span className="text-sm text-gray-500">
                ({group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''})
              </span>
              {group.overdueCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {group.overdueCount} overdue
                </span>
              )}
            </div>
            {group.list?.color && (
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: group.list.color }}
              />
            )}
          </div>
          
          {group.list?.description && (
            <p className="text-sm text-gray-600">{group.list.description}</p>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.contacts.map((contact) => (
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  onEdit={() => onEditContact(contact)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {group.contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {contact.phoneNumber && (
                            <span>📞 {contact.phoneNumber}</span>
                          )}
                          {contact.email && (
                            <span>📧 {contact.email}</span>
                          )}
                          {contact.lastContactDate && (
                            <span>
                              Last contact: {new Date(contact.lastContactDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditContact(contact)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};