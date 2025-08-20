import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ContactList } from '../components/contacts/ContactList';
import { AddContactModal } from '../components/contacts/AddContactModal';
import { useContacts } from '../hooks/useContacts';
import { IContact } from '@kinect/shared';

export const Contacts: React.FC = () => {
  const { contacts, fetchContacts, isLoading } = useContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: IContact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    fetchContacts();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <button
            onClick={handleAddContact}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Contact
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading contacts...</div>
          </div>
        ) : (
          <ContactList contacts={contacts} onEditContact={handleEditContact} />
        )}

        <AddContactModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          contact={selectedContact}
        />
      </div>
    </Layout>
  );
};