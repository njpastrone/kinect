import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_CREDENTIALS, DEMO_NOTIFICATIONS } from './demoData';

interface DemoModeContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  showNotification: (notification: DemoNotification) => void;
  resetDemo: () => void;
  isLoggedInAsDemo: boolean;
}

interface DemoNotification {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

interface DemoModeProviderProps {
  children: React.ReactNode;
}

export const DemoModeProvider: React.FC<DemoModeProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);
  const [isLoggedInAsDemo, setIsLoggedInAsDemo] = useState(false);

  // Check if user is logged in with demo credentials
  useEffect(() => {
    const checkDemoStatus = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const isDemoUser = user.email === DEMO_CREDENTIALS.email;
          setIsLoggedInAsDemo(isDemoUser);
          if (isDemoUser && !isDemoMode) {
            setIsDemoMode(true);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    checkDemoStatus();
  }, [isDemoMode]);

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    localStorage.setItem('demoMode', enabled.toString());

    if (enabled) {
      showNotification(DEMO_NOTIFICATIONS[0]);
    }
  };

  const showNotification = (notification: DemoNotification) => {
    if (!isDemoMode) return;

    setNotifications((prev) => [...prev, { ...notification, id: Date.now() } as any]);

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  };

  const resetDemo = async () => {
    try {
      // In a real implementation, this would call an API to reset demo data
      showNotification({
        title: 'Demo Reset',
        message: 'Demo data has been reset to initial state',
        type: 'info',
      });
    } catch (error) {
      showNotification({
        title: 'Reset Failed',
        message: 'Could not reset demo data',
        type: 'error',
      });
    }
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        showNotification,
        resetDemo,
        isLoggedInAsDemo,
      }}
    >
      {children}
      {isDemoMode && <DemoNotifications notifications={notifications} />}
    </DemoModeContext.Provider>
  );
};

interface DemoNotificationsProps {
  notifications: DemoNotification[];
}

const DemoNotifications: React.FC<DemoNotificationsProps> = ({ notifications }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`max-w-sm p-4 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === 'info'
              ? 'bg-blue-500 text-white'
              : notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'warning'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-start">
            <div className="mr-3 text-xl">
              {notification.type === 'info'
                ? 'ℹ️'
                : notification.type === 'success'
                  ? '✅'
                  : notification.type === 'warning'
                    ? '⚠️'
                    : '❌'}
            </div>
            <div>
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-xs mt-1 opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Demo Mode Toggle Component
export const DemoModeToggle: React.FC = () => {
  const { isDemoMode, setDemoMode, isLoggedInAsDemo } = useDemoMode();

  if (!isLoggedInAsDemo && !isDemoMode) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Demo Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDemoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-400"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

// Demo Banner Component
export const DemoBanner: React.FC = () => {
  const { isDemoMode, resetDemo } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🚀</span>
          <span className="text-sm font-medium">
            You&apos;re in Demo Mode - Explore Kinect with sample data
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetDemo}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
};
