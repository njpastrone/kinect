/**
 * Comprehensive error handling utilities
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Standard error types for the application
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Parse an error into a standardized format
 */
export const parseError = (error: any): ApiError => {
  // Handle axios/fetch response errors
  if (error.response) {
    const { data, status } = error.response;
    return {
      message: data?.message || data?.error || `HTTP ${status} Error`,
      status,
      code: data?.code,
      details: data?.details,
    };
  }

  // Handle network errors
  if (error.request || error.code === 'NETWORK_ERROR') {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: ErrorType.NETWORK,
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    return {
      message: error.message || 'Validation failed',
      code: ErrorType.VALIDATION,
      details: error.details || error.errors,
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: ErrorType.UNKNOWN,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorType.UNKNOWN,
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: ErrorType.UNKNOWN,
    details: error,
  };
};

/**
 * Get user-friendly error message
 */
export const getUserErrorMessage = (error: any): string => {
  const parsed = parseError(error);

  switch (parsed.code) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection.';

    case ErrorType.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';

    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.';

    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';

    case ErrorType.VALIDATION:
      return parsed.message || 'Please check your input and try again.';

    default:
      switch (parsed.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You do not have permission for this action.';
        case 404:
          return 'The requested resource was not found.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return parsed.message || 'An unexpected error occurred. Please try again.';
      }
  }
};

/**
 * Extract validation errors from API response
 */
export const extractValidationErrors = (error: any): ValidationError[] => {
  const parsed = parseError(error);

  if (parsed.code !== ErrorType.VALIDATION || !parsed.details) {
    return [];
  }

  // Handle different validation error formats
  if (Array.isArray(parsed.details)) {
    return parsed.details.map((err) => ({
      field: err.field || err.path || 'unknown',
      message: err.message || err.msg || 'Invalid value',
      code: err.code || 'VALIDATION_ERROR',
    }));
  }

  if (typeof parsed.details === 'object') {
    return Object.entries(parsed.details).map(([field, message]) => ({
      field,
      message: Array.isArray(message) ? message[0] : String(message),
      code: 'VALIDATION_ERROR',
    }));
  }

  return [];
};

/**
 * Log errors with context for debugging
 */
export const logError = (
  error: any,
  context: {
    action?: string;
    component?: string;
    userId?: string;
    additional?: Record<string, any>;
  } = {}
) => {
  const parsed = parseError(error);

  const errorData = {
    timestamp: new Date().toISOString(),
    error: parsed,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', errorData);
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorService(errorData);
  // }
};

/**
 * Retry utility for failed operations
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  backoffFactor: number = 2
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      // Don't retry on certain types of errors
      const parsed = parseError(error);
      if ([400, 401, 403, 404, 422].includes(parsed.status || 0)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const delay = delayMs * Math.pow(backoffFactor, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      logError(error, {
        action: 'retry_attempt',
        additional: { attempt, maxAttempts, delay },
      });
    }
  }

  throw lastError;
};

/**
 * Timeout wrapper for operations
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * Safe async operation wrapper
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ success: true; data: T } | { success: false; error: ApiError; data?: T }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const parsedError = parseError(error);
    logError(error, { action: 'safe_async_operation' });

    return {
      success: false,
      error: parsedError,
      data: fallback,
    };
  }
};
