import { create } from 'zustand';
import toast from 'react-hot-toast';
import { IContact, IContactList } from '@kinect/shared';
import api from '../services/api';
import { dedupedRequest } from '../utils/dedup';
import { extractErrorMessage } from './useErrorHandler';
import { withRetry, retryConfigs } from '../utils/retry';

interface ContactsState {
  contacts: IContact[];
  lists: IContactList[];
  selectedContact: IContact | null;
  selectedList: IContactList | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  fetchContacts: () => Promise<void>;
  fetchLists: () => Promise<void>;
  createContact: (data: Partial<IContact>) => Promise<IContact>;
  updateContact: (id: string, data: Partial<IContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  createList: (data: Partial<IContactList>) => Promise<IContactList>;
  updateList: (id: string, data: Partial<IContactList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  logInteraction: (contactId: string, type: string, notes?: string) => Promise<void>;
}

export const useContacts = create<ContactsState>((set) => ({
  contacts: [],
  lists: [],
  selectedContact: null,
  selectedList: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await withRetry(
        () => dedupedRequest('fetch-contacts', () => api.getContacts()),
        retryConfigs.fetch
      );
      set({ contacts: response.items, isLoading: false });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const lists = await withRetry(
        () => dedupedRequest('fetch-lists', () => api.getLists()),
        retryConfigs.fetch
      );
      set({ lists, isLoading: false });
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  createContact: async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticContact: IContact = {
      ...data,
      _id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastContactDate: new Date(),
      userId: 'temp-user', // Will be replaced with real data
    } as IContact;
    
    // Optimistically add contact
    set((state) => ({
      contacts: [...state.contacts, optimisticContact],
      isCreating: true,
      error: null,
    }));
    
    try {
      const newContact = await withRetry(
        () => dedupedRequest(`create-contact-${JSON.stringify(data)}`, () => api.createContact(data)),
        retryConfigs.mutation
      );
      
      // Replace optimistic contact with real one
      set((state) => ({
        contacts: state.contacts.map((c) =>
          c._id === tempId ? newContact : c
        ),
        isCreating: false,
      }));
      
      // If contact was assigned to a list, refresh lists to update counts
      if (data.listId) {
        const lists = await withRetry(
          () => api.getLists(),
          retryConfigs.fetch
        );
        set((state) => ({ ...state, lists }));
      }
      
      toast.success('Contact created successfully');
      return newContact;
    } catch (error: any) {
      // Rollback optimistic update
      set((state) => ({
        contacts: state.contacts.filter((c) => c._id !== tempId),
        error: extractErrorMessage(error),
        isCreating: false,
      }));
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  updateContact: async (id, data) => {
    // Store original contact for rollback
    let originalContact: IContact | undefined;
    
    // Optimistically update contact
    set((state) => {
      originalContact = state.contacts.find(c => c._id === id);
      return {
        contacts: state.contacts.map((c) =>
          c._id === id ? { ...c, ...data, updatedAt: new Date() } : c
        ),
        isUpdating: true,
        error: null,
      };
    });
    
    try {
      const updated = await withRetry(
        () => dedupedRequest(`update-contact-${id}`, () => api.updateContact(id, data)),
        retryConfigs.mutation
      );
      
      // Replace with server response
      set((state) => ({
        contacts: state.contacts.map((c) => (c._id === id ? updated : c)),
        isUpdating: false,
      }));

      // If listId was changed, refresh lists to update counts
      if (data.listId !== undefined) {
        const lists = await withRetry(
          () => api.getLists(),
          retryConfigs.fetch
        );
        set((state) => ({ ...state, lists }));
      }
      
      toast.success('Contact updated successfully');
    } catch (error: any) {
      // Rollback optimistic update
      if (originalContact) {
        set((state) => ({
          contacts: state.contacts.map((c) => (c._id === id ? originalContact! : c)),
          error: extractErrorMessage(error),
          isUpdating: false,
        }));
      }
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  deleteContact: async (id) => {
    // Store original contact for rollback
    let deletedContact: IContact | undefined;
    
    // Optimistically remove contact
    set((state) => {
      deletedContact = state.contacts.find(c => c._id === id);
      return {
        contacts: state.contacts.filter((c) => c._id !== id),
        isDeleting: true,
        error: null,
      };
    });
    
    try {
      await withRetry(
        () => dedupedRequest(`delete-contact-${id}`, () => api.deleteContact(id)),
        retryConfigs.mutation
      );
      
      set({ isDeleting: false });

      // Refresh lists to update counts after contact deletion
      const lists = await withRetry(
        () => api.getLists(),
        retryConfigs.fetch
      );
      set((state) => ({ ...state, lists }));
      
      toast.success('Contact deleted successfully');
    } catch (error: any) {
      // Rollback optimistic deletion
      if (deletedContact) {
        set((state) => ({
          contacts: [...state.contacts, deletedContact!],
          error: extractErrorMessage(error),
          isDeleting: false,
        }));
      }
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  createList: async (data) => {
    const tempId = `temp-list-${Date.now()}`;
    const optimisticList: IContactList = {
      ...data,
      _id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'temp-user', // Will be replaced with real data
      contactIds: [], // Default empty array
    } as IContactList;
    
    // Optimistically add list
    set((state) => ({
      lists: [...state.lists, optimisticList],
      isCreating: true,
      error: null,
    }));
    
    try {
      const newList = await withRetry(
        () => dedupedRequest(`create-list-${JSON.stringify(data)}`, () => api.createList(data)),
        retryConfigs.mutation
      );
      
      // Replace optimistic list with real one
      set((state) => ({
        lists: state.lists.map((l) =>
          l._id === tempId ? newList : l
        ),
        isCreating: false,
      }));
      
      toast.success('List created successfully');
      return newList;
    } catch (error: any) {
      // Rollback optimistic update
      set((state) => ({
        lists: state.lists.filter((l) => l._id !== tempId),
        error: extractErrorMessage(error),
        isCreating: false,
      }));
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  updateList: async (id, data) => {
    // Store original list for rollback
    let originalList: IContactList | undefined;
    
    // Optimistically update list
    set((state) => {
      originalList = state.lists.find(l => l._id === id);
      return {
        lists: state.lists.map((l) =>
          l._id === id ? { ...l, ...data, updatedAt: new Date() } : l
        ),
        isUpdating: true,
        error: null,
      };
    });
    
    try {
      const updated = await withRetry(
        () => dedupedRequest(`update-list-${id}`, () => api.updateList(id, data)),
        retryConfigs.mutation
      );
      
      // Replace with server response
      set((state) => ({
        lists: state.lists.map((l) => (l._id === id ? updated : l)),
        isUpdating: false,
      }));
      
      toast.success('List updated successfully');
    } catch (error: any) {
      // Rollback optimistic update
      if (originalList) {
        set((state) => ({
          lists: state.lists.map((l) => (l._id === id ? originalList! : l)),
          error: extractErrorMessage(error),
          isUpdating: false,
        }));
      }
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  deleteList: async (id) => {
    // Store original list for rollback
    let deletedList: IContactList | undefined;
    
    // Optimistically remove list
    set((state) => {
      deletedList = state.lists.find(l => l._id === id);
      return {
        lists: state.lists.filter((l) => l._id !== id),
        isDeleting: true,
        error: null,
      };
    });
    
    try {
      await withRetry(
        () => dedupedRequest(`delete-list-${id}`, () => api.deleteList(id)),
        retryConfigs.mutation
      );
      
      set({ isDeleting: false });
      toast.success('List deleted successfully');
    } catch (error: any) {
      // Rollback optimistic deletion
      if (deletedList) {
        set((state) => ({
          lists: [...state.lists, deletedList!],
          error: extractErrorMessage(error),
          isDeleting: false,
        }));
      }
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },

  logInteraction: async (contactId, type, notes) => {
    // Store original contact for rollback
    let originalContact: IContact | undefined;
    
    // Optimistically update contact with new interaction date
    set((state) => {
      originalContact = state.contacts.find(c => c._id === contactId);
      return {
        contacts: state.contacts.map((c) =>
          c._id === contactId ? { ...c, lastContactDate: new Date() } : c
        ),
        error: null,
      };
    });
    
    try {
      const result = await withRetry(
        () => dedupedRequest(`log-interaction-${contactId}-${type}`, () => api.logContactInteraction(contactId, type, notes)),
        retryConfigs.mutation
      );
      
      set((state) => ({
        contacts: state.contacts.map((c) => (c._id === contactId ? result.contact : c)),
      }));
      
      toast.success('Interaction logged successfully');
    } catch (error: any) {
      // Rollback optimistic update
      if (originalContact) {
        set((state) => ({
          contacts: state.contacts.map((c) => (c._id === contactId ? originalContact! : c)),
          error: extractErrorMessage(error),
        }));
      }
      
      toast.error(extractErrorMessage(error));
      throw error;
    }
  },
}));
