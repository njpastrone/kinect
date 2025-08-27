export const DEFAULT_LISTS = [
  { name: "Best Friends", reminderDays: 30, color: "#EF4444", description: "Your closest friends" },
  { name: "Friends", reminderDays: 90, color: "#3B82F6", description: "Regular friends" },
  { name: "Acquaintances", reminderDays: 180, color: "#6B7280", description: "People you know casually" },
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: '/contacts/:id',
    BY_LIST: '/contacts/list/:listId',
  },
  LISTS: {
    BASE: '/lists',
    BY_ID: '/lists/:id',
  },
  NOTIFICATIONS: {
    SETTINGS: '/notifications/settings',
    UPCOMING: '/notifications/upcoming',
  },
  COMMUNICATION: {
    LOGS: '/communication/logs',
    SYNC: '/communication/sync',
  },
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
} as const;
