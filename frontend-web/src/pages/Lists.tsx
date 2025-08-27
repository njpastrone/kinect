import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { IContactList } from '@kinect/shared';
import { ListCard } from '../components/lists/ListCard';
import { ListForm } from '../components/lists/ListForm';
import { Layout } from '../components/layout/Layout';
import { ListsErrorBoundary, FormErrorBoundary } from '../components/common/FeatureErrorBoundary';
import { ControlBar } from '../components/common/ControlBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { usePagePreferences } from '../hooks/usePreferences';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { routes } from '../utils/navigation';
import api from '../services/api';

const REMINDER_PRESETS = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 30, label: 'Monthly' },
  { value: 60, label: 'Bi-monthly' },
  { value: 90, label: 'Quarterly' },
  { value: 180, label: 'Bi-annually' },
  { value: 365, label: 'Annually' },
];

interface ListFormData {
  name: string;
  description: string;
  reminderDays: number;
  color: string;
}

interface ListWithStats extends IContactList {
  contactCount: number;
  overdueCount: number;
}

export const Lists: React.FC = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState<IContactList | null>(null);
  const { preferences: viewPreferences, updateView, updateSort } = usePagePreferences('lists');
  const [formData, setFormData] = useState<ListFormData>({
    name: '',
    description: '',
    reminderDays: 30,
    color: '#3B82F6',
  });
  const [customReminderDays, setCustomReminderDays] = useState<number | null>(null);
  const handleError = useErrorHandler();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await api.getLists();
      setLists(response as ListWithStats[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch lists');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reminderDays: 30,
      color: '#3B82F6',
    });
    setCustomReminderDays(null);
    setEditingList(null);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const listData = {
        ...formData,
        reminderDays: customReminderDays || formData.reminderDays,
      };
      await api.createList(listData);
      await fetchLists();
      toast.success('List created successfully');
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create list';
      setError(errorMsg);
      handleError(err, 'Failed to create list');
    }
  };

  const handleEditList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList) return;

    try {
      const listData = {
        ...formData,
        reminderDays: customReminderDays || formData.reminderDays,
      };
      await api.updateList(editingList._id!, listData);
      await fetchLists();
      toast.success('List updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update list';
      setError(errorMsg);
      handleError(err, 'Failed to update list');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (
      !window.confirm('Are you sure you want to delete this list? This action cannot be undone.')
    ) {
      return;
    }

    try {
      await api.deleteList(listId);
      await fetchLists();
      toast.success('List deleted successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete list';
      setError(errorMsg);
      handleError(err, 'Failed to delete list');
    }
  };

  const handleEdit = (list: IContactList) => {
    setEditingList(list);
    setFormData({
      name: list.name,
      description: list.description || '',
      reminderDays: list.reminderDays || 30,
      color: list.color || '#3B82F6',
    });

    // Check if reminderDays is a custom value
    const isPreset = REMINDER_PRESETS.some((preset) => preset.value === list.reminderDays);
    if (!isPreset && list.reminderDays) {
      setCustomReminderDays(list.reminderDays);
    }

    setShowEditModal(true);
  };

  const handleViewContacts = (listId: string) => {
    // Navigate to contacts page with list filter using React Router
    navigate(routes.lists.view(listId));
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Sort lists based on preferences
  const sortedLists = useMemo(() => {
    const sorted = [...lists].sort((a, b) => {
      let comparison = 0;

      switch (viewPreferences.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'contactCount':
          comparison = a.contactCount - b.contactCount;
          break;
        case 'reminderDays':
          comparison = (a.reminderDays || 30) - (b.reminderDays || 30);
          break;
        case 'overdueCount':
          comparison = a.overdueCount - b.overdueCount;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return viewPreferences.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [lists, viewPreferences]);

  // Sort options for lists
  const listSortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'contactCount', label: 'Contact Count' },
    { value: 'reminderDays', label: 'Reminder Interval' },
    { value: 'overdueCount', label: 'Overdue Count' },
  ];

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSort(sortBy, sortOrder);
  };

  const handleViewChange = (view: 'grid' | 'list') => {
    updateView(view);
  };

  // Memoized handlers to prevent unnecessary re-renders
  const handleFormDataChange = useCallback((newFormData: ListFormData) => {
    setFormData(newFormData);
  }, []);

  const handleCustomReminderDaysChange = useCallback((days: number | null) => {
    setCustomReminderDays(days);
  }, []);

  const handleCreateCancel = useCallback(() => {
    setShowCreateModal(false);
    resetForm();
  }, []);

  const handleEditCancel = useCallback(() => {
    setShowEditModal(false);
    resetForm();
  }, []);


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading lists..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Lists</h1>
            <p className="text-gray-600 mt-1">
              Organize your contacts into groups with custom reminder intervals
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New List
          </button>
        </div>

        {/* Control Bar */}
        {lists.length > 0 && (
          <ControlBar
            view={viewPreferences.view}
            onViewChange={handleViewChange}
            sortBy={viewPreferences.sortBy}
            sortOrder={viewPreferences.sortOrder}
            onSortChange={handleSortChange}
            sortOptions={listSortOptions}
            title="List Options"
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Lists Grid */}
        {lists.length === 0 ? (
          <EmptyState
            type="lists"
            title="No lists yet"
            description="Create your first list to organize your contacts with custom reminder intervals"
            actionLabel="Create Your First List"
            onAction={openCreateModal}
          />
        ) : (
          <ListsErrorBoundary onRetry={() => fetchLists()}>
            <div
              className={
                viewPreferences.view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {sortedLists.map((list) => (
                <ListCard
                  key={list._id}
                  list={list}
                  onEdit={handleEdit}
                  onDelete={handleDeleteList}
                  onViewContacts={handleViewContacts}
                  viewMode={viewPreferences.view}
                />
              ))}
            </div>
          </ListsErrorBoundary>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <FormErrorBoundary>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create New List</h2>
                <ListForm 
                  isEdit={false}
                  formData={formData}
                  setFormData={handleFormDataChange}
                  customReminderDays={customReminderDays}
                  setCustomReminderDays={handleCustomReminderDaysChange}
                  onSubmit={handleCreateList}
                  onCancel={handleCreateCancel}
                />
              </div>
            </div>
          </FormErrorBoundary>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <FormErrorBoundary>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Edit List</h2>
                <ListForm 
                  isEdit={true}
                  formData={formData}
                  setFormData={handleFormDataChange}
                  customReminderDays={customReminderDays}
                  setCustomReminderDays={handleCustomReminderDaysChange}
                  onSubmit={handleEditList}
                  onCancel={handleEditCancel}
                />
              </div>
            </div>
          </FormErrorBoundary>
        )}
      </div>
    </Layout>
  );
};
