import React, { useState, useEffect } from 'react';
import { useWelcomeDemo } from '../../features/demo/WelcomeDemoContext';
import { useDemoMode } from '../../features/demo/DemoMode';

interface HelpMenuProps {
  className?: string;
}

interface HelpMenuItems {
  takeTour: () => void;
  featureTips: () => void;
  shortcuts: () => void;
  documentation: () => void;
  resetOnboarding: () => void;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { startWelcomeDemo, resetOnboarding } = useWelcomeDemo();
  const { showNotification } = useDemoMode();

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // F1, ?, Ctrl+? to open help
      if (
        e.key === 'F1' || 
        e.key === '?' || 
        (e.ctrlKey && e.key === '?')
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close help
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const helpMenuItems: HelpMenuItems = {
    takeTour: () => {
      setIsOpen(false);
      startWelcomeDemo();
      showNotification({
        title: 'Welcome Tour Started',
        message: 'Follow the guided tour to learn about Kinect features.',
        type: 'info',
      });
    },

    featureTips: () => {
      setIsOpen(false);
      showNotification({
        title: 'Feature Tips',
        message: 'Hover over UI elements to see helpful tooltips and guidance.',
        type: 'info',
      });
      // Enable feature tips mode
      document.body.classList.add('feature-tips-mode');
      setTimeout(() => {
        document.body.classList.remove('feature-tips-mode');
      }, 10000);
    },

    shortcuts: () => {
      setShowShortcuts(!showShortcuts);
    },

    documentation: () => {
      window.open('/docs', '_blank');
    },

    resetOnboarding: async () => {
      if (window.confirm('Are you sure you want to reset your onboarding progress? This will restart the welcome tour.')) {
        try {
          await resetOnboarding();
          setIsOpen(false);
          showNotification({
            title: 'Onboarding Reset',
            message: 'Your onboarding progress has been reset. The welcome tour will start on your next visit.',
            type: 'success',
          });
        } catch {
          showNotification({
            title: 'Reset Failed',
            message: 'Failed to reset onboarding. Please try again.',
            type: 'error',
          });
        }
      }
    },
  };

  const shortcuts = [
    { key: 'F1 or ?', action: 'Open Help Menu' },
    { key: 'Escape', action: 'Close Help/Cancel Action' },
    { key: 'Ctrl + N', action: 'Add New Contact' },
    { key: 'Ctrl + L', action: 'Create New List' },
    { key: '← →', action: 'Navigate Tour Steps' },
    { key: 'Space/Enter', action: 'Next Tour Step' },
    { key: 'Alt + H', action: 'Start Help Tour' },
  ];

  return (
    <>
      {/* Help Button */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          title="Help & Support (F1 or ?)"
          aria-label="Help menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Help Menu Dropdown */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            role="menu"
            aria-labelledby="help-menu-button"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Help & Support</h3>
              <p className="text-sm text-gray-600 mt-1">Get help with using Kinect</p>
            </div>

            <div className="py-2">
              <button
                onClick={helpMenuItems.takeTour}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                role="menuitem"
              >
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Take the Tour</div>
                  <div className="text-sm text-gray-500">Learn Kinect features step-by-step</div>
                </div>
              </button>

              <button
                onClick={helpMenuItems.featureTips}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                role="menuitem"
              >
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Feature Tips</div>
                  <div className="text-sm text-gray-500">Show helpful tooltips</div>
                </div>
              </button>

              <button
                onClick={helpMenuItems.shortcuts}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                role="menuitem"
              >
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Keyboard Shortcuts</div>
                  <div className="text-sm text-gray-500">View all shortcuts</div>
                </div>
              </button>

              <button
                onClick={helpMenuItems.documentation}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                role="menuitem"
              >
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Documentation</div>
                  <div className="text-sm text-gray-500">Full user guide</div>
                </div>
              </button>

              <div className="border-t border-gray-100 my-2" />

              <button
                onClick={helpMenuItems.resetOnboarding}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-red-600"
                role="menuitem"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <div className="font-medium">Reset Onboarding</div>
                  <div className="text-sm text-red-500">Start fresh tutorial</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close shortcuts"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-900">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">Escape</kbd> to close any modal or cancel actions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Global styles for feature tips mode
if (typeof document !== 'undefined') {
  const featureTipsStyleSheet = document.createElement('style');
  featureTipsStyleSheet.innerHTML = `
    .feature-tips-mode [data-tour] {
      position: relative;
      transition: all 0.3s ease;
    }

    .feature-tips-mode [data-tour]:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: #374151;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1000;
      margin-bottom: 5px;
    }

    .feature-tips-mode [data-tour]:hover::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #374151;
      z-index: 1000;
    }
  `;

  if (!document.querySelector('#feature-tips-styles')) {
    featureTipsStyleSheet.id = 'feature-tips-styles';
    document.head.appendChild(featureTipsStyleSheet);
  }
}