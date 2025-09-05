import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useDemoMode } from '../features/demo/DemoMode';
import api from '../services/api';

interface UserDetectionState {
  isFirstTimeUser: boolean;
  isReturningUser: boolean;
  hasCompletedWelcomeDemo: boolean;
  hasSeenGuidedTour: boolean;
  daysSinceRegistration: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserDetection = (): UserDetectionState => {
  const { user, isAuthenticated } = useAuth();
  const { isDemoMode, isLoggedInAsDemo } = useDemoMode();
  
  const [state, setState] = useState<UserDetectionState>({
    isFirstTimeUser: false,
    isReturningUser: false,
    hasCompletedWelcomeDemo: false,
    hasSeenGuidedTour: false,
    daysSinceRegistration: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const detectUserType = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Handle demo mode users
        if (isDemoMode || isLoggedInAsDemo) {
          const hasSeenDemoTour = localStorage.getItem('hasSeenDemoTour') === 'true';
          setState({
            isFirstTimeUser: !hasSeenDemoTour,
            isReturningUser: hasSeenDemoTour,
            hasCompletedWelcomeDemo: hasSeenDemoTour,
            hasSeenGuidedTour: hasSeenDemoTour,
            daysSinceRegistration: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        // Handle authenticated real users
        if (isAuthenticated && user) {
          // Get onboarding status from backend
          const onboardingResponse = await api.getOnboardingStatus();
          const onboarding = onboardingResponse.onboarding;

          // Calculate days since registration
          const registrationDate = user.createdAt ? new Date(user.createdAt) : null;
          const daysSinceRegistration = registrationDate 
            ? Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          // Determine user classification
          const hasCompletedWelcomeDemo = onboarding?.welcomeDemoCompleted || false;
          const hasSeenGuidedTour = localStorage.getItem('hasSeenDemoTour') === 'true';
          
          // User is considered "first-time" if:
          // 1. They haven't completed the welcome demo AND
          // 2. They registered recently (within 7 days) OR have no registration date AND
          // 3. They haven't seen the guided tour
          const isFirstTimeUser = !hasCompletedWelcomeDemo && 
                                 (daysSinceRegistration === null || daysSinceRegistration <= 7) &&
                                 !hasSeenGuidedTour;

          setState({
            isFirstTimeUser,
            isReturningUser: !isFirstTimeUser,
            hasCompletedWelcomeDemo,
            hasSeenGuidedTour,
            daysSinceRegistration,
            isLoading: false,
            error: null,
          });

        } else {
          // Not authenticated - reset state
          setState({
            isFirstTimeUser: false,
            isReturningUser: false,
            hasCompletedWelcomeDemo: false,
            hasSeenGuidedTour: false,
            daysSinceRegistration: null,
            isLoading: false,
            error: null,
          });
        }

      } catch (error: any) {
        console.error('Error detecting user type:', error);
        
        // Fallback to localStorage-based detection if API fails
        const hasSeenWelcomeDemo = localStorage.getItem('welcomeDemoCompleted') === 'true';
        const hasSeenGuidedTour = localStorage.getItem('hasSeenDemoTour') === 'true';
        
        setState({
          isFirstTimeUser: !hasSeenWelcomeDemo && !hasSeenGuidedTour,
          isReturningUser: hasSeenWelcomeDemo || hasSeenGuidedTour,
          hasCompletedWelcomeDemo: hasSeenWelcomeDemo,
          hasSeenGuidedTour,
          daysSinceRegistration: null,
          isLoading: false,
          error: 'Failed to load onboarding status from server',
        });
      }
    };

    detectUserType();
  }, [isAuthenticated, user, isDemoMode, isLoggedInAsDemo]);

  return state;
};

// Helper hook for onboarding state management
export const useOnboardingState = () => {
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOnboardingStatus = async () => {
    if (!user || isDemoMode) return;
    
    try {
      setIsLoading(true);
      const response = await api.getOnboardingStatus();
      setOnboardingData(response.onboarding);
    } catch (error) {
      console.error('Failed to refresh onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTourPreferences = async (preferences: {
    showTipsAndTricks?: boolean;
    autoStartTours?: boolean;
  }) => {
    if (!user || isDemoMode) {
      // Store in localStorage for demo mode
      const currentPrefs = JSON.parse(localStorage.getItem('tourPreferences') || '{}');
      localStorage.setItem('tourPreferences', JSON.stringify({ ...currentPrefs, ...preferences }));
      return;
    }

    try {
      const response = await api.updateOnboardingPreferences(preferences);
      setOnboardingData(response.onboarding);
    } catch (error) {
      console.error('Failed to update tour preferences:', error);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    if (!user || isDemoMode) {
      // Clear localStorage for demo mode
      localStorage.removeItem('welcomeDemoCompleted');
      localStorage.removeItem('welcomeDemoSkipped');
      localStorage.removeItem('hasSeenDemoTour');
      localStorage.removeItem('tourPreferences');
      setOnboardingData(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.resetOnboarding();
      setOnboardingData(response.onboarding);
      
      // Also clear localStorage as backup
      localStorage.removeItem('welcomeDemoCompleted');
      localStorage.removeItem('welcomeDemoSkipped');
      localStorage.removeItem('hasSeenDemoTour');
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isDemoMode) {
      refreshOnboardingStatus();
    }
  }, [user, isDemoMode]);

  return {
    onboardingData,
    isLoading,
    refreshOnboardingStatus,
    updateTourPreferences,
    resetOnboarding,
  };
};

// Hook for tracking user journey and analytics
export const useUserJourney = () => {
  const userDetection = useUserDetection();
  const { user } = useAuth();

  const getJourneyStage = (): 'new' | 'onboarding' | 'active' | 'returning' => {
    if (userDetection.isFirstTimeUser) {
      return !userDetection.hasCompletedWelcomeDemo ? 'new' : 'onboarding';
    }
    
    if (userDetection.isReturningUser) {
      // Consider user "returning" if they haven't been active recently
      if (userDetection.daysSinceRegistration && userDetection.daysSinceRegistration > 30) {
        return 'returning';
      }
      return 'active';
    }

    return 'active';
  };

  const shouldShowWelcomeDemo = (): boolean => {
    return userDetection.isFirstTimeUser && !userDetection.hasCompletedWelcomeDemo;
  };

  const shouldShowGuidedTour = (): boolean => {
    return !userDetection.hasSeenGuidedTour && userDetection.hasCompletedWelcomeDemo;
  };

  const getOnboardingProgress = (): number => {
    let progress = 0;
    if (user) progress += 25; // Account created
    if (userDetection.hasCompletedWelcomeDemo) progress += 50; // Welcome demo completed
    if (userDetection.hasSeenGuidedTour) progress += 25; // Guided tour completed
    return progress;
  };

  return {
    ...userDetection,
    journeyStage: getJourneyStage(),
    shouldShowWelcomeDemo: shouldShowWelcomeDemo(),
    shouldShowGuidedTour: shouldShowGuidedTour(),
    onboardingProgress: getOnboardingProgress(),
  };
};