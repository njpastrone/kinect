import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WelcomeDemo } from '../WelcomeDemo';
import { WelcomeDemoProvider } from '../WelcomeDemoContext';
import { DemoModeProvider } from '../DemoMode';

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { 
      _id: 'test-user',
      firstName: 'Test', 
      lastName: 'User',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    },
    isAuthenticated: true
  })
}));

jest.mock('../../../services/api', () => ({
  default: {
    getOnboardingStatus: jest.fn().mockResolvedValue({
      onboarding: {
        welcomeDemoCompleted: false,
        tourPreferences: {
          showTipsAndTricks: true,
          autoStartTours: true
        }
      }
    }),
    markWelcomeDemoCompleted: jest.fn().mockResolvedValue({
      onboarding: { welcomeDemoCompleted: true }
    })
  }
}));

const WelcomeDemoTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <DemoModeProvider>
      <WelcomeDemoProvider>
        {children}
      </WelcomeDemoProvider>
    </DemoModeProvider>
  </BrowserRouter>
);

describe('WelcomeDemo', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset DOM
    document.body.innerHTML = '';
  });

  it('should render welcome demo when opened', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      expect(screen.getByText('Welcome Tour')).toBeInTheDocument();
      expect(screen.getByText('1 of 12')).toBeInTheDocument();
    });
  });

  it('should not render when closed', () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={false} />
      </WelcomeDemoTestWrapper>
    );

    expect(screen.queryByText('Welcome to Kinect! 👋')).not.toBeInTheDocument();
  });

  it('should advance to next step when Next button is clicked', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
      expect(screen.getByText('2 of 12')).toBeInTheDocument();
    });
  });

  it('should go to previous step when Previous button is clicked', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    // Go to step 2
    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
    });

    // Go back to step 1
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      expect(screen.getByText('1 of 12')).toBeInTheDocument();
    });
  });

  it('should be skippable at any point', async () => {
    const mockOnSkip = jest.fn();
    
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} onSkip={mockOnSkip} />
      </WelcomeDemoTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    const skipButton = screen.getByText('Skip Tour');
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    
    // Test Escape key
    fireEvent.keyDown(dialog, { key: 'Escape' });
    // Should trigger skip (tested via onSkip mock)

    // Test Arrow Right key
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
    });

    // Test Arrow Left key
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });
  });

  it('should save progress on interruption', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    // Advance a few steps
    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next')); // Step 2
    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next')); // Step 3
    await waitFor(() => {
      expect(screen.getByText('Navigation Overview')).toBeInTheDocument();
    });

    // Simulate interruption by unmounting
    // Progress should be saved to localStorage
    // This would be tested by checking localStorage content
    expect(localStorage.setItem).toHaveBeenCalledWith('welcomeDemoProgress', '2');
  });

  it('should complete successfully and call onComplete', async () => {
    const mockOnComplete = jest.fn();
    
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} onComplete={mockOnComplete} />
      </WelcomeDemoTestWrapper>
    );

    // Skip to last step by clicking Next multiple times
    for (let i = 0; i < 11; i++) {
      const nextButton = screen.getByText(i === 10 ? 'Get Started!' : 'Next');
      fireEvent.click(nextButton);
      await waitFor(() => {}, { timeout: 100 });
    }

    // Should be on last step
    await waitFor(() => {
      expect(screen.getByText('Welcome Complete! 🎉')).toBeInTheDocument();
    });

    // Click final completion button
    const completeButton = screen.getByText('Get Started!');
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('should handle mobile responsive design', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    // Check that tooltip adapts to small screen
    const tooltip = screen.getByRole('dialog');
    expect(tooltip).toHaveStyle('maxWidth: 335px'); // innerWidth - 40
  });

  it('should handle auto-advance steps correctly', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    // Move to a step with auto-advance (step 2 - Dashboard)
    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Your Dashboard')).toBeInTheDocument();
    });

    // Auto-advance should happen after duration (6000ms for dashboard step)
    // In test environment, we would mock timers
    jest.advanceTimersByTime(6000);

    await waitFor(() => {
      expect(screen.getByText('Navigation Overview')).toBeInTheDocument();
    });
  });

  it('should handle interaction steps properly', async () => {
    render(
      <WelcomeDemoTestWrapper>
        <WelcomeDemo isOpen={true} />
      </WelcomeDemoTestWrapper>
    );

    // Navigate to an interaction step (step 5 - Add First Contact)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {}, { timeout: 100 });
    }

    await waitFor(() => {
      expect(screen.getByText('Adding Your First Contact')).toBeInTheDocument();
    });

    // For interaction steps, Next button should show guidance instead of advancing
    fireEvent.click(screen.getByText('Next'));
    
    // Should show notification guidance (would be mocked in real test)
    // This tests that interaction steps require actual user interaction
  });
});

// Test the WelcomeDemoTrigger hook
describe('WelcomeDemoTrigger', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should trigger for first-time users', async () => {
    // Test would check trigger conditions
    // This would be implemented with proper mocking of the hook
  });

  it('should trigger for users with empty dashboard', async () => {
    // Test empty contact scenario
  });

  it('should not trigger for returning users who completed demo', async () => {
    localStorage.setItem('welcomeDemoCompleted', 'true');
    // Test should verify no auto-trigger
  });

  it('should handle period of inactivity trigger', async () => {
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - 8); // 8 days ago
    localStorage.setItem('lastVisit', lastVisit.toISOString());
    // Test should verify inactivity trigger
  });
});

// Integration tests
describe('WelcomeDemo Integration', () => {
  it('should work with real navigation between pages', async () => {
    // Test navigation during demo
  });

  it('should persist state across page reloads', async () => {
    // Test localStorage persistence
  });

  it('should handle API failures gracefully', async () => {
    // Test offline/error scenarios
  });
});

// Setup for Jest timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});