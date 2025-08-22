import { useState, useEffect, useCallback } from 'react';

export interface PagePreferences {
  // View preferences
  view: 'grid' | 'list';
  groupByList: boolean;

  // Sort preferences
  sortBy: string;
  sortOrder: 'asc' | 'desc';

  // Filter preferences
  selectedFilters: string[];

  // Page-specific preferences
  showCompleted?: boolean;
  compactMode?: boolean;
}

export interface GlobalPreferences {
  contacts: PagePreferences;
  lists: PagePreferences;
  dashboard: PagePreferences;
}

const DEFAULT_PREFERENCES: PagePreferences = {
  view: 'grid',
  groupByList: false,
  sortBy: 'name',
  sortOrder: 'asc',
  selectedFilters: [],
  showCompleted: false,
  compactMode: false,
};

const PAGE_SPECIFIC_DEFAULTS: Partial<GlobalPreferences> = {
  contacts: {
    ...DEFAULT_PREFERENCES,
    sortBy: 'name',
  },
  lists: {
    ...DEFAULT_PREFERENCES,
    sortBy: 'name',
  },
  dashboard: {
    ...DEFAULT_PREFERENCES,
    sortBy: 'updated',
    groupByList: false,
  },
};

/**
 * Hook for managing page-specific preferences with persistence
 */
export const usePagePreferences = (
  page: keyof GlobalPreferences,
  overrides: Partial<PagePreferences> = {}
) => {
  const storageKey = `preferences_${page}`;

  const getInitialPreferences = useCallback((): PagePreferences => {
    const stored = localStorage.getItem(storageKey);
    const pageDefaults = { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS[page], ...overrides };

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...pageDefaults, ...parsed };
      } catch {
        return pageDefaults;
      }
    }

    return pageDefaults;
  }, [page, storageKey, overrides]);

  const [preferences, setPreferences] = useState<PagePreferences>(getInitialPreferences);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [preferences, storageKey]);

  const updatePreferences = useCallback((updates: Partial<PagePreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetPreferences = useCallback(() => {
    const defaults = { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS[page], ...overrides };
    setPreferences(defaults);
    localStorage.removeItem(storageKey);
  }, [page, storageKey, overrides]);

  // Specific update functions for common operations
  const updateView = useCallback(
    (view: 'grid' | 'list') => {
      updatePreferences({ view });
    },
    [updatePreferences]
  );

  const updateSort = useCallback(
    (sortBy: string, sortOrder?: 'asc' | 'desc') => {
      updatePreferences({
        sortBy,
        sortOrder: sortOrder || preferences.sortOrder,
      });
    },
    [updatePreferences, preferences.sortOrder]
  );

  const toggleSortOrder = useCallback(() => {
    updatePreferences({
      sortOrder: preferences.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  }, [updatePreferences, preferences.sortOrder]);

  const updateGrouping = useCallback(
    (groupByList: boolean) => {
      updatePreferences({ groupByList });
    },
    [updatePreferences]
  );

  const addFilter = useCallback(
    (filter: string) => {
      if (!preferences.selectedFilters.includes(filter)) {
        updatePreferences({
          selectedFilters: [...preferences.selectedFilters, filter],
        });
      }
    },
    [updatePreferences, preferences.selectedFilters]
  );

  const removeFilter = useCallback(
    (filter: string) => {
      updatePreferences({
        selectedFilters: preferences.selectedFilters.filter((f) => f !== filter),
      });
    },
    [updatePreferences, preferences.selectedFilters]
  );

  const clearFilters = useCallback(() => {
    updatePreferences({ selectedFilters: [] });
  }, [updatePreferences]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,

    // Convenience methods
    updateView,
    updateSort,
    toggleSortOrder,
    updateGrouping,
    addFilter,
    removeFilter,
    clearFilters,
  };
};

/**
 * Hook for managing global preferences across all pages
 */
export const useGlobalPreferences = () => {
  const [preferences, setPreferences] = useState<GlobalPreferences>(() => {
    const stored = localStorage.getItem('global_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          contacts: {
            ...DEFAULT_PREFERENCES,
            ...PAGE_SPECIFIC_DEFAULTS.contacts,
            ...parsed.contacts,
          },
          lists: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.lists, ...parsed.lists },
          dashboard: {
            ...DEFAULT_PREFERENCES,
            ...PAGE_SPECIFIC_DEFAULTS.dashboard,
            ...parsed.dashboard,
          },
        };
      } catch {
        // Fall through to defaults
      }
    }

    return {
      contacts: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.contacts },
      lists: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.lists },
      dashboard: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.dashboard },
    };
  });

  useEffect(() => {
    localStorage.setItem('global_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePagePreferences = useCallback(
    (page: keyof GlobalPreferences, updates: Partial<PagePreferences>) => {
      setPreferences((prev) => ({
        ...prev,
        [page]: { ...prev[page], ...updates },
      }));
    },
    []
  );

  const resetAllPreferences = useCallback(() => {
    const defaults = {
      contacts: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.contacts },
      lists: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.lists },
      dashboard: { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS.dashboard },
    };
    setPreferences(defaults);
    localStorage.removeItem('global_preferences');
  }, []);

  return {
    preferences,
    updatePagePreferences,
    resetAllPreferences,
  };
};

/**
 * Get preferences for a specific page without the hook
 */
export const getPagePreferences = (page: keyof GlobalPreferences): PagePreferences => {
  const storageKey = `preferences_${page}`;
  const stored = localStorage.getItem(storageKey);
  const pageDefaults = { ...DEFAULT_PREFERENCES, ...PAGE_SPECIFIC_DEFAULTS[page] };

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...pageDefaults, ...parsed };
    } catch {
      return pageDefaults;
    }
  }

  return pageDefaults;
};

/**
 * Save preferences for a specific page
 */
export const savePagePreferences = (
  page: keyof GlobalPreferences,
  preferences: PagePreferences
) => {
  const storageKey = `preferences_${page}`;
  localStorage.setItem(storageKey, JSON.stringify(preferences));
};
