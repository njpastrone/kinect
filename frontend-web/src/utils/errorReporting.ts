import toast from 'react-hot-toast';

/**
 * Development error reporting and debugging utilities
 */

interface ErrorDetails {
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: Date;
  userAgent: string;
  userId?: string;
}

class ErrorReporter {
  private errors: ErrorDetails[] = [];
  private maxErrors = 50;

  constructor() {
    if (import.meta.env?.DEV) {
      this.setupDevelopmentHandlers();
    }
  }

  private setupDevelopmentHandlers() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      const errorDetails: ErrorDetails = {
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      };
      
      this.logError(errorDetails);
      toast.error(`JavaScript Error: ${event.message}`);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorDetails: ErrorDetails = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      };
      
      this.logError(errorDetails);
      toast.error(`Promise Rejection: ${this.getErrorMessage(event.reason)}`);
    });

    // Add global error reporting method
    (window as any).__reportError = this.reportError.bind(this);
    
    console.log('🚨 Development error reporting enabled');
    console.log('Use __reportError(error, context) to manually report errors');
  }

  private logError(errorDetails: ErrorDetails) {
    console.group(`🚨 Error Report - ${errorDetails.timestamp.toISOString()}`);
    console.error('Message:', errorDetails.message);
    if (errorDetails.stack) {
      console.error('Stack:', errorDetails.stack);
    }
    if (errorDetails.url) {
      console.error('Location:', `${errorDetails.url}:${errorDetails.lineNumber}:${errorDetails.columnNumber}`);
    }
    console.error('User Agent:', errorDetails.userAgent);
    console.groupEnd();

    // Store error
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.toString) return error.toString();
    return 'Unknown error';
  }

  public reportError(error: any, context?: string) {
    const errorDetails: ErrorDetails = {
      message: `${context ? `${context}: ` : ''}${this.getErrorMessage(error)}`,
      stack: error?.stack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    };
    
    this.logError(errorDetails);
    
    if (import.meta.env?.DEV) {
      toast.error(errorDetails.message);
    }
  }

  public getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
    console.log('🧹 Error history cleared');
  }

  public exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Create global instance
export const errorReporter = new ErrorReporter();

/**
 * Development-only error debugging tools
 */
export const debugTools = {
  /**
   * Show all captured errors in console
   */
  showErrors: () => {
    console.group('📊 Error History');
    errorReporter.getErrors().forEach((error, index) => {
      console.group(`Error ${index + 1}: ${error.timestamp.toISOString()}`);
      console.log('Message:', error.message);
      if (error.stack) console.log('Stack:', error.stack);
      if (error.url) console.log('Location:', `${error.url}:${error.lineNumber}:${error.columnNumber}`);
      console.groupEnd();
    });
    console.groupEnd();
  },

  /**
   * Download error report as JSON file
   */
  downloadErrorReport: () => {
    const errorData = errorReporter.exportErrors();
    const blob = new Blob([errorData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('📁 Error report downloaded');
  },

  /**
   * Clear error history
   */
  clearErrors: () => {
    errorReporter.clearErrors();
  },

  /**
   * Trigger a test error for debugging
   */
  testError: (message = 'Test error') => {
    throw new Error(message);
  },
};

// Add debug tools to window in development
if (import.meta.env?.DEV) {
  (window as any).__debugErrors = debugTools;
  console.log('🛠️ Error debugging tools available at window.__debugErrors');
}

/**
 * Utility to report errors with context
 */
export const reportError = (error: any, context?: string) => {
  errorReporter.reportError(error, context);
};