import { useEffect, useState } from 'react';

interface ProgressiveDisclosureConfig {
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
}

interface DisclosureState {
  hiddenElements: string[];
  highlightedFeatures: string[];
  contextualHelp: string[];
}

export const useProgressiveDisclosure = (config: ProgressiveDisclosureConfig) => {
  const [disclosureState, setDisclosureState] = useState<DisclosureState>({
    hiddenElements: [],
    highlightedFeatures: [],
    contextualHelp: [],
  });

  // Define what should be hidden/highlighted at each step
  const stepDisclosureMap: Record<number | string, DisclosureState> = {
    // Step 0: Welcome - Hide everything except basic navigation
    0: {
      hiddenElements: [
        '[data-tour="add-contact-button"]',
        '[data-tour="add-list-button"]',
        '.contact-actions',
        '.advanced-features'
      ],
      highlightedFeatures: ['[data-tour="main-nav"]'],
      contextualHelp: ['navigation-basics']
    },
    
    // Step 1: Dashboard - Show dashboard, hide contact management
    1: {
      hiddenElements: [
        '[data-tour="add-contact-button"]', 
        '[data-tour="add-list-button"]',
        '.contact-actions'
      ],
      highlightedFeatures: ['[data-tour="dashboard"]'],
      contextualHelp: ['dashboard-overview']
    },
    
    // Step 2: Navigation - Show all navigation
    2: {
      hiddenElements: ['[data-tour="add-contact-button"]', '[data-tour="add-list-button"]'],
      highlightedFeatures: ['[data-tour="main-nav"]', '[data-tour="contacts-nav"]', '[data-tour="settings-nav"]'],
      contextualHelp: ['navigation-tour']
    },
    
    // Step 3: Contact Lists - Show lists, hide individual contact actions
    3: {
      hiddenElements: ['.contact-actions'],
      highlightedFeatures: ['[data-tour="contact-lists"]'],
      contextualHelp: ['lists-explanation']
    },
    
    // Step 4: Add Contact - Reveal add contact button
    4: {
      hiddenElements: [],
      highlightedFeatures: ['[data-tour="add-contact-button"]'],
      contextualHelp: ['contact-creation']
    },
    
    // Step 5+: Gradually reveal all features
    default: {
      hiddenElements: [],
      highlightedFeatures: [],
      contextualHelp: []
    }
  };

  useEffect(() => {
    if (!config.isActive) {
      // Clear all progressive disclosure when tour is not active
      clearDisclosureEffects();
      return;
    }

    const currentDisclosure = stepDisclosureMap[config.currentStep] || stepDisclosureMap.default;
    setDisclosureState(currentDisclosure);
    
    // Apply disclosure effects to DOM
    applyDisclosureEffects(currentDisclosure);

    return () => {
      // Cleanup on step change
      clearDisclosureEffects();
    };
  }, [config.currentStep, config.isActive]);

  const applyDisclosureEffects = (disclosure: DisclosureState) => {
    // Hide elements
    disclosure.hiddenElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).classList.add('welcome-demo-hidden');
      });
    });

    // Highlight features
    disclosure.highlightedFeatures.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).classList.add('welcome-demo-highlight-feature');
      });
    });
  };

  const clearDisclosureEffects = () => {
    // Remove all progressive disclosure classes
    const hiddenElements = document.querySelectorAll('.welcome-demo-hidden');
    hiddenElements.forEach(element => {
      element.classList.remove('welcome-demo-hidden');
    });

    const highlightedElements = document.querySelectorAll('.welcome-demo-highlight-feature');
    highlightedElements.forEach(element => {
      element.classList.remove('welcome-demo-highlight-feature');
    });
  };

  const showContextualHelp = (helpId: string): string | null => {
    const helpMessages: Record<string, string> = {
      'navigation-basics': 'Use the navigation bar to move between different sections of Kinect.',
      'dashboard-overview': 'Your dashboard shows an overview of all your relationships and recent activity.',
      'navigation-tour': 'Each section serves a different purpose: Contacts for management, Lists for organization, Settings for customization.',
      'lists-explanation': 'Contact lists help organize your relationships with appropriate reminder intervals.',
      'contact-creation': 'Adding contacts is the first step to building your relationship network in Kinect.',
    };

    return helpMessages[helpId] || null;
  };

  return {
    disclosureState,
    showContextualHelp,
    clearDisclosureEffects,
  };
};