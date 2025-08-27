/**
 * Request deduplication utility to prevent duplicate API calls
 * Maintains a map of pending requests and returns the same promise for identical requests
 */

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicates requests by key to prevent multiple concurrent API calls
 * @param key - Unique identifier for the request
 * @param fetcher - Function that returns a Promise for the actual request
 * @returns Promise that resolves to the request result
 */
export const dedupedRequest = async <T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  const promise = fetcher();
  pendingRequests.set(key, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

/**
 * Clears all pending requests (useful for cleanup or testing)
 */
export const clearPendingRequests = (): void => {
  pendingRequests.clear();
};

/**
 * Gets the count of current pending requests (useful for debugging)
 */
export const getPendingRequestsCount = (): number => {
  return pendingRequests.size;
};

/**
 * Creates a debounced version of the deduped request that waits for a specified delay
 * @param key - Unique identifier for the request
 * @param fetcher - Function that returns a Promise for the actual request  
 * @param delay - Delay in milliseconds before executing the request
 * @returns Promise that resolves to the request result
 */
export const debouncedDedupedRequest = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  delay: number = 300
): Promise<T> => {
  return dedupedRequest(`debounced_${key}`, () => {
    return new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await fetcher();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  });
};