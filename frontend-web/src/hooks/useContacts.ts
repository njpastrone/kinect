import { create } from 'zustand';
import { IContact, IContactList } from '@kinect/shared';
import api from '../services/api';

interface ContactsState {
  contacts: IContact[];
  lists: IContactList[];
  selectedContact: IContact | null;
  selectedList: IContactList | null;
  isLoading: boolean;
  error: string | null;
  
  fetchContacts: () => Promise<void>;
  fetchLists: () => Promise<void>;
  createContact: (data: Partial<IContact>) => Promise<void>;
  updateContact: (id: string, data: Partial<IContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  createList: (data: Partial<IContactList>) => Promise<void>;
  updateList: (id: string, data: Partial<IContactList>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  logInteraction: (contactId: string, type: string, notes?: string) => Promise<void>;
}

export const useContacts = create<ContactsState>((set, get) => ({
  contacts: [],
  lists: [],
  selectedContact: null,
  selectedList: null,
  isLoading: false,
  error: null,

  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getContacts();
      set({ contacts: response.items, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const lists = await api.getLists();
      set({ lists, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createContact: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const contact = await api.createContact(data);
      set((state) => ({ 
        contacts: [...state.contacts, contact], 
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateContact: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.updateContact(id, data);
      set((state) => ({
        contacts: state.contacts.map(c => c._id === id ? updated : c),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteContact: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteContact(id);
      set((state) => ({
        contacts: state.contacts.filter(c => c._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createList: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const list = await api.createList(data);
      set((state) => ({ 
        lists: [...state.lists, list], 
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateList: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.updateList(id, data);
      set((state) => ({
        lists: state.lists.map(l => l._id === id ? updated : l),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteList: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteList(id);
      set((state) => ({
        lists: state.lists.filter(l => l._id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logInteraction: async (contactId, type, notes) => {
    try {
      const result = await api.logContactInteraction(contactId, type, notes);
      set((state) => ({
        contacts: state.contacts.map(c => 
          c._id === contactId ? result.contact : c
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  }
}));