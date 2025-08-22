import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ContactList } from '../components/contacts/ContactList';
import { GroupedContactList } from '../components/contacts/GroupedContactList';
import { AddContactModal } from '../components/contacts/AddContactModal';
import { ViewOptions, useViewPreferences } from '../components/common/ViewOptions';
import { useContacts } from '../hooks/useContacts';
import { IContact, IContactList } from '@kinect/shared';
import api from '../services/api';

export const Contacts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { contacts, fetchContacts, isLoading } = useContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);
  const [lists, setLists] = useState<IContactList[]>([]);
  const { preferences, updatePreferences } = useViewPreferences();

  useEffect(() => {
    fetchContacts();
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const listsData = await api.getLists();
      setLists(listsData);
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  };

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

  // Filter contacts based on URL parameters
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      // This would need additional logic to determine overdue status
      // For now, we'll just return all contacts
      filtered = contacts;
    }
    
    const listId = searchParams.get('listId');
    if (listId) {
      filtered = contacts.filter(contact => contact.listId === listId);
    }

    return filtered;
  }, [contacts, searchParams]);

  // Sort and group contacts
  const processedContacts = useMemo(() => {
    if (preferences.groupByList) {
      // Group contacts by list
      const grouped = new Map<string, { list: IContactList | null; contacts: IContact[] }>();
      
      filteredContacts.forEach(contact => {
        const listId = contact.listId || 'no-list';
        const list = lists.find(l => l._id === contact.listId) || null;
        
        if (!grouped.has(listId)) {
          grouped.set(listId, { list, contacts: [] });
        }
        
        grouped.get(listId)!.contacts.push(contact);
      });

      // Convert to array and sort groups
      const groupedArray = Array.from(grouped.values()).map(group => ({
        ...group,
        overdueCount: 0, // TODO: Calculate overdue count
      }));

      // Sort groups by list name
      groupedArray.sort((a, b) => {
        const nameA = a.list?.name || 'No List';
        const nameB = b.list?.name || 'No List';
        return preferences.sortOrder === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });

      // Sort contacts within each group
      groupedArray.forEach(group => {
        group.contacts.sort((a, b) => {
          let comparison = 0;
          
          switch (preferences.sortBy) {
            case 'name':
              comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
              break;
            case 'updated': {
              const dateA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
              const dateB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
              comparison = dateB.getTime() - dateA.getTime();
              break;
            }
            default:
              comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          }
          
          return preferences.sortOrder === 'asc' ? comparison : -comparison;
        });
      });

      return groupedArray;
    } else {
      // Return sorted contacts without grouping
      const sorted = [...filteredContacts].sort((a, b) => {
        let comparison = 0;
        
        switch (preferences.sortBy) {
          case 'name':
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            break;
          case 'updated': {
            const dateA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
            const dateB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
            comparison = dateB.getTime() - dateA.getTime();
            break;
          }
          default:
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        }
        
        return preferences.sortOrder === 'asc' ? comparison : -comparison;
      });

      return sorted;
    }
  }, [filteredContacts, lists, preferences]);

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

        <ViewOptions
          preferences={preferences}
          onChange={updatePreferences}
          showViewToggle={true}
          showGroupToggle={true}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading contacts...</div>
          </div>
        ) : preferences.groupByList ? (
          <GroupedContactList
            groupedContacts={processedContacts as any}
            onEditContact={handleEditContact}
            viewMode={preferences.view}
          />
        ) : (
          <ContactList 
            contacts={processedContacts as IContact[]} 
            onEditContact={handleEditContact} 
          />
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
