import React, { createContext, useContext, useState, useEffect } from 'react';
import { IOnboardingStatus } from '@kinect/shared';
import { useAuth } from '../../hooks/useAuth';
import { useDemoMode } from './DemoMode';
import { useWelcomeDemoTrigger } from '../../hooks/useWelcomeDemoTrigger';
import api from '../../services/api';

export interface WelcomeDemoStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  action?: 'navigation' | 'interaction' | 'observation';
  navigationPath?: string;
  interactionSelector?: string;
  completionTrigger?: 'auto' | 'manual' | 'interaction';
  duration?: number;
  prerequisites?: string[];
}

interface WelcomeDemoContextType {
  // State
  isWelcomeDemo: boolean;
  currentStep: number;
  isFirstTimeUser: boolean;
  onboardingStatus: IOnboardingStatus | null;
  isLoading: boolean;
  error: string | null;
  isPaused: boolean;
  
  // Actions
  startWelcomeDemo: () => void;
  completeWelcomeDemo: () => Promise<void>;
  skipWelcomeDemo: () => Promise<void>;
  pauseWelcomeDemo: () => void;
  resumeWelcomeDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: number) => void;
  updateTourPreferences: (preferences: { showTipsAndTricks?: boolean; autoStartTours?: boolean }) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  
  // Data
  steps: WelcomeDemoStep[];
  totalSteps: number;
  
  // Smart triggers
  triggerReason: string | null;
  canAutoStart: boolean;
}

const WelcomeDemoContext = createContext<WelcomeDemoContextType | undefined>(undefined);

export const useWelcomeDemo = () => {
  const context = useContext(WelcomeDemoContext);
  if (!context) {
    throw new Error('useWelcomeDemo must be used within a WelcomeDemoProvider');
  }
  return context;
};

const WELCOME_DEMO_STEPS: WelcomeDemoStep[] = [
  // Introduction Phase (Steps 1-3)
  {
    id: 'welcome',
    title: 'Welcome to Kinect! 👋',
    content: 'Never forget to stay in touch with people who matter. Let\'s take a quick tour to show you how Kinect helps you maintain meaningful relationships.',
    completionTrigger: 'manual',
    duration: 3000,
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    content: 'This is your relationship dashboard. Here you\'ll see an overview of all your contacts, stats about your communication patterns, and overdue contacts that need your attention. As you add contacts, this dashboard will come to life!',
    target: '[data-tour="dashboard"]',
    navigationPath: '/',
    action: 'navigation',
    completionTrigger: 'auto',
    duration: 6000,
  },
  {
    id: 'navigation',
    title: 'Navigation Overview',
    content: 'Let\'s quickly tour your main navigation. You have Contacts (manage your people), Lists (organize relationships), and Settings (customize your experience).',
    target: '[data-tour="main-nav"]',
    completionTrigger: 'auto',
    duration: 4000,
  },

  // Core Features Phase (Steps 4-10)
  {
    id: 'contact-lists',
    title: 'Understanding Contact Lists',
    content: 'Your relationships are organized into lists with different reminder intervals: Best Friends (30 days), Family (60 days), Friends (90 days), and Acquaintances (180 days). This helps you stay connected at the right frequency for each relationship.',
    target: '[data-tour="contact-lists"]',
    navigationPath: '/lists',
    action: 'navigation',
    completionTrigger: 'auto',
    duration: 7000,
  },
  {
    id: 'add-first-contact',
    title: 'Adding Your First Contact',
    content: 'Let\'s add your first contact! Click the "Add Contact" button and I\'ll guide you through the process. You\'ll learn about reminder intervals and list assignment.',
    target: '[data-tour="add-contact-button"]',
    navigationPath: '/contacts',
    action: 'interaction',
    interactionSelector: '[data-tour="add-contact-button"]',
    completionTrigger: 'interaction',
  },
  {
    id: 'contact-management',
    title: 'Contact Details & Management',
    content: 'Great! Now you can see your contact in the list. Notice the status badges - they show if someone is overdue (red), due soon (yellow), or recently contacted (green). You can edit, mark as contacted, or delete contacts from here.',
    target: '[data-tour="contact-item"]',
    completionTrigger: 'auto',
    duration: 6000,
    prerequisites: ['add-first-contact'],
  },
  {
    id: 'create-custom-list',
    title: 'Creating Custom Lists',
    content: 'You can create your own custom lists for specific groups like "Work Colleagues" or "Family". Let\'s create a custom list to see how it works.',
    target: '[data-tour="add-list-button"]',
    navigationPath: '/lists',
    action: 'interaction',
    interactionSelector: '[data-tour="add-list-button"]',
    completionTrigger: 'interaction',
  },
  {
    id: 'log-contact-interaction',
    title: 'Logging Contact Interactions',
    content: 'When you talk to someone, always mark them as contacted! This resets their reminder timer and keeps your relationship tracking accurate. Try clicking "Mark as Contacted" on a contact.',
    target: '[data-tour="mark-contacted"]',
    navigationPath: '/contacts',
    action: 'observation',
    completionTrigger: 'manual',
    duration: 5000,
  },
  {
    id: 'reminder-system',
    title: 'Reminder System Deep Dive',
    content: 'Kinect tracks time since your last contact and shows visual indicators. Red means overdue, yellow means due soon, green means recently contacted. You\'ll get email notifications for overdue contacts too.',
    target: '[data-tour="reminder-badges"]',
    completionTrigger: 'auto',
    duration: 6000,
  },
  {
    id: 'settings-customization',
    title: 'Settings & Customization',
    content: 'In Settings, you can customize notification preferences, modify reminder intervals for each list type, and adjust how Kinect works for you. You can also retake this tour anytime!',
    target: '[data-tour="settings-nav"]',
    navigationPath: '/settings',
    action: 'navigation',
    completionTrigger: 'auto',
    duration: 5000,
  },

  // Completion Phase (Steps 11-12)
  {
    id: 'whats-next',
    title: 'What\'s Next?',
    content: 'You\'ve learned the key features: organizing contacts in lists, tracking interactions, and using the reminder system. Now import your real contacts or add them manually. Consider adding your closest friends and family first!',
    completionTrigger: 'manual',
    duration: 6000,
  },
  {
    id: 'welcome-complete',
    title: 'Welcome Complete! 🎉',
    content: 'Congratulations! You\'re ready to use Kinect to strengthen your relationships. Remember, you can retake this tour anytime from Settings. Start by adding your most important contacts and let Kinect help you stay connected!',
    completionTrigger: 'manual',
    duration: 5000,
  },
];

interface WelcomeDemoProviderProps {
  children: React.ReactNode;
}

export const WelcomeDemoProvider: React.FC<WelcomeDemoProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { shouldShowDemo, triggers, triggerReason } = useWelcomeDemoTrigger();
  
  // State
  const [isWelcomeDemo, setIsWelcomeDemo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingStatus, setOnboardingStatus] = useState<IOnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Computed state
  const isFirstTimeUser = onboardingStatus && !onboardingStatus.welcomeDemoCompleted;
  const steps = WELCOME_DEMO_STEPS;
  const totalSteps = steps.length;

  // Load onboarding status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isDemoMode) {
      loadOnboardingStatus();
    }
  }, [isAuthenticated, user, isDemoMode]);

  // Smart auto-trigger system
  useEffect(() => {
    // Listen for auto-trigger events from the trigger hook
    const handleAutoTrigger = (event: CustomEvent) => {
      const { reason } = event.detail;
      
      // Check if auto-start is enabled
      if (onboardingStatus?.tourPreferences?.autoStartTours !== false && !isDemoMode) {
        console.log(`Welcome demo auto-triggered: ${reason}`);
        startWelcomeDemo();
      }
    };

    window.addEventListener('welcomeDemo:autoTrigger', handleAutoTrigger as EventListener);
    
    return () => {
      window.removeEventListener('welcomeDemo:autoTrigger', handleAutoTrigger as EventListener);
    };
  }, [onboardingStatus?.tourPreferences?.autoStartTours, isDemoMode]);

  // Manual trigger checking (for immediate scenarios)
  useEffect(() => {
    if (isFirstTimeUser && onboardingStatus?.tourPreferences?.autoStartTours && !isDemoMode) {
      // Check if we should show demo immediately
      if (shouldShowDemo()) {
        setTimeout(() => {
          startWelcomeDemo();
        }, 1500); // Brief delay to let the UI load
      }
    }
  }, [isFirstTimeUser, onboardingStatus?.tourPreferences?.autoStartTours, isDemoMode, shouldShowDemo]);

  const loadOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getOnboardingStatus();
      setOnboardingStatus(response.onboarding);
    } catch (error: any) {
      console.error('Failed to load onboarding status:', error);
      setError('Failed to load onboarding status');
    } finally {
      setIsLoading(false);
    }
  };

  const startWelcomeDemo = () => {
    if (isDemoMode) {
      console.warn('Cannot start welcome demo while in demo mode');
      return;
    }
    
    // Check for saved progress
    const savedStep = localStorage.getItem('welcomeDemoProgress');
    const startStep = savedStep ? parseInt(savedStep, 10) : 0;
    
    setIsWelcomeDemo(true);
    setCurrentStep(startStep);
    setIsPaused(false);
    setError(null);
    
    // Clear any existing progress since we're starting
    if (startStep === 0) {
      localStorage.removeItem('welcomeDemoProgress');
    }
  };

  const pauseWelcomeDemo = () => {
    setIsPaused(true);
    // Save current progress
    localStorage.setItem('welcomeDemoProgress', currentStep.toString());
  };

  const resumeWelcomeDemo = () => {
    setIsPaused(false);
  };

  const completeWelcomeDemo = async () => {
    try {
      setError(null);
      
      // Only mark as completed in backend if not in demo mode
      if (!isDemoMode) {
        const response = await api.markWelcomeDemoCompleted();
        setOnboardingStatus(response.onboarding);
      }
      
      setIsWelcomeDemo(false);
      setCurrentStep(0);
      setIsPaused(false);
      
      // Clear saved progress
      localStorage.removeItem('welcomeDemoProgress');
      // Store completion in localStorage for demo mode or as fallback
      localStorage.setItem('welcomeDemoCompleted', 'true');
      
    } catch (error: any) {
      console.error('Failed to mark welcome demo as completed:', error);
      setError('Failed to save completion status');
      
      // Still complete the demo locally even if API fails
      setIsWelcomeDemo(false);
      setCurrentStep(0);
      localStorage.setItem('welcomeDemoCompleted', 'true');
    }
  };

  const skipWelcomeDemo = async () => {
    try {
      setError(null);
      
      // Mark as completed in backend (skipping still counts as completion)
      if (!isDemoMode) {
        const response = await api.markWelcomeDemoCompleted();
        setOnboardingStatus(response.onboarding);
      }
      
      setIsWelcomeDemo(false);
      setCurrentStep(0);
      
      // Store skip in localStorage
      localStorage.setItem('welcomeDemoCompleted', 'true');
      localStorage.setItem('welcomeDemoSkipped', 'true');
      
    } catch (error: any) {
      console.error('Failed to mark welcome demo as skipped:', error);
      setError('Failed to save skip status');
      
      // Still skip the demo locally even if API fails
      setIsWelcomeDemo(false);
      setCurrentStep(0);
      localStorage.setItem('welcomeDemoCompleted', 'true');
      localStorage.setItem('welcomeDemoSkipped', 'true');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeWelcomeDemo();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateTourPreferences = async (preferences: {
    showTipsAndTricks?: boolean;
    autoStartTours?: boolean;
  }) => {
    try {
      setError(null);
      
      if (!isDemoMode) {
        const response = await api.updateOnboardingPreferences(preferences);
        setOnboardingStatus(response.onboarding);
      }
      
      // Also store in localStorage for demo mode or as fallback
      const currentPrefs = JSON.parse(localStorage.getItem('tourPreferences') || '{}');
      const newPrefs = { ...currentPrefs, ...preferences };
      localStorage.setItem('tourPreferences', JSON.stringify(newPrefs));
      
    } catch (error: any) {
      console.error('Failed to update tour preferences:', error);
      setError('Failed to update preferences');
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      setError(null);
      
      if (!isDemoMode) {
        const response = await api.resetOnboarding();
        setOnboardingStatus(response.onboarding);
      }
      
      // Clear localStorage flags
      localStorage.removeItem('welcomeDemoCompleted');
      localStorage.removeItem('welcomeDemoSkipped');
      localStorage.removeItem('tourPreferences');
      
      // Reset local state
      setIsWelcomeDemo(false);
      setCurrentStep(0);
      
    } catch (error: any) {
      console.error('Failed to reset onboarding:', error);
      setError('Failed to reset onboarding');
      throw error;
    }
  };

  const contextValue: WelcomeDemoContextType = {
    // State
    isWelcomeDemo,
    currentStep,
    isFirstTimeUser: !!isFirstTimeUser,
    onboardingStatus,
    isLoading,
    error,
    isPaused,
    
    // Actions
    startWelcomeDemo,
    completeWelcomeDemo,
    skipWelcomeDemo,
    pauseWelcomeDemo,
    resumeWelcomeDemo,
    nextStep,
    prevStep,
    setCurrentStep,
    updateTourPreferences,
    resetOnboarding,
    
    // Data
    steps,
    totalSteps,
    
    // Smart triggers
    triggerReason,
    canAutoStart: triggers.firstLogin || triggers.emptyContacts || triggers.afterPeriodOfInactivity,
  };

  return (
    <WelcomeDemoContext.Provider value={contextValue}>
      {children}
    </WelcomeDemoContext.Provider>
  );
};