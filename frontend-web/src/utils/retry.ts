import toast from 'react-hot-toast';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any, attempt: number) => {
    // Don't retry on 4xx errors (except 408, 429)
    const status = error?.response?.status;
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
    
    // Don't retry validation errors
    if (error?.response?.data?.error?.includes?.('validation')) {
      return false;
    }
    
    return attempt <= 3;
  },
  onRetry: (error: any, attempt: number) => {
    console.warn(`Retrying operation (attempt ${attempt}):`, error.message);
    toast.error(`Request failed. Retrying... (${attempt}/3)`);
  }
};

/**
 * Retry a failed async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error;
      }
      
      opts.onRetry(error, attempt);
      
      // Exponential backoff with jitter
      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt - 1),
        opts.maxDelay
      );
      const jitteredDelay = delay + Math.random() * delay * 0.1;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
}

/**
 * Create a retryable version of an async function
 */
export function createRetryableFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * Specific retry configurations for different operation types
 */
export const retryConfigs = {
  // For critical operations that should be retried aggressively
  critical: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 5000,
    onRetry: (error: any, attempt: number) => {
      console.warn(`Critical operation retry (${attempt}/5):`, error.message);
      if (attempt === 1) {
        toast.error('Request failed. Retrying automatically...');
      }
    }
  },
  
  // For data fetching operations
  fetch: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    onRetry: (error: any, attempt: number) => {
      console.warn(`Fetch retry (${attempt}/3):`, error.message);
    }
  },
  
  // For mutation operations (create, update, delete)
  mutation: {
    maxAttempts: 2,
    baseDelay: 1500,
    maxDelay: 3000,
    shouldRetry: (error: any, attempt: number) => {
      const status = error?.response?.status;
      // Only retry on network errors or 5xx errors
      return (!status || status >= 500) && attempt <= 2;
    },
    onRetry: (error: any, attempt: number) => {
      console.warn(`Mutation retry (${attempt}/2):`, error.message);
      toast.error('Operation failed. Trying again...');
    }
  }
};

/**
 * Circuit breaker pattern for preventing cascading failures
 */
class CircuitBreaker {
  private failures = 0;
  private nextAttempt = Date.now();
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }
}

export const circuitBreaker = new CircuitBreaker();