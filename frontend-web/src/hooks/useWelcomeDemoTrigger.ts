import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useDemoMode } from '../features/demo/DemoMode';
import { useLocation } from 'react-router-dom';

interface WelcomeDemoTrigger {
  shouldShowDemo: () => boolean;
  triggers: {
    firstLogin: boolean;
    emptyContacts: boolean;
    userRequested: boolean;
    afterPeriodOfInactivity: boolean;
    featureDiscovery: boolean;
  };
  triggerReason: string | null;
}

interface TriggerConditions {
  isFirstTimeUser: boolean;
  hasEmptyDashboard: boolean;
  daysSinceRegistration: number | null;
  lastVisit: Date | null;
  contactCount: number;
  listCount: number;
  hasCompletedDemo: boolean;
}

export const useWelcomeDemoTrigger = (): WelcomeDemoTrigger => {
  const { user, isAuthenticated } = useAuth();
  const { isDemoMode } = useDemoMode();
  const location = useLocation();
  
  const [triggerConditions, setTriggerConditions] = useState<TriggerConditions>({
    isFirstTimeUser: false,
    hasEmptyDashboard: false,
    daysSinceRegistration: null,
    lastVisit: null,
    contactCount: 0,
    listCount: 0,
    hasCompletedDemo: false,
  });

  const [triggerReason, setTriggerReason] = useState<string | null>(null);

  // Load trigger conditions
  useEffect(() => {
    if (!isAuthenticated || !user || isDemoMode) return;

    loadTriggerConditions();
  }, [isAuthenticated, user, isDemoMode]);

  const loadTriggerConditions = async () => {
    try {
      // Check onboarding status
      const onboardingResponse = await fetch('/api/auth/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!onboardingResponse.ok) {
        console.error('Failed to load onboarding status');
        return;
      }

      const onboardingData = await onboardingResponse.json();
      const onboarding = onboardingData.data?.onboarding;

      // Check contact/list counts
      const contactsResponse = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const listsResponse = await fetch('/api/lists', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const contactsData = contactsResponse.ok ? await contactsResponse.json() : { data: { contacts: [] } };
      const listsData = listsResponse.ok ? await listsResponse.json() : { data: { lists: [] } };

      // Calculate conditions
      const registrationDate = user?.createdAt ? new Date(user.createdAt) : null;
      const daysSinceRegistration = registrationDate 
        ? Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const lastVisitString = localStorage.getItem('lastVisit');
      const lastVisit = lastVisitString ? new Date(lastVisitString) : null;
      
      // Update last visit
      localStorage.setItem('lastVisit', new Date().toISOString());

      const contactCount = contactsData.data?.contacts?.length || 0;
      const listCount = listsData.data?.lists?.length || 0;

      setTriggerConditions({
        isFirstTimeUser: !onboarding?.welcomeDemoCompleted && (daysSinceRegistration === null || daysSinceRegistration <= 7),
        hasEmptyDashboard: contactCount === 0,
        daysSinceRegistration,
        lastVisit,
        contactCount,
        listCount,
        hasCompletedDemo: onboarding?.welcomeDemoCompleted || false,
      });

    } catch (error) {
      console.error('Failed to load trigger conditions:', error);
    }
  };

  // Trigger detection logic
  const shouldShowDemo = (): boolean => {
    if (isDemoMode || !isAuthenticated) return false;

    const triggers = getTriggers();
    
    // Priority order for triggers
    if (triggers.firstLogin) {
      setTriggerReason('first-time-user');
      return true;
    }
    
    if (triggers.emptyContacts) {
      setTriggerReason('empty-dashboard');
      return true;
    }
    
    if (triggers.afterPeriodOfInactivity) {
      setTriggerReason('returning-after-inactivity');
      return true;
    }
    
    if (triggers.featureDiscovery) {
      setTriggerReason('feature-discovery');
      return true;
    }
    
    if (triggers.userRequested) {
      setTriggerReason('user-requested');
      return true;
    }

    setTriggerReason(null);
    return false;
  };

  const getTriggers = () => {
    const now = new Date();
    
    return {
      // First login: New user who hasn't completed demo
      firstLogin: triggerConditions.isFirstTimeUser && !triggerConditions.hasCompletedDemo,
      
      // Empty contacts: User has no contacts after being registered for a while
      emptyContacts: triggerConditions.hasEmptyDashboard && 
                     triggerConditions.daysSinceRegistration !== null &&
                     triggerConditions.daysSinceRegistration >= 1 &&
                     !triggerConditions.hasCompletedDemo,
      
      // User requested: Manual trigger (handled elsewhere)
      userRequested: false,
      
      // After period of inactivity: User hasn't visited for 7+ days and hasn't completed demo
      afterPeriodOfInactivity: triggerConditions.lastVisit !== null &&
                               (now.getTime() - triggerConditions.lastVisit.getTime()) > (7 * 24 * 60 * 60 * 1000) &&
                               !triggerConditions.hasCompletedDemo,
      
      // Feature discovery: User tries to use advanced features without demo
      featureDiscovery: isOnAdvancedPage() && 
                        triggerConditions.contactCount === 0 && 
                        !triggerConditions.hasCompletedDemo,
    };
  };

  const isOnAdvancedPage = (): boolean => {
    const advancedPaths = ['/lists', '/settings'];
    return advancedPaths.includes(location.pathname);
  };

  // Auto-trigger detection with delay
  useEffect(() => {
    if (!isAuthenticated || isDemoMode) return;

    // Small delay to let the UI settle
    const timer = setTimeout(() => {
      const should = shouldShowDemo();
      if (should && triggerReason) {
        // Dispatch custom event for auto-trigger
        window.dispatchEvent(new CustomEvent('welcomeDemo:autoTrigger', {
          detail: { reason: triggerReason, conditions: triggerConditions }
        }));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [triggerConditions, location.pathname]);

  return {
    shouldShowDemo,
    triggers: getTriggers(),
    triggerReason,
  };
};