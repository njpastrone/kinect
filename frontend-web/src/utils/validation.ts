/**
 * Comprehensive validation utilities for form inputs and data
 */
import React from 'react';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  [field: string]: {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null && value !== undefined;
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: string): boolean => {
    // Accepts various phone formats
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    const cleaned = value.replace(/[\s\-().]/g, '');
    return phoneRegex.test(cleaned);
  },

  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },

  minValue: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  maxValue: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  pattern: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  date: (value: string): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  futureDate: (value: string): boolean => {
    const date = new Date(value);
    return date.getTime() > Date.now();
  },

  pastDate: (value: string): boolean => {
    const date = new Date(value);
    return date.getTime() < Date.now();
  },

  alpha: (value: string): boolean => {
    return /^[A-Za-z]+$/.test(value);
  },

  alphaNumeric: (value: string): boolean => {
    return /^[A-Za-z0-9]+$/.test(value);
  },

  numeric: (value: string): boolean => {
    return /^[0-9]+$/.test(value);
  },
};

/**
 * Validation messages
 */
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  minValue: (min: number) => `Must be at least ${min}`,
  maxValue: (max: number) => `Must not exceed ${max}`,
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past',
  alpha: 'Only letters are allowed',
  alphaNumeric: 'Only letters and numbers are allowed',
  numeric: 'Only numbers are allowed',
};

/**
 * Contact validation schemas
 */
export const ContactValidation = {
  firstName: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minLength(1), message: ValidationMessages.minLength(1) },
    { rule: ValidationRules.maxLength(50), message: ValidationMessages.maxLength(50) },
  ],

  lastName: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minLength(1), message: ValidationMessages.minLength(1) },
    { rule: ValidationRules.maxLength(50), message: ValidationMessages.maxLength(50) },
  ],

  email: [
    { rule: ValidationRules.email, message: ValidationMessages.email },
    { rule: ValidationRules.maxLength(255), message: ValidationMessages.maxLength(255) },
  ],

  phoneNumber: [
    { rule: ValidationRules.phone, message: ValidationMessages.phone },
  ],

  birthday: [
    { rule: ValidationRules.date, message: ValidationMessages.date },
    { rule: ValidationRules.pastDate, message: ValidationMessages.pastDate },
  ],

  customReminderDays: [
    { rule: ValidationRules.minValue(1), message: ValidationMessages.minValue(1) },
    { rule: ValidationRules.maxValue(365), message: ValidationMessages.maxValue(365) },
  ],
};

/**
 * List validation schemas
 */
export const ListValidation = {
  name: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minLength(1), message: ValidationMessages.minLength(1) },
    { rule: ValidationRules.maxLength(100), message: ValidationMessages.maxLength(100) },
  ],

  description: [
    { rule: ValidationRules.maxLength(500), message: ValidationMessages.maxLength(500) },
  ],

  reminderDays: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minValue(1), message: ValidationMessages.minValue(1) },
    { rule: ValidationRules.maxValue(365), message: ValidationMessages.maxValue(365) },
  ],
};

/**
 * Authentication validation schemas
 */
export const AuthValidation = {
  email: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.email, message: ValidationMessages.email },
  ],

  password: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minLength(8), message: ValidationMessages.minLength(8) },
    { rule: ValidationRules.maxLength(128), message: ValidationMessages.maxLength(128) },
  ],

  name: [
    { rule: ValidationRules.required, message: ValidationMessages.required },
    { rule: ValidationRules.minLength(2), message: ValidationMessages.minLength(2) },
    { rule: ValidationRules.maxLength(100), message: ValidationMessages.maxLength(100) },
  ],
};

/**
 * Generic field validator
 */
export const validateField = (
  value: any,
  rules: Array<{ rule: (value: any) => boolean; message: string }>
): ValidationResult => {
  const errors: string[] = [];

  for (const { rule, message } of rules) {
    if (!rule(value)) {
      errors.push(message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate multiple fields at once
 */
export const validateFields = (
  data: Record<string, any>,
  schema: Record<string, Array<{ rule: (value: any) => boolean; message: string }>>
): FieldValidationResult => {
  const results: FieldValidationResult = {};

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    results[field] = validateField(value, rules);
  });

  return results;
};

/**
 * Check if form is valid based on field validation results
 */
export const isFormValid = (results: FieldValidationResult): boolean => {
  return Object.values(results).every(result => result.isValid);
};

/**
 * Get first error for each field
 */
export const getFieldErrors = (results: FieldValidationResult): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(results).forEach(([field, result]) => {
    if (!result.isValid && result.errors.length > 0) {
      errors[field] = result.errors[0];
    }
  });

  return errors;
};

/**
 * Get all errors for a specific field
 */
export const getFieldAllErrors = (results: FieldValidationResult, field: string): string[] => {
  return results[field]?.errors || [];
};

/**
 * Sanitize input values
 */
export const sanitizeInput = {
  string: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },

  email: (value: string): string => {
    return value.trim().toLowerCase();
  },

  phone: (value: string): string => {
    // Remove common formatting characters but keep + for international numbers
    return value.replace(/[\s\-().]/g, '');
  },

  name: (value: string): string => {
    // Capitalize first letter of each word
    return value
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  },

  number: (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  },
};

/**
 * Real-time validation hook for forms
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialData: T,
  schema: Record<keyof T, Array<{ rule: (value: any) => boolean; message: string }>>
): {
  data: T;
  errors: FieldValidationResult;
  touched: Record<keyof T, boolean>;
  updateField: (field: keyof T, value: any) => void;
  validateAllFields: () => boolean;
  validateField: (field: keyof T) => boolean;
  resetForm: () => void;
  isValid: boolean;
  fieldErrors: Record<string, string>;
} => {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<FieldValidationResult>({});
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateAllFields = React.useCallback((): boolean => {
    const results = validateFields(data, schema);
    setErrors(results);
    return isFormValid(results);
  }, [data, schema]);

  const validateSingleField = React.useCallback((field: keyof T): boolean => {
    if (schema[field]) {
      const fieldRules = schema[field];
      const result = validateField(data[field], fieldRules);
      setErrors(prev => ({ ...prev, [field]: result }));
      return result.isValid;
    }
    return true;
  }, [data, schema]);

  const updateField = React.useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field if it has been touched
    if (touched[field] || value !== initialData[field]) {
      setTimeout(() => validateSingleField(field), 0);
    }
  }, [touched, initialData, validateSingleField]);

  const resetForm = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  }, [initialData]);

  React.useEffect(() => {
    // Validate all fields when data changes (debounced)
    const timeoutId = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        validateAllFields();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [data, touched, validateAllFields]);

  return {
    data,
    errors,
    touched,
    updateField,
    validateAllFields,
    validateField: validateSingleField,
    resetForm,
    isValid: isFormValid(errors),
    fieldErrors: getFieldErrors(errors),
  };
};