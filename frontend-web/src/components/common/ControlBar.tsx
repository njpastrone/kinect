import React from 'react';
import { Grid3x3, List, SortAsc, SortDesc, Filter } from 'lucide-react';

interface ControlBarProps {
  // View controls
  view?: 'grid' | 'list';
  onViewChange?: (view: 'grid' | 'list') => void;

  // Grouping controls
  grouped?: boolean;
  onGroupChange?: (grouped: boolean) => void;
  showGroupBy?: boolean;

  // Sorting controls
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, order: 'asc' | 'desc') => void;
  sortOptions?: { value: string; label: string }[];

  // Optional title
  title?: string;
}

const DEFAULT_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'created', label: 'Date Added' },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  view = 'grid',
  onViewChange,
  grouped = false,
  onGroupChange,
  showGroupBy = false,
  sortBy = 'name',
  sortOrder = 'asc',
  onSortChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  title = 'View Options',
}) => {
  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange?.(sortBy, newOrder);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>

        <div className="flex flex-wrap items-center gap-4">
          {/* Group By Toggle */}
          {showGroupBy && onGroupChange && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={grouped}
                onChange={(e) => onGroupChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Group by List
              </span>
            </label>
          )}

          {/* Sort Options */}
          {onSortChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value, sortOrder)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSortOrderToggle}
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
                <span>{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
              </button>
            </div>
          )}

          {/* View Toggle */}
          {onViewChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-md">
                <button
                  onClick={() => onViewChange('grid')}
                  className={`px-3 py-1 text-sm rounded-l-md transition-colors ${
                    view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4 inline mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => onViewChange('list')}
                  className={`px-3 py-1 text-sm rounded-r-md transition-colors ${
                    view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
