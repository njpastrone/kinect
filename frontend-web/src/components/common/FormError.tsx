import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface FormErrorProps {
  error?: string | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * Consistent form error display component
 * Shows validation errors and API errors with proper styling and accessibility
 */
export const FormError: React.FC<FormErrorProps> = ({ 
  error, 
  className = '', 
  showIcon = true 
}) => {
  if (!error) return null;
  
  return (
    <div 
      className={`text-red-600 text-sm mt-1 flex items-start gap-1 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <ExclamationCircleIcon 
          className="w-4 h-4 mt-0.5 flex-shrink-0" 
          aria-hidden="true"
        />
      )}
      <span className="flex-1">{error}</span>
    </div>
  );
};

/**
 * Form field wrapper that includes label, input, and error display
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  hideLabel = false,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {!hideLabel && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      {children}
      <FormError error={error} />
    </div>
  );
};

/**
 * Summary error display for forms with multiple errors
 */
interface FormErrorSummaryProps {
  errors: (string | undefined | null)[];
  title?: string;
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = "Please fix the following errors:",
  className = ''
}) => {
  const validErrors = errors.filter(Boolean) as string[];
  
  if (validErrors.length === 0) return null;
  
  return (
    <div 
      className={`rounded-md bg-red-50 p-4 border border-red-200 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc space-y-1 pl-5">
              {validErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};