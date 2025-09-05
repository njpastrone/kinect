import React, { useState } from 'react';
import { useWelcomeDemo } from '../../features/demo/WelcomeDemoContext';

interface ContextualHelpProps {
  topic: string;
  children: React.ReactNode;
  helpText?: string;
  showOnHover?: boolean;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  topic,
  children,
  helpText,
  showOnHover = true,
  placement = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { startWelcomeDemo } = useWelcomeDemo();

  const helpContent = helpText || getHelpContent(topic);
  
  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => showOnHover && setIsVisible(true)}
      onMouseLeave={() => showOnHover && setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-50 ${placementClasses[placement]}`}>
          <div className="bg-gray-900 text-white text-sm rounded-lg p-3 max-w-xs shadow-lg">
            <div className="font-medium mb-1">{getTitleForTopic(topic)}</div>
            <div className="text-gray-200">{helpContent}</div>
            
            {shouldShowTourLink(topic) && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <button
                  onClick={startWelcomeDemo}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  Take the tour to learn more
                </button>
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className={`absolute ${getArrowPosition(placement)} w-0 h-0 border-4 border-transparent ${getArrowColor(placement)}`} />
        </div>
      )}
    </div>
  );
};

// Empty State Helper Component
interface EmptyStateHelpProps {
  type: 'contacts' | 'lists' | 'dashboard';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyStateHelp: React.FC<EmptyStateHelpProps> = ({
  type,
  title,
  description,
  actionText,
  onAction
}) => {
  const { startWelcomeDemo } = useWelcomeDemo();
  
  const getEmptyStateIcon = () => {
    switch (type) {
      case 'contacts':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'lists':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {getEmptyStateIcon()}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      
      <div className="space-y-3">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {actionText}
          </button>
        )}
        
        <div>
          <button
            onClick={startWelcomeDemo}
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Take the welcome tour to get started
          </button>
        </div>
      </div>
    </div>
  );
};

// Error State Helper Component
interface ErrorStateHelpProps {
  error: string;
  onRetry?: () => void;
  suggestions?: string[];
}

export const ErrorStateHelp: React.FC<ErrorStateHelpProps> = ({
  error,
  onRetry,
  suggestions = []
}) => {
  const { startWelcomeDemo } = useWelcomeDemo();
  
  const defaultSuggestions = [
    'Check your internet connection',
    'Refresh the page',
    'Clear your browser cache',
    'Try logging out and back in'
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-red-900">Something went wrong</h3>
      </div>
      
      <p className="text-red-700 mb-4">{error}</p>
      
      <div className="mb-4">
        <h4 className="font-medium text-red-900 mb-2">Try these solutions:</h4>
        <ul className="text-sm text-red-700 space-y-1">
          {allSuggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={startWelcomeDemo}
          className="text-red-600 hover:text-red-700 text-sm underline"
        >
          Get help with the tour
        </button>
      </div>
    </div>
  );
};

// Helper functions
function getHelpContent(topic: string): string {
  const helpTopics: Record<string, string> = {
    'add-contact': 'Add someone you want to stay in touch with. Set reminder intervals based on your relationship closeness.',
    'contact-lists': 'Organize your contacts into groups with different reminder schedules: Best Friends (30 days), Friends (90 days), etc.',
    'reminder-badges': 'Color-coded indicators show contact status: Red (overdue), Yellow (due soon), Green (recently contacted).',
    'mark-contacted': 'Update when you last spoke to someone to reset their reminder timer and track your communication.',
    'dashboard-stats': 'View your relationship activity overview, including overdue contacts and communication patterns.',
    'settings-nav': 'Customize your notification preferences, list reminder intervals, and onboarding settings.',
    'contact-actions': 'Edit contact details, update communication status, or remove contacts from your lists.',
    'list-management': 'Create custom lists for specific groups like family, work colleagues, or hobby friends.'
  };

  return helpTopics[topic] || 'Hover or click for more information about this feature.';
}

function getTitleForTopic(topic: string): string {
  const titles: Record<string, string> = {
    'add-contact': 'Add Contact',
    'contact-lists': 'Contact Lists',
    'reminder-badges': 'Status Indicators',
    'mark-contacted': 'Log Communication',
    'dashboard-stats': 'Dashboard Overview',
    'settings-nav': 'Settings',
    'contact-actions': 'Contact Actions',
    'list-management': 'List Management'
  };

  return titles[topic] || 'Help';
}

function shouldShowTourLink(topic: string): boolean {
  const tourTopics = ['add-contact', 'contact-lists', 'dashboard-stats'];
  return tourTopics.includes(topic);
}

function getArrowPosition(placement: string): string {
  switch (placement) {
    case 'top': return 'top-full left-1/2 transform -translate-x-1/2';
    case 'bottom': return 'bottom-full left-1/2 transform -translate-x-1/2';
    case 'left': return 'left-full top-1/2 transform -translate-y-1/2';
    case 'right': return 'right-full top-1/2 transform -translate-y-1/2';
    default: return '';
  }
}

function getArrowColor(placement: string): string {
  switch (placement) {
    case 'top': return 'border-t-gray-900';
    case 'bottom': return 'border-b-gray-900';
    case 'left': return 'border-l-gray-900';
    case 'right': return 'border-r-gray-900';
    default: return '';
  }
}