import { create } from 'zustand';
import { IUser, ILoginRequest, IRegisterRequest } from '@kinect/shared';
import api from '../services/api';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: ILoginRequest) => Promise<void>;
  register: (data: IRegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(data);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      set({ isAuthenticated: true, isLoading: false });
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));
