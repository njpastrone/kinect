import React, { useState, useEffect } from 'react';
import { DEMO_TOUR_STEPS } from './demoData';
import { useDemoMode } from './DemoMode';

interface TourStep {
  target: string;
  content: string;
  title: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const { showNotification } = useDemoMode();

  const steps = DEMO_TOUR_STEPS;

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const findAndHighlightElement = () => {
      const element = document.querySelector(steps[currentStep].target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const tooltipTop = rect.bottom + window.scrollY + 10;
        const tooltipLeft = rect.left + window.scrollX + rect.width / 2;
        
        setTooltipPosition({
          top: tooltipTop,
          left: tooltipLeft
        });

        // Add highlight effect
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Spotlight effect */}
      {targetElement && (
        <div
          className="fixed z-45 pointer-events-none"
          style={{
            top: targetElement.offsetTop - 8,
            left: targetElement.offsetLeft - 8,
            width: targetElement.offsetWidth + 16,
            height: targetElement.offsetHeight + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px'
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-50 max-w-sm bg-white rounded-lg shadow-xl p-4 transform -translate-x-1/2"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        {/* Arrow */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white" />

        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {steps[currentStep].content}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
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
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 h-1 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
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
        className="fixed bottom-4 right-4 z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
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
      
      {/* Tour highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 46;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};