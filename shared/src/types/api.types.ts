export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NotificationSettings {
  _id?: string;
  userId: string;
  bestFriendDays: number;
  friendDays: number;
  acquaintanceDays: number;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt?: Date;
  updatedAt?: Date;
}