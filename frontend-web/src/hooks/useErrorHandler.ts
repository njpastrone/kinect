import toast from 'react-hot-toast';

/**
 * Custom hook for consistent error handling throughout the application
 * Displays user-friendly error messages via toast notifications and logs detailed errors
 */
export const useErrorHandler = () => {
  return (error: any, userMessage?: string) => {
    const message = userMessage || 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred';
    
    toast.error(message);
    console.error('Error details:', error);
    
    return message;
  };
};

/**
 * Utility function to extract error messages from various error types
 * @param error - Error object from API, network, or other sources
 * @returns User-friendly error message string
 */
export const extractErrorMessage = (error: any): string => {
  return error.response?.data?.error || 
    error.message || 
    'An unexpected error occurred';
};