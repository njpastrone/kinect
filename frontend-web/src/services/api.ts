import axios, { AxiosInstance } from 'axios';
import {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
  IContact,
  IContactList,
  IUser,
  ApiResponse,
  PaginatedResponse,
} from '@kinect/shared';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshToken();
          }

          try {
            await this.refreshPromise;
            this.refreshPromise = null;
            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshPromise = null;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/refresh', {
      refreshToken,
    });

    const { tokens } = response.data.data!;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return response.data;
  }

  async login(data: ILoginRequest): Promise<IAuthResponse> {
    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/login', data);
    const authData = response.data.data!;
    localStorage.setItem('accessToken', authData.tokens.accessToken);
    localStorage.setItem('refreshToken', authData.tokens.refreshToken);
    return authData;
  }

  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/register', data);
    const authData = response.data.data!;
    localStorage.setItem('accessToken', authData.tokens.accessToken);
    localStorage.setItem('refreshToken', authData.tokens.refreshToken);
    return authData;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.api.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      {
        email,
      }
    );
    return response.data.data || { message: response.data.message || 'Password reset email sent' };
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<IAuthResponse>> {
    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  }

  async getProfile(): Promise<IUser> {
    const response = await this.api.get<ApiResponse<{ user: IUser }>>('/auth/me');
    return response.data.data!.user;
  }

  async getContacts(params?: any): Promise<PaginatedResponse<IContact>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<IContact>>>('/contacts', {
      params,
    });
    return response.data.data!;
  }

  async getContact(id: string): Promise<IContact> {
    const response = await this.api.get<ApiResponse<IContact>>(`/contacts/${id}`);
    return response.data.data!;
  }

  async createContact(data: Partial<IContact>): Promise<IContact> {
    const response = await this.api.post<ApiResponse<IContact>>('/contacts', data);
    return response.data.data!;
  }

  async updateContact(id: string, data: Partial<IContact>): Promise<IContact> {
    const response = await this.api.put<ApiResponse<IContact>>(`/contacts/${id}`, data);
    return response.data.data!;
  }

  async deleteContact(id: string): Promise<void> {
    await this.api.delete(`/contacts/${id}`);
  }

  async logContactInteraction(id: string, type: string, notes?: string): Promise<any> {
    const response = await this.api.post(`/contacts/${id}/log-contact`, { type, notes });
    return response.data.data;
  }

  async logCommunication(data: {
    contactId: string;
    type: string;
    timestamp: Date;
    notes?: string;
    duration?: number;
  }): Promise<any> {
    const response = await this.api.post('/communications/log', {
      contactId: data.contactId,
      type: data.type,
      timestamp: data.timestamp.toISOString(),
      notes: data.notes,
      duration: data.duration,
    });
    return response.data.data;
  }

  async getLists(): Promise<IContactList[]> {
    const response = await this.api.get<ApiResponse<IContactList[]>>('/lists');
    return response.data.data!;
  }

  async getList(id: string): Promise<IContactList & { contacts: IContact[] }> {
    const response = await this.api.get<ApiResponse<IContactList & { contacts: IContact[] }>>(
      `/lists/${id}`
    );
    return response.data.data!;
  }

  async createList(data: Partial<IContactList>): Promise<IContactList> {
    const response = await this.api.post<ApiResponse<IContactList>>('/lists', data);
    return response.data.data!;
  }

  async updateList(id: string, data: Partial<IContactList>): Promise<IContactList> {
    const response = await this.api.put<ApiResponse<IContactList>>(`/lists/${id}`, data);
    return response.data.data!;
  }

  async deleteList(id: string): Promise<void> {
    await this.api.delete(`/lists/${id}`);
  }

  async addContactToList(listId: string, contactId: string): Promise<IContactList> {
    const response = await this.api.post<ApiResponse<IContactList>>(
      `/lists/${listId}/contacts/${contactId}`
    );
    return response.data.data!;
  }

  async removeContactFromList(listId: string, contactId: string): Promise<IContactList> {
    const response = await this.api.delete<ApiResponse<IContactList>>(
      `/lists/${listId}/contacts/${contactId}`
    );
    return response.data.data!;
  }

  async getUpcomingReminders(): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any[]>>('/notifications/upcoming');
    return response.data.data!;
  }

  async getNotificationSettings(): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>('/notifications/settings');
    return response.data.data!;
  }

  async getListContacts(listId: string, params?: any): Promise<PaginatedResponse<IContact>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<IContact>>>(
      `/lists/${listId}/contacts`,
      {
        params,
      }
    );
    return response.data.data!;
  }

  // Contact action methods
  async markContactAsContacted(contactId: string): Promise<IContact> {
    const response = await this.api.patch<ApiResponse<{ contact: IContact }>>(
      `/contacts/${contactId}/mark-contacted`
    );
    return response.data.data!.contact;
  }

  async scheduleContactReminder(
    contactId: string,
    reminderDate: string,
    notes?: string
  ): Promise<IContact> {
    const response = await this.api.post<ApiResponse<{ contact: IContact }>>(
      `/contacts/${contactId}/schedule-reminder`,
      {
        reminderDate,
        notes,
      }
    );
    return response.data.data!.contact;
  }

  async getOverdueContacts(
    params?: any
  ): Promise<
    PaginatedResponse<
      IContact & { list?: IContactList; daysSinceLastContact: number; reminderThreshold?: number }
    >
  > {
    const response = await this.api.get<
      ApiResponse<
        PaginatedResponse<
          IContact & {
            list?: IContactList;
            daysSinceLastContact: number;
            reminderThreshold?: number;
          }
        >
      >
    >('/contacts/overdue', {
      params,
    });
    return response.data.data!;
  }
}

export default new ApiService();
