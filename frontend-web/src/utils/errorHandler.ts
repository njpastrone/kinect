import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    // Check for API response errors
    if (error.response?.data) {
      const data = error.response.data;
      
      // Check common error message locations
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map((e: any) => e.message || e).join(', ');
      }
    }
    
    // Check for network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }
    
    // Check for timeout
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    
    // Default Axios error message
    return error.message || 'Request failed';
  }
  
  // Handle regular Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default message
  return 'An unexpected error occurred';
}

/**
 * Logs error details for debugging
 */
export function logError(context: string, error: unknown): void {
  console.group(`🔴 Error in ${context}`);
  
  if (error instanceof AxiosError) {
    console.error('Type: AxiosError');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Config:', error.config);
  } else if (error instanceof Error) {
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } else {
    console.error('Unknown error type:', error);
  }
  
  console.groupEnd();
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown): ApiError {
  const message = extractErrorMessage(error);
  
  if (error instanceof AxiosError && error.response?.data) {
    return {
      message,
      field: error.response.data.field,
      code: error.response.data.code || error.code
    };
  }
  
  return { message };
}