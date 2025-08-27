import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Error boundary fallback components for different features
 */

interface ErrorFallbackProps {
  title: string;
  description: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  title, 
  description, 
  onRetry, 
  retryText = 'Try Again' 
}) => (
  <div className="text-center p-8">
    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {retryText}
      </button>
    )}
  </div>
);

/**
 * Contacts feature error boundary
 */
export const ContactsErrorBoundary: React.FC<{ children: React.ReactNode; onRetry?: () => void }> = ({ 
  children, 
  onRetry 
}) => (
  <ErrorBoundary
    enableRetry
    fallback={
      <ErrorFallback
        title="Contacts Loading Error"
        description="There was a problem loading your contacts. This might be due to a network issue or temporary server problem."
        onRetry={onRetry}
        retryText="Reload Contacts"
      />
    }
  >
    {children}
  </ErrorBoundary>
);

/**
 * Lists feature error boundary
 */
export const ListsErrorBoundary: React.FC<{ children: React.ReactNode; onRetry?: () => void }> = ({ 
  children, 
  onRetry 
}) => (
  <ErrorBoundary
    enableRetry
    fallback={
      <ErrorFallback
        title="Lists Loading Error"
        description="There was a problem loading your contact lists. Please check your connection and try again."
        onRetry={onRetry}
        retryText="Reload Lists"
      />
    }
  >
    {children}
  </ErrorBoundary>
);

/**
 * Dashboard feature error boundary
 */
export const DashboardErrorBoundary: React.FC<{ children: React.ReactNode; onRetry?: () => void }> = ({ 
  children, 
  onRetry 
}) => (
  <ErrorBoundary
    enableRetry
    fallback={
      <ErrorFallback
        title="Dashboard Loading Error"
        description="Unable to load your dashboard data. This could be due to connectivity issues or server maintenance."
        onRetry={onRetry}
        retryText="Reload Dashboard"
      />
    }
  >
    {children}
  </ErrorBoundary>
);

/**
 * Form error boundary for modals and forms
 */
export const FormErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    enableRetry
    retryText="Reset Form"
    fallback={
      <ErrorFallback
        title="Form Error"
        description="There was an error with this form. Please try again or refresh the page."
      />
    }
  >
    {children}
  </ErrorBoundary>
);