import React from 'react';
import { Users, UserPlus, ListPlus, Search } from 'lucide-react';

interface EmptyStateProps {
  type: 'contacts' | 'lists' | 'overdue' | 'search' | 'filtered';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const getIcon = (type: EmptyStateProps['type']) => {
  switch (type) {
    case 'contacts':
      return <Users className="w-12 h-12 text-gray-300" />;
    case 'lists':
      return <ListPlus className="w-12 h-12 text-gray-300" />;
    case 'overdue':
      return <Users className="w-12 h-12 text-green-300" />;
    case 'search':
    case 'filtered':
      return <Search className="w-12 h-12 text-gray-300" />;
    default:
      return <Users className="w-12 h-12 text-gray-300" />;
  }
};

const getActionIcon = (type: EmptyStateProps['type']) => {
  switch (type) {
    case 'contacts':
      return <UserPlus className="w-5 h-5" />;
    case 'lists':
      return <ListPlus className="w-5 h-5" />;
    default:
      return null;
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const isPositive = type === 'overdue';
  
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className={`flex justify-center mb-4 ${isPositive ? 'text-green-400' : 'text-gray-300'}`}>
        {getIcon(type)}
      </div>
      
      <h3 className={`text-xl font-medium mb-2 ${
        isPositive ? 'text-green-700' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      
      <p className={`max-w-md mx-auto mb-6 ${
        isPositive ? 'text-green-600' : 'text-gray-600'
      }`}>
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
            isPositive
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {getActionIcon(type)}
          {actionLabel}
        </button>
      )}
    </div>
  );
};