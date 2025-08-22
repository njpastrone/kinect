import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ContactList } from '../components/contacts/ContactList';
import { GroupedContactList } from '../components/contacts/GroupedContactList';
import { AddContactModal } from '../components/contacts/AddContactModal';
import { ControlBar } from '../components/common/ControlBar';
import { useViewPreferences, ViewPreferences } from '../components/common/ViewOptions';
import { useContacts } from '../hooks/useContacts';
import { IContact, IContactList } from '@kinect/shared';
import api from '../services/api';

export const Contacts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { listId: routeListId } = useParams<{ listId: string }>();
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

  const handleDeleteContact = async (contactId: string) => {
    try {
      await api.deleteContact(contactId);
      fetchContacts(); // Refresh the contacts list
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const handleUpdateContact = async (contactId: string, updates: Partial<IContact>) => {
    try {
      await api.updateContact(contactId, updates);
      fetchContacts(); // Refresh the contacts list
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  // Helper function to determine if a contact is overdue
  const isContactOverdue = (contact: IContact): boolean => {
    if (!contact.lastContactDate) return true; // No contact logged means overdue

    // Determine reminder interval
    let reminderDays = contact.customReminderDays;

    if (!reminderDays) {
      // Use list reminder days if contact is in a list
      if (contact.listId) {
        const contactList = lists.find((list) => list._id === contact.listId);
        reminderDays = contactList?.reminderDays;
      }

      // Fallback to category-based defaults
      if (!reminderDays) {
        switch (contact.category) {
          case 'BEST_FRIEND':
            reminderDays = 30;
            break;
          case 'FRIEND':
            reminderDays = 90;
            break;
          case 'ACQUAINTANCE':
            reminderDays = 180;
            break;
          default:
            reminderDays = 90;
        }
      }
    }

    const daysSinceContact = Math.floor(
      (Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceContact > reminderDays;
  };

  // Filter contacts based on URL parameters and route params
  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    // Handle list filtering from either route params or query params
    const listId = routeListId || searchParams.get('listId');
    if (listId) {
      filtered = contacts.filter((contact) => contact.listId === listId);
    }

    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      // Filter for overdue contacts
      filtered = filtered.filter(isContactOverdue);
    }

    return filtered;
  }, [contacts, searchParams, routeListId, lists]);

  // Sort and group contacts
  const processedContacts = useMemo(() => {
    if (preferences.groupByList) {
      // Group contacts by list
      const grouped = new Map<string, { list: IContactList | null; contacts: IContact[] }>();

      filteredContacts.forEach((contact) => {
        const listId = contact.listId || 'no-list';
        const list = lists.find((l) => l._id === contact.listId) || null;

        if (!grouped.has(listId)) {
          grouped.set(listId, { list, contacts: [] });
        }

        grouped.get(listId)!.contacts.push(contact);
      });

      // Convert to array and sort groups
      const groupedArray = Array.from(grouped.values()).map((group) => ({
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
      groupedArray.forEach((group) => {
        group.contacts.sort((a, b) => {
          let comparison = 0;

          switch (preferences.sortBy) {
            case 'name':
              comparison = `${a.firstName} ${a.lastName}`.localeCompare(
                `${b.firstName} ${b.lastName}`
              );
              break;
            case 'updated': {
              const dateA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
              const dateB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
              comparison = dateB.getTime() - dateA.getTime();
              break;
            }
            default:
              comparison = `${a.firstName} ${a.lastName}`.localeCompare(
                `${b.firstName} ${b.lastName}`
              );
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
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            );
            break;
          case 'updated': {
            const dateA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
            const dateB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
            comparison = dateB.getTime() - dateA.getTime();
            break;
          }
          default:
            comparison = `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            );
        }

        return preferences.sortOrder === 'asc' ? comparison : -comparison;
      });

      return sorted;
    }
  }, [filteredContacts, lists, preferences]);

  // Get current list name for title
  const currentList = useMemo(() => {
    const listId = routeListId || searchParams.get('listId');
    return listId ? lists.find((list) => list._id === listId) : null;
  }, [routeListId, searchParams, lists]);

  // Get page title based on filters
  const pageTitle = useMemo(() => {
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      return 'Overdue Contacts';
    }
    return currentList ? `${currentList.name} Contacts` : 'Contacts';
  }, [currentList, searchParams]);

  // Get page subtitle with count
  const pageSubtitle = useMemo(() => {
    const filter = searchParams.get('filter');
    if (filter === 'overdue') {
      return `${filteredContacts.length} overdue contact${filteredContacts.length !== 1 ? 's' : ''}`;
    }
    if (currentList) {
      return `${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''} in this list`;
    }
    return null;
  }, [currentList, filteredContacts.length, searchParams]);

  // Sort options for contacts
  const contactSortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'updated', label: 'Last Contact' },
    { value: 'created', label: 'Date Added' },
  ];

  const handleGroupByChange = (grouped: boolean) => {
    updatePreferences({ ...preferences, groupByList: grouped });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updatePreferences({ ...preferences, sortBy: sortBy as ViewPreferences['sortBy'], sortOrder });
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    updatePreferences({ ...preferences, view });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            {pageSubtitle && <p className="mt-1 text-sm text-gray-600">{pageSubtitle}</p>}
          </div>
          <button
            onClick={handleAddContact}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Contact
          </button>
        </div>

        <ControlBar
          view={preferences.view}
          onViewChange={handleViewChange}
          grouped={preferences.groupByList}
          onGroupChange={handleGroupByChange}
          showGroupBy={true}
          sortBy={preferences.sortBy}
          sortOrder={preferences.sortOrder}
          onSortChange={handleSortChange}
          sortOptions={contactSortOptions}
          title={
            searchParams.get('filter') === 'overdue'
              ? 'Overdue Contact Options'
              : currentList
                ? `${currentList.name} Options`
                : 'Contact Options'
          }
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading contacts...</div>
          </div>
        ) : preferences.groupByList ? (
          <GroupedContactList
            groupedContacts={processedContacts as any}
            lists={lists}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onUpdateContact={handleUpdateContact}
            viewMode={preferences.view}
          />
        ) : (
          <ContactList
            contacts={processedContacts as IContact[]}
            lists={lists}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onUpdateContact={handleUpdateContact}
            viewMode={preferences.view}
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
