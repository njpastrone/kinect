import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWelcomeDemo } from './WelcomeDemoContext';
import { useDemoMode } from './DemoMode';
import { useProgressiveDisclosure } from '../../hooks/useProgressiveDisclosure';

interface WelcomeDemoProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const WelcomeDemo: React.FC<WelcomeDemoProps> = ({
  isOpen: externalIsOpen,
  onComplete: externalOnComplete,
  onSkip: externalOnSkip,
}) => {
  const navigate = useNavigate();
  const {
    isWelcomeDemo,
    currentStep,
    steps,
    totalSteps,
    nextStep,
    prevStep,
    completeWelcomeDemo,
    skipWelcomeDemo,
    error,
  } = useWelcomeDemo();
  
  const { showNotification } = useDemoMode();
  
  
  // Use external control if provided, otherwise use context state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : isWelcomeDemo;
  const currentStepData = steps[currentStep];

  // Progressive disclosure (currently unused but ready for future enhancement)
  useProgressiveDisclosure({
    currentStep,
    totalSteps,
    isActive: isOpen,
  });
  
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    placement: 'center',
  });


  // Handle step navigation and actions
  useEffect(() => {
    if (!isOpen || !currentStepData) return;

    const handleStepAction = async () => {
      // Handle navigation
      if (currentStepData.action === 'navigation' && currentStepData.navigationPath) {
        navigate(currentStepData.navigationPath);
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Find and highlight target element
      if (currentStepData.target) {
        const findElement = () => {
          const element = document.querySelector(currentStepData.target!) as HTMLElement;
          if (element) {
            setTargetElement(element);
            const position = calculateTooltipPosition(element);
            setTooltipPosition(position);
            
            // Add highlight effect
            element.classList.add('welcome-tour-highlight');
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center', 
              inline: 'center' 
            });

            // Set up interaction listeners for interactive steps
            if (currentStepData.completionTrigger === 'interaction') {
              setupInteractionListeners(element);
            } else if (currentStepData.completionTrigger === 'auto' && currentStepData.duration) {
              // Auto-advance if specified
              setTimeout(() => {
                nextStep();
              }, currentStepData.duration);
            }
          } else {
            // No target element found - show centered tooltip
            setTargetElement(null);
            setTooltipPosition({
              top: window.innerHeight / 2 + window.scrollY,
              left: window.innerWidth / 2,
              placement: 'center',
            });
            
            // Auto-advance for steps without targets
            if (currentStepData.completionTrigger === 'auto' && currentStepData.duration) {
              setTimeout(() => {
                nextStep();
              }, currentStepData.duration);
            }
          }
        };

        // Try finding the element immediately and after delays
        findElement();
        const timeouts = [250, 500, 1000];
        timeouts.forEach(delay => {
          setTimeout(findElement, delay);
        });
      } else {
        // Steps without targets are shown centered
        setTargetElement(null);
        setTooltipPosition({
          top: window.innerHeight / 2 + window.scrollY,
          left: window.innerWidth / 2,
          placement: 'center',
        });
        
        // Auto-advance for steps without targets
        if (currentStepData.completionTrigger === 'auto' && currentStepData.duration) {
          setTimeout(() => {
            nextStep();
          }, currentStepData.duration);
        }
      }
    };

    // Set up interaction listeners for specific steps
    const setupInteractionListeners = (element: HTMLElement) => {
      const stepId = currentStepData?.id;
      
      switch (stepId) {
        case 'add-first-contact':
          // Listen for modal open
          const modalObserver = new MutationObserver(() => {
            const modal = document.querySelector('[role="dialog"]');
            if (modal) {
              setTimeout(() => {
                nextStep();
              }, 1000);
              modalObserver.disconnect();
            }
          });
          modalObserver.observe(document.body, { childList: true, subtree: true });
          
          // Also listen for direct clicks on the button
          element.addEventListener('click', () => {
            setTimeout(() => {
              const modal = document.querySelector('[role="dialog"]');
              if (modal) {
                nextStep();
              }
            }, 500);
          }, { once: true });
          break;
          
        case 'create-custom-list':
          // Similar for list creation
          const listModalObserver = new MutationObserver(() => {
            const modal = document.querySelector('[role="dialog"]');
            if (modal) {
              setTimeout(() => {
                nextStep();
              }, 1000);
              listModalObserver.disconnect();
            }
          });
          listModalObserver.observe(document.body, { childList: true, subtree: true });
          
          element.addEventListener('click', () => {
            setTimeout(() => {
              const modal = document.querySelector('[role="dialog"]');
              if (modal) {
                nextStep();
              }
            }, 500);
          }, { once: true });
          break;
      }
    };

    handleStepAction();

    return () => {
      // Remove highlight from previous element
      if (targetElement) {
        targetElement.classList.remove('welcome-tour-highlight');
      }
    };
  }, [isOpen, currentStep, currentStepData, navigate, nextStep, targetElement]);

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

  // Calculate optimal tooltip position
  const calculateTooltipPosition = (element: HTMLElement): TooltipPosition => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 420;
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
      left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth / 2 - margin));
    } else if (placement === 'left' || placement === 'right') {
      top = Math.max(
        margin,
        Math.min(top, viewportHeight + window.scrollY - tooltipHeight / 2 - margin)
      );
    }

    return { top, left, placement };
  };

  const handleNext = () => {
    if (currentStepData?.completionTrigger === 'interaction') {
      // For interaction steps, encourage user to perform the action
      handleInteractiveStep();
      return;
    }
    nextStep();
  };

  const handleInteractiveStep = () => {
    const stepId = currentStepData?.id;
    
    switch (stepId) {
      case 'add-first-contact':
        // Highlight the add contact button and wait for click
        showNotification({
          title: 'Click "Add Contact"',
          message: 'Click the blue "Add Contact" button to continue the tour.',
          type: 'info',
        });
        // Set up listener for when modal opens
        setTimeout(() => {
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            nextStep(); // Advance when modal opens
          }
        }, 1000);
        break;
        
      case 'create-custom-list':
        // Similar logic for creating lists
        showNotification({
          title: 'Create a New List',
          message: 'Click "Create List" to add a custom contact list.',
          type: 'info',
        });
        setTimeout(() => {
          const modal = document.querySelector('[role="dialog"]');
          if (modal) {
            nextStep();
          }
        }, 1000);
        break;
        
      default:
        // Fallback for other interaction steps
        showNotification({
          title: 'Action Required',
          message: currentStepData?.content || 'Please perform the highlighted action to continue.',
          type: 'info',
        });
    }
  };

  const handleComplete = async () => {
    try {
      if (externalOnComplete) {
        externalOnComplete();
      } else {
        await completeWelcomeDemo();
        showNotification({
          title: 'Welcome Tour Complete! 🎉',
          message: 'You\'re ready to start managing your relationships with Kinect!',
          type: 'success',
        });
      }
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to save completion status, but you can continue using Kinect.',
        type: 'error',
      });
    }
  };

  const handleSkip = async () => {
    try {
      if (externalOnSkip) {
        externalOnSkip();
      } else {
        await skipWelcomeDemo();
        showNotification({
          title: 'Tour Skipped',
          message: 'You can restart the welcome tour anytime from settings.',
          type: 'info',
        });
      }
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to save skip status, but you can continue using Kinect.',
        type: 'error',
      });
    }
  };

  if (!isOpen || !currentStepData) return null;

  // Tooltip styles based on placement
  const getTooltipStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10001,
      maxWidth: Math.min(420, window.innerWidth - 40),
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #E5E7EB',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: 'welcomeFadeIn 0.4s ease-out',
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

  // Progress indicator
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-demo-title"
      aria-describedby="welcome-demo-content"
      className="welcome-demo-overlay"
    >
      {/* Enhanced Overlay with animation */}
      <div 
        className="fixed inset-0 bg-black/60 z-[10000] transition-opacity duration-300" 
        style={{ 
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.3s ease-out'
        }} 
        onClick={(e) => {
          // Allow click outside to skip step (configurable)
          if (e.target === e.currentTarget && currentStepData?.id !== 'welcome') {
            nextStep();
          }
        }}
      />

      {/* Enhanced Spotlight effect */}
      {targetElement && (
        <div
          className="fixed pointer-events-none transition-all duration-500 ease-out"
          style={{
            zIndex: 10000,
            top: targetElement.getBoundingClientRect().top + window.scrollY - 8,
            left: targetElement.getBoundingClientRect().left + window.scrollX - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
            borderRadius: 8,
            border: '2px solid #4F46E5',
            animation: 'spotlightPulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Enhanced Tooltip */}
      <div 
        style={getTooltipStyles()}
        onKeyDown={(e) => {
          // Keyboard navigation
          switch (e.key) {
            case 'Escape':
              handleSkip();
              break;
            case 'ArrowRight':
            case 'Enter':
            case ' ':
              e.preventDefault();
              if (currentStep === totalSteps - 1) {
                handleComplete();
              } else {
                handleNext();
              }
              break;
            case 'ArrowLeft':
              e.preventDefault();
              if (currentStep > 0) {
                prevStep();
              }
              break;
          }
        }}
        tabIndex={0}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Welcome Tour</span>
            <span>{currentStep + 1} of {totalSteps}</span>
          </div>
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 
            id="welcome-demo-title"
            className="font-semibold text-xl text-gray-900 mb-3"
          >
            {currentStepData.title}
          </h3>
          <p 
            id="welcome-demo-content"
            className="text-gray-600 text-sm leading-relaxed"
            aria-live="polite"
          >
            {currentStepData.content}
          </p>
          
          {/* Step indicator for screen readers */}
          <div className="sr-only">
            Step {currentStep + 1} of {totalSteps}. 
            {currentStepData.completionTrigger === 'interaction' && 
              'This step requires user interaction to continue.'
            }
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
            )}

            <button
              onClick={currentStep === totalSteps - 1 ? handleComplete : handleNext}
              className="px-6 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              {currentStep === totalSteps - 1 ? 'Get Started!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Demo Trigger Button (for manual activation)
export const WelcomeDemoTrigger: React.FC = () => {
  const { startWelcomeDemo, isFirstTimeUser } = useWelcomeDemo();
  const { isDemoMode } = useDemoMode();

  // Don't show in demo mode or if user has completed welcome demo
  if (isDemoMode || !isFirstTimeUser) return null;

  return (
    <button
      onClick={startWelcomeDemo}
      className="fixed bottom-4 right-20 z-[9990] bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
      title="Take the welcome tour"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  );
};

// Auto-start component (handles first-time user detection)
export const WelcomeDemoAutoStart: React.FC = () => {
  const { isWelcomeDemo } = useWelcomeDemo();

  return (
    <>
      {isWelcomeDemo && <WelcomeDemo />}
      <WelcomeDemoTrigger />
    </>
  );
};

// Add enhanced global styles for welcome tour
if (typeof document !== 'undefined') {
  const welcomeTourStyleSheet = document.createElement('style');
  welcomeTourStyleSheet.innerHTML = `
    /* Enhanced highlight effects */
    .welcome-tour-highlight {
      position: relative;
      z-index: 10000 !important;
      box-shadow: 0 0 30px rgba(79, 70, 229, 0.8), 0 0 60px rgba(147, 51, 234, 0.4) !important;
      border-radius: 8px !important;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
      animation: welcomePulse 2.5s ease-in-out infinite;
    }

    /* Enhanced animations */
    @keyframes welcomePulse {
      0%, 100% {
        box-shadow: 0 0 30px rgba(79, 70, 229, 0.8), 0 0 60px rgba(147, 51, 234, 0.4);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 40px rgba(79, 70, 229, 1), 0 0 80px rgba(147, 51, 234, 0.6);
        transform: scale(1.02);
      }
    }

    @keyframes welcomeFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spotlightPulse {
      0%, 100% {
        border-color: #4F46E5;
        filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.6));
      }
      50% {
        border-color: #6366F1;
        filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.8));
      }
    }

    /* Enhanced overlay */
    .welcome-demo-overlay {
      /* Focus management */
      outline: none;
    }

    .welcome-demo-tooltip {
      animation: welcomeFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Progressive disclosure classes */
    .welcome-demo-hidden {
      opacity: 0.3;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .welcome-demo-highlight-feature {
      background: linear-gradient(45deg, rgba(79, 70, 229, 0.1), rgba(147, 51, 234, 0.1));
      border: 1px solid rgba(79, 70, 229, 0.3);
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    /* Mobile optimizations */
    @media (max-width: 640px) {
      .welcome-demo-tooltip {
        max-width: calc(100vw - 24px) !important;
        margin: 12px !important;
        padding: 16px !important;
        font-size: 14px;
      }
      
      .welcome-tour-highlight {
        animation: welcomePulseMobile 2s ease-in-out infinite;
      }
    }

    @keyframes welcomePulseMobile {
      0%, 100% {
        box-shadow: 0 0 20px rgba(79, 70, 229, 0.6), 0 0 40px rgba(147, 51, 234, 0.3);
      }
      50% {
        box-shadow: 0 0 25px rgba(79, 70, 229, 0.8), 0 0 50px rgba(147, 51, 234, 0.4);
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .welcome-tour-highlight {
        border: 3px solid #000 !important;
        box-shadow: 0 0 0 2px #fff, 0 0 0 5px #000 !important;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .welcome-tour-highlight {
        animation: none !important;
        transition: none !important;
      }
      
      .welcome-demo-tooltip {
        animation: none !important;
      }
    }
  `;

  // Only add if not already added
  if (!document.querySelector('#welcome-tour-styles')) {
    welcomeTourStyleSheet.id = 'welcome-tour-styles';
    document.head.appendChild(welcomeTourStyleSheet);
  }
}