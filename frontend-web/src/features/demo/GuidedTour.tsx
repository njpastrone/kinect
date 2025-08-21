import React, { useState, useEffect } from 'react';
import { DEMO_TOUR_STEPS } from './demoData';
import { useDemoMode } from './DemoMode';

interface GuidedTourProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ 
  isOpen: externalIsOpen, 
  onComplete: externalOnComplete, 
  onSkip: externalOnSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ 
    top: 0, 
    left: 0, 
    placement: 'center' 
  });
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { showNotification, isDemoMode } = useDemoMode();

  // Use external control if provided, otherwise use internal state based on demo mode
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onComplete = externalOnComplete || (() => {
    setInternalIsOpen(false);
    localStorage.setItem('hasSeenDemoTour', 'true');
  });
  const onSkip = externalOnSkip || (() => {
    setInternalIsOpen(false);
    localStorage.setItem('hasSeenDemoTour', 'true');
  });

  // Auto-open tour for demo mode if not seen before
  useEffect(() => {
    if (isDemoMode && !localStorage.getItem('hasSeenDemoTour') && externalIsOpen === undefined) {
      setTimeout(() => setInternalIsOpen(true), 1000); // Delay to allow UI to load
    }
  }, [isDemoMode, externalIsOpen]);

  const steps = DEMO_TOUR_STEPS;

  // Calculate optimal tooltip position
  const calculateTooltipPosition = (element: HTMLElement): TooltipPosition => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const margin = 20;

    // Determine best placement
    let placement: TooltipPosition['placement'] = 'bottom';
    let top = rect.bottom + window.scrollY + 15;
    let left = rect.left + window.scrollX + rect.width / 2;

    // Check if there's space below
    if (rect.bottom + tooltipHeight + margin > viewportHeight) {
      // Try above
      if (rect.top - tooltipHeight - margin > 0) {
        placement = 'top';
        top = rect.top + window.scrollY - tooltipHeight - 15;
      } else {
        // Try right
        if (rect.right + tooltipWidth + margin < viewportWidth) {
          placement = 'right';
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.right + window.scrollX + 15;
        } else if (rect.left - tooltipWidth - margin > 0) {
          // Try left
          placement = 'left';
          top = rect.top + window.scrollY + rect.height / 2;
          left = rect.left + window.scrollX - tooltipWidth - 15;
        } else {
          // Center on screen as fallback
          placement = 'center';
          top = viewportHeight / 2 + window.scrollY;
          left = viewportWidth / 2;
        }
      }
    }

    // Ensure tooltip stays within viewport bounds
    if (placement === 'bottom' || placement === 'top') {
      // Adjust horizontal position
      left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth / 2 - margin));
    } else if (placement === 'left' || placement === 'right') {
      // Adjust vertical position
      top = Math.max(margin, Math.min(top, viewportHeight + window.scrollY - tooltipHeight / 2 - margin));
    }

    return { top, left, placement };
  };

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const findAndHighlightElement = () => {
      const targetSelector = steps[currentStep].target;
      const element = document.querySelector(targetSelector) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        const position = calculateTooltipPosition(element);
        setTooltipPosition(position);

        // Add highlight effect
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        // No target element found - show centered tooltip
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2 + window.scrollY,
          left: window.innerWidth / 2,
          placement: 'center'
        });
      }
    };

    // Try to find element immediately
    findAndHighlightElement();

    // If element not found, try again after a short delay (for dynamic content)
    const timeout = setTimeout(findAndHighlightElement, 500);

    return () => {
      clearTimeout(timeout);
      // Remove highlight from previous element
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [isOpen, currentStep, steps, targetElement]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        const position = calculateTooltipPosition(targetElement);
        setTooltipPosition(position);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    if (targetElement) {
      targetElement.classList.remove('tour-highlight');
    }
    showNotification({
      title: 'Tour Completed!',
      message: 'You\'re all set to explore Kinect. Try adding a contact or syncing your phone logs!',
      type: 'success'
    });
    onComplete();
  };

  const skipTour = () => {
    if (targetElement) {
      targetElement.classList.remove('tour-highlight');
    }
    onSkip();
  };

  if (!isOpen || !steps[currentStep]) return null;

  // Tooltip styles based on placement
  const getTooltipStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10000,
      maxWidth: Math.min(400, window.innerWidth - 40),
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 20,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E5E7EB'
    };

    switch (tooltipPosition.placement) {
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      case 'top':
        return {
          ...baseStyles,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyles,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyles,
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateY(-50%)',
        };
      default:
        return baseStyles;
    }
  };

  // Arrow component
  const renderArrow = () => {
    if (tooltipPosition.placement === 'center') return null;

    const arrowClasses = "absolute w-0 h-0 border-8";
    
    switch (tooltipPosition.placement) {
      case 'top':
        return (
          <div 
            className={`${arrowClasses} border-l-transparent border-r-transparent border-b-transparent border-t-white`}
            style={{
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))'
            }}
          />
        );
      case 'bottom':
        return (
          <div 
            className={`${arrowClasses} border-l-transparent border-r-transparent border-t-transparent border-b-white`}
            style={{
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1))'
            }}
          />
        );
      case 'left':
        return (
          <div 
            className={`${arrowClasses} border-t-transparent border-b-transparent border-l-transparent border-r-white`}
            style={{
              right: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              filter: 'drop-shadow(-1px 0 1px rgba(0, 0, 0, 0.1))'
            }}
          />
        );
      case 'right':
        return (
          <div 
            className={`${arrowClasses} border-t-transparent border-b-transparent border-r-transparent border-l-white`}
            style={{
              left: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              filter: 'drop-shadow(1px 0 1px rgba(0, 0, 0, 0.1))'
            }}
          />
        );
      default:
        return null;
    }
  };

  // Spotlight effect for target element
  const renderSpotlight = () => {
    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();
    
    return (
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 9999,
          top: rect.top + window.scrollY - 8,
          left: rect.left + window.scrollX - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
          border: '2px solid #4F46E5'
        }}
      />
    );
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        style={{ backdropFilter: 'blur(1px)' }}
      />
      
      {/* Spotlight effect */}
      {renderSpotlight()}

      {/* Tooltip */}
      <div style={getTooltipStyles()}>
        {/* Arrow */}
        {renderArrow()}

        <div className="mb-4">
          <h3 className="font-semibold text-xl text-gray-900 mb-3">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {steps[currentStep].content}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 font-medium">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={skipTour}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip Tour
            </button>
            
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
};

// Tour trigger button
export const TourTriggerButton: React.FC = () => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    // Auto-start tour for first-time demo users
    const hasSeenTourBefore = localStorage.getItem('hasSeenDemoTour');
    if (isDemoMode && !hasSeenTourBefore && !hasSeenTour) {
      setTimeout(() => setIsTourOpen(true), 1000);
    }
  }, [isDemoMode, hasSeenTour]);

  const startTour = () => {
    setIsTourOpen(true);
  };

  const completeTour = () => {
    setIsTourOpen(false);
    setHasSeenTour(true);
    localStorage.setItem('hasSeenDemoTour', 'true');
  };

  const skipTour = () => {
    setIsTourOpen(false);
    setHasSeenTour(true);
    localStorage.setItem('hasSeenDemoTour', 'true');
  };

  if (!isDemoMode) return null;

  return (
    <>
      <button
        onClick={startTour}
        className="fixed bottom-4 right-4 z-[9990] bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        title="Take the guided tour"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <GuidedTour
        isOpen={isTourOpen}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    </>
  );
};

// Add global styles for tour
if (typeof document !== 'undefined') {
  const tourStyleSheet = document.createElement('style');
  tourStyleSheet.innerHTML = `
    .tour-highlight {
      position: relative;
      z-index: 9999 !important;
      box-shadow: 0 0 20px rgba(79, 70, 229, 0.6) !important;
      border-radius: 8px !important;
      transition: all 0.3s ease !important;
    }

    /* Ensure tour elements have proper stacking */
    .tour-overlay {
      z-index: 9998 !important;
    }
    
    .tour-spotlight {
      z-index: 9999 !important;
    }
    
    .tour-tooltip {
      z-index: 10000 !important;
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      .tour-tooltip {
        max-width: calc(100vw - 32px) !important;
        margin: 16px !important;
      }
    }

    /* Animation for tour elements */
    @keyframes tourFadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .tour-tooltip {
      animation: tourFadeIn 0.2s ease-out;
    }
  `;
  
  // Only add if not already added
  if (!document.querySelector('#tour-styles')) {
    tourStyleSheet.id = 'tour-styles';
    document.head.appendChild(tourStyleSheet);
  }
}