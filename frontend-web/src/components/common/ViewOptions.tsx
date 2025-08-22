import React from 'react';

export interface ViewPreferences {
  view: 'grid' | 'list';
  sortBy: 'name' | 'count' | 'updated' | 'overdue' | 'list';
  sortOrder: 'asc' | 'desc';
  groupByList: boolean;
}

interface ViewOptionsProps {
  preferences: ViewPreferences;
  onChange: (preferences: ViewPreferences) => void;
  showGroupToggle?: boolean;
  showViewToggle?: boolean;
}

export const ViewOptions: React.FC<ViewOptionsProps> = ({
  preferences,
  onChange,
  showGroupToggle = true,
  showViewToggle = true,
}) => {
  const handleChange = (updates: Partial<ViewPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    onChange(newPreferences);

    // Save to localStorage
    localStorage.setItem('viewPreferences', JSON.stringify(newPreferences));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">View Options</h3>

      <div className="flex flex-wrap gap-4">
        {/* Group by List Toggle */}
        {showGroupToggle && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.groupByList}
              onChange={(e) => handleChange({ groupByList: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Group by List</span>
          </label>
        )}

        {/* View Toggle */}
        {showViewToggle && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-md">
              <button
                onClick={() => handleChange({ view: 'grid' })}
                className={`px-3 py-1 text-sm rounded-l-md transition-colors ${
                  preferences.view === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  className="w-4 h-4 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Grid
              </button>
              <button
                onClick={() => handleChange({ view: 'list' })}
                className={`px-3 py-1 text-sm rounded-r-md transition-colors ${
                  preferences.view === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg
                  className="w-4 h-4 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                List
              </button>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={preferences.sortBy}
            onChange={(e) => handleChange({ sortBy: e.target.value as ViewPreferences['sortBy'] })}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name</option>
            <option value="count">Contact Count</option>
            <option value="updated">Last Updated</option>
            <option value="overdue">Overdue Count</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              handleChange({
                sortOrder: preferences.sortOrder === 'asc' ? 'desc' : 'asc',
              })
            }
            className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
          >
            {preferences.sortOrder === 'asc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7l4-4m0 0l4 4m-4-4v18"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 17l-4 4m0 0l-4-4m4 4V3"
                />
              </svg>
            )}
            <span>{preferences.sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing view preferences
export const useViewPreferences = (defaultPreferences?: Partial<ViewPreferences>) => {
  const getInitialPreferences = (): ViewPreferences => {
    const stored = localStorage.getItem('viewPreferences');
    const defaults: ViewPreferences = {
      view: 'grid',
      sortBy: 'name',
      sortOrder: 'asc',
      groupByList: false,
      ...defaultPreferences,
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch {
        return defaults;
      }
    }

    return defaults;
  };

  const [preferences, setPreferences] = React.useState<ViewPreferences>(getInitialPreferences);

  const updatePreferences = (newPreferences: ViewPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('viewPreferences', JSON.stringify(newPreferences));
  };

  return {
    preferences,
    updatePreferences,
  };
};
