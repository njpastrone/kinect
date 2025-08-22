import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ControlBar } from '../components/common/ControlBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { IContact, IContactList } from '@kinect/shared';
import { LogContactModal } from '../components/contacts/LogContactModal';
import { usePagePreferences } from '../hooks/usePreferences';
import { routes } from '../utils/navigation';
import api from '../services/api';

interface OverdueContact extends IContact {
  list?: IContactList;
  daysSinceLastContact: number;
  reminderThreshold?: number;
}

interface ContactNowModalProps {
  contact: OverdueContact;
  onClose: () => void;
  onContactMarked: () => void;
}

// Helper components
interface OverdueContactItemProps {
  contact: OverdueContact;
  onLogContact: (contact: OverdueContact) => void;
  onContactNow: (contact: OverdueContact) => void;
  getDaysOverdueColor: (days: number) => string;
  showListName?: boolean;
}

const OverdueContactItem: React.FC<OverdueContactItemProps> = ({
  contact,
  onLogContact,
  onContactNow,
  getDaysOverdueColor,
  showListName = false,
}) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="font-medium text-gray-900">
          {contact.firstName} {contact.lastName}
        </h3>
        {showListName && (
          <span className="text-sm text-gray-500">in {contact.list?.name || 'No list'}</span>
        )}
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDaysOverdueColor(contact.daysSinceLastContact)}`}
        >
          {Math.floor(contact.daysSinceLastContact)} days overdue
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          Last contact:{' '}
          {contact.lastContactDate
            ? new Date(contact.lastContactDate).toLocaleDateString()
            : 'Never'}
        </span>
        {contact.phoneNumber && <span>📞 {contact.phoneNumber}</span>}
      </div>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onLogContact(contact)}
        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        Log Contact
      </button>
      <button
        onClick={() => onContactNow(contact)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        Contact Now
      </button>
    </div>
  </div>
);

interface GroupedOverdueContactsProps {
  overdueContacts: OverdueContact[];
  onLogContact: (contact: OverdueContact) => void;
  onContactNow: (contact: OverdueContact) => void;
  getDaysOverdueColor: (days: number) => string;
}

const GroupedOverdueContacts: React.FC<GroupedOverdueContactsProps> = ({
  overdueContacts,
  onLogContact,
  onContactNow,
  getDaysOverdueColor,
}) => {
  // Group contacts by list
  const groupedContacts = React.useMemo(() => {
    const groups = new Map<string, { list: IContactList | null; contacts: OverdueContact[] }>();

    overdueContacts.forEach((contact) => {
      const listId = contact.list?._id || 'no-list';
      if (!groups.has(listId)) {
        groups.set(listId, {
          list: contact.list || null,
          contacts: [],
        });
      }
      groups.get(listId)!.contacts.push(contact);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const nameA = a.list?.name || 'No List';
      const nameB = b.list?.name || 'No List';
      return nameA.localeCompare(nameB);
    });
  }, [overdueContacts]);

  return (
    <div className="space-y-6">
      {groupedContacts.map((group) => (
        <div key={group.list?._id || 'no-list'} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">{group.list?.name || 'No List'}</h3>
              <span className="text-sm text-gray-500">({group.contacts.length} overdue)</span>
            </div>
            {group.list?.color && (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.list.color }} />
            )}
          </div>

          <div className="space-y-3 ml-4">
            {group.contacts.map((contact) => (
              <OverdueContactItem
                key={contact._id}
                contact={contact}
                onLogContact={onLogContact}
                onContactNow={onContactNow}
                getDaysOverdueColor={getDaysOverdueColor}
                showListName={false}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ContactNowModal: React.FC<ContactNowModalProps> = ({ contact, onClose, onContactMarked }) => {
  const [loading, setLoading] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleMarkAsContacted = async () => {
    try {
      setLoading(true);
      await api.markContactAsContacted(contact._id!);
      onContactMarked();
      onClose();
    } catch (error) {
      console.error('Failed to mark as contacted:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReminder = async () => {
    if (!reminderDate) return;

    try {
      setLoading(true);
      await api.scheduleContactReminder(contact._id!, reminderDate, notes);
      onContactMarked();
      onClose();
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Contact {contact.firstName} {contact.lastName}
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

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">
              <span className="font-medium">List:</span> {contact.list?.name || 'No list'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last contacted:</span>{' '}
              {contact.lastContactDate
                ? new Date(contact.lastContactDate).toLocaleDateString()
                : 'Never'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Days overdue:</span>{' '}
              <span className="text-red-600 font-medium">
                {Math.floor(contact.daysSinceLastContact)} days
              </span>
            </p>
            {contact.phoneNumber && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Phone:</span> {contact.phoneNumber}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={handleMarkAsContacted}
              disabled={loading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Mark as Contacted
            </button>

            {contact.phoneNumber && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${contact.phoneNumber}`}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call
                </a>
                <a
                  href={`sms:${contact.phoneNumber}`}
                  className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Text
                </a>
              </div>
            )}

            {/* Schedule Reminder */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule Future Reminder</h4>
              <div className="space-y-2">
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleScheduleReminder}
                  disabled={!reminderDate || loading}
                  className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-md text-sm transition-colors"
                >
                  Schedule Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overdueContacts, setOverdueContacts] = useState<OverdueContact[]>([]);
  const [lists, setLists] = useState<
    (IContactList & { contactCount: number; overdueCount: number })[]
  >([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<OverdueContact | null>(null);
  const [logContactModal, setLogContactModal] = useState<OverdueContact | null>(null);
  const { preferences, updateView, updateSort, updateGrouping } = usePagePreferences('dashboard');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load overdue contacts
      const overdueResponse = await api.getOverdueContacts({ limit: 10 });
      setOverdueContacts(overdueResponse.items);

      // Load lists with stats
      const listsResponse = await api.getLists();
      setLists(listsResponse as any);

      // Load total contacts count
      const contactsResponse = await api.getContacts({ limit: 1 });
      setTotalContacts(contactsResponse.totalItems);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactMarked = () => {
    // Refresh the dashboard data after a contact is marked
    loadDashboardData();
  };

  const getDaysOverdueColor = (days: number) => {
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Sort overdue contacts based on preferences
  const sortedOverdueContacts = useMemo(() => {
    // Create custom sort function for overdue contacts
    const sortFunction = (a: OverdueContact, b: OverdueContact): number => {
      let comparison = 0;

      switch (preferences.sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'updated':
          comparison = b.daysSinceLastContact - a.daysSinceLastContact;
          break;
        case 'list': {
          const listA = a.list?.name || 'No List';
          const listB = b.list?.name || 'No List';
          comparison = listA.localeCompare(listB);
          break;
        }
        default:
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }

      return preferences.sortOrder === 'asc' ? comparison : -comparison;
    };

    return [...overdueContacts].sort(sortFunction);
  }, [overdueContacts, preferences]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Stay connected with your friends and loved ones</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => navigate(routes.contacts.index)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Total Contacts</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{totalContacts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate(routes.contacts.overdue)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Overdue Contacts</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">{overdueContacts.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate(routes.lists.index)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Active Lists</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">{lists.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Contacts Section */}
        {overdueContacts.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Overdue Contacts</h2>
                <span className="text-sm text-gray-500">
                  {overdueContacts.length} contact{overdueContacts.length !== 1 ? 's' : ''} need
                  {overdueContacts.length === 1 ? 's' : ''} attention
                </span>
              </div>
              <ControlBar
                view={preferences.view}
                onViewChange={updateView}
                grouped={preferences.groupByList}
                onGroupChange={updateGrouping}
                showGroupBy={true}
                sortBy={preferences.sortBy}
                sortOrder={preferences.sortOrder}
                onSortChange={updateSort}
                sortOptions={[
                  { value: 'name', label: 'Name' },
                  { value: 'updated', label: 'Days Overdue' },
                  { value: 'list', label: 'List Name' },
                ]}
                title="Overdue Contact Options"
              />
            </div>
            <div className="p-6">
              {preferences.groupByList ? (
                <GroupedOverdueContacts
                  overdueContacts={sortedOverdueContacts}
                  onLogContact={setLogContactModal}
                  onContactNow={setSelectedContact}
                  getDaysOverdueColor={getDaysOverdueColor}
                />
              ) : (
                <div
                  className={
                    preferences.view === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                      : 'space-y-4'
                  }
                >
                  {sortedOverdueContacts.map((contact) => (
                    <OverdueContactItem
                      key={contact._id}
                      contact={contact}
                      onLogContact={setLogContactModal}
                      onContactNow={setSelectedContact}
                      getDaysOverdueColor={getDaysOverdueColor}
                      showListName={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              type="overdue"
              title="You're all caught up!"
              description="No overdue contacts. Keep up the great work staying connected with your friends and family."
              className="p-8"
            />
          </div>
        )}

        {/* Lists Overview */}
        {lists.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Lists</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => (
                  <div
                    key={list._id}
                    onClick={() => navigate(routes.lists.view(list._id!))}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{list.name}</h3>
                      {list.overdueCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {list.overdueCount} overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {list.contactCount} contact{list.contactCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Now Modal */}
        {selectedContact && (
          <ContactNowModal
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onContactMarked={handleContactMarked}
          />
        )}

        {/* Log Contact Modal */}
        {logContactModal && (
          <LogContactModal
            contact={logContactModal}
            onClose={() => setLogContactModal(null)}
            onContactLogged={handleContactMarked}
          />
        )}
      </div>
    </Layout>
  );
};
