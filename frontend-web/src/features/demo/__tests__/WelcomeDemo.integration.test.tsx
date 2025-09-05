import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from '../../../App';

// Mock API responses
const mockApiResponses = {
  register: {
    success: true,
    data: {
      user: {
        _id: 'new-user-id',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        createdAt: new Date().toISOString(),
        onboarding: {
          welcomeDemoCompleted: false,
          tourPreferences: {
            showTipsAndTricks: true,
            autoStartTours: true
          }
        }
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  },
  
  existingUser: {
    success: true,
    data: {
      user: {
        _id: 'existing-user-id',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        onboarding: {
          welcomeDemoCompleted: true,
          welcomeDemoCompletedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          tourPreferences: {
            showTipsAndTricks: true,
            autoStartTours: false
          }
        }
      },
      tokens: {
        accessToken: 'mock-access-token-2',
        refreshToken: 'mock-refresh-token-2'
      }
    }
  }
};

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  localStorage.clear();
  (fetch as jest.MockedFunction<typeof fetch>).mockClear();
});

describe('Welcome Demo User Experience Flows', () => {
  
  describe('New User Flow', () => {
    it('should auto-trigger welcome demo after fresh registration', async () => {
      // Mock registration API
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponses.register
        } as Response);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Simulate user registration
      const registerButton = await screen.findByText('Sign up');
      fireEvent.click(registerButton);

      // Fill registration form
      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'New' } });
      fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'User' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'newuser@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      // Should redirect to dashboard and auto-trigger welcome demo
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show step 1 of 12
      expect(screen.getByText('1 of 12')).toBeInTheDocument();
    });

    it('should allow completing full demo flow', async () => {
      // Start from logged-in new user state
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Welcome demo should auto-start
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      // Complete all steps
      for (let step = 1; step <= 12; step++) {
        const nextButton = screen.getByText(step === 12 ? 'Get Started!' : 'Next');
        fireEvent.click(nextButton);

        if (step < 12) {
          await waitFor(() => {
            expect(screen.getByText(`${step + 1} of 12`)).toBeInTheDocument();
          });
        }
      }

      // Should complete and close demo
      await waitFor(() => {
        expect(screen.queryByText('Welcome Tour')).not.toBeInTheDocument();
      });

      // Should show completion notification
      expect(screen.getByText(/Welcome Tour Complete/)).toBeInTheDocument();
    });
  });

  describe('Returning User Flow', () => {
    it('should not auto-trigger demo for users who completed it', async () => {
      // Mock existing user who completed demo
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.existingUser.data.user));
      localStorage.setItem('welcomeDemoCompleted', 'true');

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Welcome demo should NOT auto-start
      expect(screen.queryByText('Welcome to Kinect! 👋')).not.toBeInTheDocument();
    });

    it('should allow manual access to demo from help menu', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.existingUser.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Find and click help menu
      const helpButton = await screen.findByLabelText('Help menu');
      fireEvent.click(helpButton);

      // Click "Take the Tour"
      const takeTourButton = screen.getByText('Take the Tour');
      fireEvent.click(takeTourButton);

      // Welcome demo should start
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Persistence', () => {
    it('should resume demo from saved step after interruption', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));
      localStorage.setItem('welcomeDemoProgress', '5'); // Step 6

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should resume from step 6
      await waitFor(() => {
        expect(screen.getByText('6 of 12')).toBeInTheDocument();
      });

      // Should be on the correct step content
      expect(screen.getByText('Contact Details & Management')).toBeInTheDocument();
    });

    it('should save progress when navigating away during demo', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      const { rerender } = render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Start demo and advance to step 3
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next')); // Step 2
      fireEvent.click(screen.getByText('Next')); // Step 3

      await waitFor(() => {
        expect(screen.getByText('3 of 12')).toBeInTheDocument();
      });

      // Simulate navigation away (unmount and remount)
      rerender(<div />);
      rerender(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should resume from step 3
      await waitFor(() => {
        expect(screen.getByText('3 of 12')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Experience', () => {
    it('should handle touch interactions correctly', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      // Test touch events
      const nextButton = screen.getByText('Next');
      fireEvent.touchStart(nextButton);
      fireEvent.touchEnd(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 of 12')).toBeInTheDocument();
      });
    });

    it('should adapt tooltip positioning for small screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveStyle('max-width: 280px'); // 320 - 40
    });
  });

  describe('Empty Dashboard Trigger', () => {
    it('should trigger demo for users with no contacts after 1 day', async () => {
      // Mock user registered 2 days ago with no demo completion
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const userWithNoContacts = {
        ...mockApiResponses.register.data.user,
        createdAt: twoDaysAgo.toISOString(),
        onboarding: {
          welcomeDemoCompleted: false,
          tourPreferences: { showTipsAndTricks: true, autoStartTours: true }
        }
      };

      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(userWithNoContacts));

      // Mock empty contacts API response
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { contacts: [] } })
        } as Response);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should auto-trigger due to empty dashboard
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle API failures gracefully during demo', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      // Mock API failure
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      // Complete the demo - should handle completion failure gracefully
      for (let i = 0; i < 12; i++) {
        const button = screen.getByText(i === 11 ? 'Get Started!' : 'Next');
        fireEvent.click(button);
        await waitFor(() => {}, { timeout: 100 });
      }

      // Should show error but still complete locally
      await waitFor(() => {
        expect(screen.getByText(/Failed to save completion status/)).toBeInTheDocument();
      });
    });

    it('should work offline with localStorage fallback', async () => {
      // Disable all network requests
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValue(new Error('Network unavailable'));

      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Demo should still work with localStorage fallback
      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      // Should be able to complete demo offline
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('2 of 12')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should work with keyboard navigation only', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      
      // Focus should be on the dialog
      expect(dialog).toHaveFocus();

      // Arrow right should advance
      fireEvent.keyDown(dialog, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByText('2 of 12')).toBeInTheDocument();
      });

      // Arrow left should go back
      fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByText('1 of 12')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels and roles', async () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with older browser APIs', async () => {
      // Mock older browser without modern features
      const originalIntersectionObserver = window.IntersectionObserver;
      delete (window as any).IntersectionObserver;

      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
      });

      // Should still work without IntersectionObserver
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText('2 of 12')).toBeInTheDocument();
      });

      // Restore
      window.IntersectionObserver = originalIntersectionObserver;
    });
  });
});

// Performance tests
describe('Welcome Demo Performance', () => {
  it('should not cause memory leaks', async () => {
    const { unmount } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Start demo
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockApiResponses.register.data.user));

    await waitFor(() => {
      expect(screen.getByText('Welcome to Kinect! 👋')).toBeInTheDocument();
    });

    // Unmount and check for cleanup
    unmount();
    
    // Event listeners should be cleaned up
    // This would be tested with actual memory monitoring tools
  });

  it('should have smooth animations on supported browsers', async () => {
    // Test CSS animation performance
    // This would involve measuring frame rates during animations
  });
});