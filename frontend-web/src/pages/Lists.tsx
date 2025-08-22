import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IContactList } from '@kinect/shared';
import { ListCard } from '../components/lists/ListCard';
import { Layout } from '../components/layout/Layout';
import { ControlBar } from '../components/common/ControlBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { usePagePreferences } from '../hooks/usePreferences';
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
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create list');
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
      setShowEditModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update list');
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete list');
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

  const ListForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <form onSubmit={isEdit ? handleEditList : handleCreateList} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          List Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter list name"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="reminderDays" className="block text-sm font-medium text-gray-700 mb-1">
          Reminder Interval
        </label>
        <select
          id="reminderDays"
          value={customReminderDays ? 'custom' : formData.reminderDays}
          onChange={(e) => {
            if (e.target.value === 'custom') {
              setCustomReminderDays(formData.reminderDays);
            } else {
              setCustomReminderDays(null);
              setFormData({ ...formData, reminderDays: Number(e.target.value) });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REMINDER_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.value} days)
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      {customReminderDays !== null && (
        <div>
          <label htmlFor="customDays" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Days
          </label>
          <input
            type="number"
            id="customDays"
            value={customReminderDays}
            onChange={(e) => setCustomReminderDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="365"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <span className="text-sm text-gray-600">{formData.color}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
            } else {
              setShowCreateModal(false);
            }
            resetForm();
          }}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEdit ? 'Update List' : 'Create List'}
        </button>
      </div>
    </form>
  );

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
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New List</h2>
              <ListForm />
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit List</h2>
              <ListForm isEdit />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
