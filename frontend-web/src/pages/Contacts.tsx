import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Layout } from '../components/layout/Layout';
import { ContactsErrorBoundary, FormErrorBoundary } from '../components/common/FeatureErrorBoundary';
import { ContactList } from '../components/contacts/ContactList';
import { GroupedContactList } from '../components/contacts/GroupedContactList';
import { AddContactModal } from '../components/contacts/AddContactModal';
import { ControlBar } from '../components/common/ControlBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { usePagePreferences } from '../hooks/usePreferences';
import { useContacts } from '../hooks/useContacts';
import { IContact, IContactList } from '@kinect/shared';
import {
  groupItemsByList,
  sortGroupedItems,
  createSortFunction,
  isContactOverdue,
} from '../utils/grouping';
import { useErrorHandler } from '../hooks/useErrorHandler';
import api from '../services/api';

export const Contacts: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { listId: routeListId } = useParams<{ listId: string }>();
  const { contacts, fetchContacts, isLoading } = useContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<IContact | null>(null);
  const [lists, setLists] = useState<IContactList[]>([]);
  const { preferences, updateView, updateSort, updateGrouping } = usePagePreferences('contacts');
  const handleError = useErrorHandler();

  useEffect(() => {
    fetchContacts();
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const listsData = await api.getLists();
      setLists(listsData);
    } catch (error) {
      handleError(error, 'Failed to load contact lists');
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
      toast.success('Contact deleted successfully');
      fetchContacts(); // Refresh the contacts list
    } catch (error) {
      handleError(error, 'Failed to delete contact');
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const handleUpdateContact = async (contactId: string, updates: Partial<IContact>) => {
    try {
      await api.updateContact(contactId, updates);
      toast.success('Contact updated successfully');
      fetchContacts(); // Refresh the contacts list
    } catch (error) {
      handleError(error, 'Failed to update contact');
      throw error; // Re-throw so the modal can handle the error
    }
  };

  // Helper function to determine if a contact is overdue
  const checkContactOverdue = (contact: IContact): boolean => {
    return isContactOverdue(contact, lists);
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
      filtered = filtered.filter(checkContactOverdue);
    }

    return filtered;
  }, [contacts, searchParams, routeListId, lists]);

  // Sort and group contacts
  const processedContacts = useMemo(() => {
    if (preferences.groupByList) {
      // Group contacts by list using utility
      const grouped = groupItemsByList(filteredContacts, lists, checkContactOverdue);

      // Sort contacts within each group
      const sortFunction = createSortFunction(preferences.sortBy, preferences.sortOrder);
      const sortedGroups = sortGroupedItems(grouped, sortFunction);

      // Transform to match expected format
      return sortedGroups.map((group) => ({
        list: group.list,
        contacts: group.items,
        overdueCount: group.overdueCount || 0,
      }));
    } else {
      // Return sorted contacts without grouping
      const sortFunction = createSortFunction(preferences.sortBy, preferences.sortOrder);
      return [...filteredContacts].sort(sortFunction);
    }
  }, [filteredContacts, lists, preferences, checkContactOverdue]);

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
    updateGrouping(grouped);
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSort(sortBy, sortOrder);
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    updateView(view);
  };

  return (
    <Layout listName={currentList?.name}>
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
            <LoadingSpinner size="lg" text="Loading contacts..." />
          </div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            type={searchParams.get('filter') === 'overdue' ? 'overdue' : 'contacts'}
            title={
              searchParams.get('filter') === 'overdue' ? 'No overdue contacts' : 'No contacts found'
            }
            description={
              searchParams.get('filter') === 'overdue'
                ? 'Great job! All your contacts are up to date.'
                : currentList
                  ? `No contacts in "${currentList.name}" yet.`
                  : 'Add your first contact to get started with relationship management.'
            }
            actionLabel={searchParams.get('filter') === 'overdue' ? undefined : 'Add Contact'}
            onAction={searchParams.get('filter') === 'overdue' ? undefined : handleAddContact}
          />
        ) : preferences.groupByList ? (
          <ContactsErrorBoundary onRetry={() => fetchContacts()}>
            <GroupedContactList
              groupedContacts={processedContacts as any}
              lists={lists}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              onUpdateContact={handleUpdateContact}
              viewMode={preferences.view}
            />
          </ContactsErrorBoundary>
        ) : (
          <ContactsErrorBoundary onRetry={() => fetchContacts()}>
            <ContactList
              contacts={processedContacts as IContact[]}
              lists={lists}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              onUpdateContact={handleUpdateContact}
              viewMode={preferences.view}
            />
          </ContactsErrorBoundary>
        )}

        <FormErrorBoundary>
          <AddContactModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            contact={selectedContact}
          />
        </FormErrorBoundary>
      </div>
    </Layout>
  );
};
