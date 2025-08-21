// Developer tools and utilities for testing and debugging
import React from 'react';

export interface DevToolsState {
  isEnabled: boolean;
  timeTravel: {
    enabled: boolean;
    currentDate: Date;
    originalDate: Date;
  };
  apiLogs: ApiLog[];
  debugInfo: {
    userState: any;
    cacheStatus: any;
    notificationQueue: any[];
  };
}

export interface ApiLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestData?: any;
  responseData?: any;
  error?: string;
}

class DevToolsManager {
  private state: DevToolsState = {
    isEnabled: false,
    timeTravel: {
      enabled: false,
      currentDate: new Date(),
      originalDate: new Date(),
    },
    apiLogs: [],
    debugInfo: {
      userState: null,
      cacheStatus: null,
      notificationQueue: [],
    },
  };

  private subscribers: ((state: DevToolsState) => void)[] = [];

  constructor() {
    // Enable dev tools in development environment
    this.state.isEnabled =
      process.env.NODE_ENV === 'development' || localStorage.getItem('kinect_dev_tools') === 'true';

    if (this.state.isEnabled) {
      this.setupInterceptors();
      this.setupGlobalDevTools();
    }
  }

  /**
   * Subscribe to dev tools state changes
   */
  subscribe(callback: (state: DevToolsState) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  /**
   * Enable or disable dev tools
   */
  setEnabled(enabled: boolean) {
    this.state.isEnabled = enabled;
    localStorage.setItem('kinect_dev_tools', enabled.toString());

    if (enabled) {
      this.setupInterceptors();
      this.setupGlobalDevTools();
    }

    this.notify();
  }

  /**
   * Time travel functionality
   */
  enableTimeTravel(enabled: boolean) {
    this.state.timeTravel.enabled = enabled;

    if (enabled) {
      this.state.timeTravel.originalDate = new Date();
    } else {
      this.state.timeTravel.currentDate = new Date();
    }

    this.notify();
  }

  setCurrentDate(date: Date) {
    this.state.timeTravel.currentDate = date;
    this.notify();
  }

  getCurrentDate(): Date {
    return this.state.timeTravel.enabled ? this.state.timeTravel.currentDate : new Date();
  }

  /**
   * API logging
   */
  logApiCall(log: Omit<ApiLog, 'id' | 'timestamp'>) {
    const apiLog: ApiLog = {
      ...log,
      id: Math.random().toString(36),
      timestamp: new Date(),
    };

    this.state.apiLogs.unshift(apiLog);

    // Keep only last 100 logs
    if (this.state.apiLogs.length > 100) {
      this.state.apiLogs = this.state.apiLogs.slice(0, 100);
    }

    this.notify();
  }

  clearApiLogs() {
    this.state.apiLogs = [];
    this.notify();
  }

  /**
   * Debug info updates
   */
  updateDebugInfo(info: Partial<DevToolsState['debugInfo']>) {
    this.state.debugInfo = { ...this.state.debugInfo, ...info };
    this.notify();
  }

  /**
   * Bulk data generation
   */
  async generateBulkContacts(count: number = 10): Promise<void> {
    const firstNames = [
      'John',
      'Jane',
      'Mike',
      'Sarah',
      'David',
      'Emma',
      'Chris',
      'Lisa',
      'Alex',
      'Maria',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Brown',
      'Davis',
      'Miller',
      'Wilson',
      'Moore',
      'Taylor',
      'Anderson',
      'Thomas',
    ];
    const categories = ['BEST_FRIEND', 'FRIEND', 'ACQUAINTANCE'];

    const contacts = [];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      contacts.push({
        firstName,
        lastName,
        phoneNumber: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        category,
        notes: `Bulk generated contact ${i + 1}`,
      });
    }

    console.warn('Generated bulk contacts:', contacts);

    // In a real implementation, this would call the API
    // for (const contact of contacts) {
    //   await api.contacts.create(contact);
    // }

    return Promise.resolve();
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData(): Promise<void> {
    if (window.confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
      localStorage.clear();

      // In a real implementation, this would call reset APIs
      console.warn('All data cleared');

      // Reload the page
      window.location.reload();
    }
  }

  /**
   * Force notification trigger
   */
  async triggerTestNotification(): Promise<void> {
    console.warn('Triggering test notification...');

    // In a real implementation, this would trigger actual notifications
    // await notificationService.sendTestNotification();
  }

  /**
   * Simulate phone sync
   */
  async simulatePhoneSync(): Promise<void> {
    console.warn('Simulating phone sync...');

    try {
      const response = await fetch('/api/dev/sync-phone-logs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.warn('Phone sync result:', result);

      // Update debug info
      this.updateDebugInfo({
        notificationQueue: [`Phone sync completed: ${result.data?.newLogs || 0} new logs`],
      });
    } catch (error) {
      console.error('Phone sync failed:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): DevToolsState {
    return { ...this.state };
  }

  /**
   * Setup API interceptors for logging
   */
  private setupInterceptors() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // Clone response to read body without consuming it
        const responseClone = response.clone();
        let responseData;

        try {
          responseData = await responseClone.json();
        } catch {
          responseData = null;
        }

        this.logApiCall({
          method: options.method || 'GET',
          url: url.toString(),
          status: response.status,
          duration,
          requestData: options.body ? JSON.parse(options.body as string) : null,
          responseData,
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.logApiCall({
          method: options.method || 'GET',
          url: url.toString(),
          status: 0,
          duration,
          requestData: options.body ? JSON.parse(options.body as string) : null,
          error: error instanceof Error ? error.message : 'Network error',
        });

        throw error;
      }
    };
  }

  /**
   * Setup global dev tools object
   */
  private setupGlobalDevTools() {
    (window as any).__KINECT_DEV_TOOLS__ = {
      // Time travel
      setDate: (date: Date) => this.setCurrentDate(date),
      enableTimeTravel: (enabled: boolean) => this.enableTimeTravel(enabled),

      // Data generation
      generateContacts: (count: number) => this.generateBulkContacts(count),
      clearData: () => this.clearAllData(),

      // Utilities
      triggerNotification: () => this.triggerTestNotification(),
      syncPhone: () => this.simulatePhoneSync(),

      // State access
      getState: () => this.getState(),
      getLogs: () => this.state.apiLogs,
      clearLogs: () => this.clearApiLogs(),

      // Quick actions
      jumpToTomorrow: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.setCurrentDate(tomorrow);
      },

      jumpToNextWeek: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        this.setCurrentDate(nextWeek);
      },

      jumpToNextMonth: () => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        this.setCurrentDate(nextMonth);
      },
    };

    console.warn('🛠️ Kinect Dev Tools loaded. Use __KINECT_DEV_TOOLS__ in console.');
  }
}

// Export singleton instance
export const devTools = new DevToolsManager();

// React hook for using dev tools
export function useDevTools() {
  const [state, setState] = React.useState(devTools.getState());

  React.useEffect(() => {
    return devTools.subscribe(setState);
  }, []);

  return {
    ...state,
    setEnabled: devTools.setEnabled.bind(devTools),
    enableTimeTravel: devTools.enableTimeTravel.bind(devTools),
    setCurrentDate: devTools.setCurrentDate.bind(devTools),
    getCurrentDate: devTools.getCurrentDate.bind(devTools),
    generateBulkContacts: devTools.generateBulkContacts.bind(devTools),
    clearAllData: devTools.clearAllData.bind(devTools),
    simulatePhoneSync: devTools.simulatePhoneSync.bind(devTools),
    clearApiLogs: devTools.clearApiLogs.bind(devTools),
  };
}

// Helper to format dates for display
export function formatDateForTimeTravel(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to calculate days between dates
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}
