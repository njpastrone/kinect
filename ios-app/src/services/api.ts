import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
  IContact,
  IContactList,
  ApiResponse,
  PaginatedResponse,
} from '@kinect/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api' 
    : '/api');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('accessToken');
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

          try {
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/refresh', {
      refreshToken,
    });

    const { tokens } = response.data.data!;
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    return response.data;
  }

  async login(data: ILoginRequest): Promise<IAuthResponse> {
    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/login', data);
    const authData = response.data.data!;
    await AsyncStorage.setItem('accessToken', authData.tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', authData.tokens.refreshToken);
    return authData;
  }

  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    const response = await this.api.post<ApiResponse<IAuthResponse>>('/auth/register', data);
    const authData = response.data.data!;
    await AsyncStorage.setItem('accessToken', authData.tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', authData.tokens.refreshToken);
    return authData;
  }

  async logout() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }

  async getContacts(params?: any): Promise<PaginatedResponse<IContact>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<IContact>>>('/contacts', {
      params,
    });
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

  async getLists(): Promise<IContactList[]> {
    const response = await this.api.get<ApiResponse<IContactList[]>>('/lists');
    return response.data.data!;
  }
}

export default new ApiService();
