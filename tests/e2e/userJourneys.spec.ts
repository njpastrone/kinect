// Playwright E2E tests for Kinect user journeys
import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3001/api';

// Demo credentials
const DEMO_CREDENTIALS = {
  email: 'demo.active@kinect.app',
  password: 'demo123',
};

// Helper function to login
async function loginAsDemo(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', DEMO_CREDENTIALS.email);
  await page.fill('[data-testid="password-input"]', DEMO_CREDENTIALS.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

// Setup test data before each test
test.beforeEach(async ({ page, request }) => {
  // Seed database with test data
  try {
    await request.post(`${API_URL}/dev/reset-and-seed`, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.warn('Could not seed database:', error);
  }
});

test.describe('User Authentication', () => {
  test('should login with demo credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill login form
    await page.fill('[data-testid="email-input"]', DEMO_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', DEMO_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

    // Should show user name in header
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Alex');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('[data-testid="email-input"]', 'invalid@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsDemo(page);

    // Click logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('should display dashboard statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should show contact statistics
    await expect(page.locator('[data-testid="total-contacts"]')).toBeVisible();
    await expect(page.locator('[data-testid="overdue-contacts"]')).toBeVisible();
    await expect(page.locator('[data-testid="due-soon-contacts"]')).toBeVisible();

    // Should show upcoming reminders section
    await expect(page.locator('[data-testid="upcoming-reminders"]')).toBeVisible();
  });

  test('should navigate to contacts from dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Click on contacts navigation
    await page.click('[data-testid="contacts-nav-link"]');

    await expect(page).toHaveURL(`${BASE_URL}/contacts`);
  });
});

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);
  });

  test('should display contact lists and contacts', async ({ page }) => {
    // Should show contact lists in sidebar
    await expect(page.locator('[data-testid="contact-list-item"]')).toHaveCount(3); // Assuming 3 lists

    // Should show contacts in main area
    await expect(page.locator('[data-testid="contact-card"]').first()).toBeVisible();

    // Contact cards should show essential info
    const firstContact = page.locator('[data-testid="contact-card"]').first();
    await expect(firstContact.locator('[data-testid="contact-name"]')).toBeVisible();
    await expect(firstContact.locator('[data-testid="contact-list"]')).toBeVisible();
    await expect(firstContact.locator('[data-testid="reminder-badge"]')).toBeVisible();
  });

  test('should create a new contact', async ({ page }) => {
    // Click add contact button
    await page.click('[data-testid="add-contact-button"]');

    // Fill contact form
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');
    await page.fill('[data-testid="phone-input"]', '+1-555-TEST');
    await page.fill('[data-testid="email-input"]', 'john.doe@test.com');
    await page.selectOption('[data-testid="list-select"]', 'Friends');
    await page.fill('[data-testid="notes-input"]', 'Test contact from E2E test');

    // Save contact
    await page.click('[data-testid="save-contact-button"]');

    // Should close modal and show new contact
    await expect(page.locator('[data-testid="contact-modal"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="contact-name"]').filter({ hasText: 'John Doe' })
    ).toBeVisible();
  });

  test('should edit an existing contact', async ({ page }) => {
    // Click on first contact
    await page.click('[data-testid="contact-card"]').first();

    // Click edit button
    await page.click('[data-testid="edit-contact-button"]');

    // Modify contact details
    await page.fill('[data-testid="notes-input"]', 'Updated notes from E2E test');

    // Save changes
    await page.click('[data-testid="save-contact-button"]');

    // Should show updated information
    await expect(page.locator('[data-testid="contact-notes"]')).toContainText(
      'Updated notes from E2E test'
    );
  });

  test('should log communication with contact', async ({ page }) => {
    // Click on first contact
    await page.click('[data-testid="contact-card"]').first();

    // Click log contact button
    await page.click('[data-testid="log-contact-button"]');

    // Fill communication log
    await page.selectOption('[data-testid="communication-type-select"]', 'PHONE_CALL');
    await page.fill('[data-testid="communication-notes-input"]', 'Had a great conversation');

    // Save log entry
    await page.click('[data-testid="save-log-button"]');

    // Should update last contact date
    await expect(page.locator('[data-testid="last-contact-date"]')).toContainText('Today');

    // Should show in communication history
    await expect(page.locator('[data-testid="communication-log"]')).toContainText(
      'Had a great conversation'
    );
  });

  test('should delete a contact', async ({ page }) => {
    // Get initial contact count
    const initialCount = await page.locator('[data-testid="contact-card"]').count();

    // Click on first contact
    await page.click('[data-testid="contact-card"]').first();

    // Click delete button
    await page.click('[data-testid="delete-contact-button"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Should have one less contact
    await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(initialCount - 1);
  });
});

test.describe('Contact Lists', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);
  });

  test('should create a new contact list', async ({ page }) => {
    // Click add list button
    await page.click('[data-testid="add-list-button"]');

    // Fill list form
    await page.fill('[data-testid="list-name-input"]', 'Test List');
    await page.fill('[data-testid="list-description-input"]', 'Created from E2E test');

    // Save list
    await page.click('[data-testid="save-list-button"]');

    // Should appear in sidebar
    await expect(
      page.locator('[data-testid="contact-list-item"]').filter({ hasText: 'Test List' })
    ).toBeVisible();
  });

  test('should filter contacts by list', async ({ page }) => {
    // Click on specific list
    await page.click('[data-testid="contact-list-item"]').first();

    // Should only show contacts from that list
    const listName = await page.locator('[data-testid="contact-list-item"]').first().textContent();
    await expect(page.locator('[data-testid="active-list-name"]')).toContainText(listName || '');
  });
});

test.describe('Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);
  });

  test('should search contacts by name', async ({ page }) => {
    // Type in search box
    await page.fill('[data-testid="search-input"]', 'Emma');

    // Should show filtered results
    const visibleContacts = page.locator('[data-testid="contact-card"]:visible');
    await expect(visibleContacts.first().locator('[data-testid="contact-name"]')).toContainText(
      'Emma'
    );
  });

  test('should filter by contact list', async ({ page }) => {
    // Select list filter
    await page.selectOption('[data-testid="list-filter"]', 'Best Friends');

    // Should only show contacts from Best Friends list
    const visibleContacts = page.locator('[data-testid="contact-card"]:visible');
    const listBadges = visibleContacts.locator('[data-testid="contact-list"]');

    // All visible contacts should be in Best Friends list
    const count = await listBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(listBadges.nth(i)).toContainText('Best Friends');
    }
  });
});

test.describe('Reminder System', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('should display reminder badges correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`);

    // Should have contacts with different reminder statuses
    const overdueContacts = page.locator('[data-testid="reminder-badge"][data-status="overdue"]');
    const dueSoonContacts = page.locator('[data-testid="reminder-badge"][data-status="due-soon"]');
    const recentContacts = page.locator('[data-testid="reminder-badge"][data-status="recent"]');

    // At least one of each type should exist (based on seed data)
    await expect(overdueContacts.first()).toBeVisible();
    await expect(dueSoonContacts.first()).toBeVisible();
    await expect(recentContacts.first()).toBeVisible();
  });

  test('should update reminder status after logging contact', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`);

    // Find an overdue contact
    const overdueContact = page
      .locator('[data-testid="contact-card"]')
      .filter({ has: page.locator('[data-testid="reminder-badge"][data-status="overdue"]') })
      .first();

    await overdueContact.click();

    // Log recent communication
    await page.click('[data-testid="log-contact-button"]');
    await page.selectOption('[data-testid="communication-type-select"]', 'PHONE_CALL');
    await page.click('[data-testid="save-log-button"]');

    // Go back to contacts list
    await page.goto(`${BASE_URL}/contacts`);

    // Contact should no longer be overdue
    const contactName = await overdueContact.locator('[data-testid="contact-name"]').textContent();
    const updatedContact = page
      .locator('[data-testid="contact-name"]')
      .filter({ hasText: contactName || '' });
    const parentCard = updatedContact.locator('..');

    await expect(
      parentCard.locator('[data-testid="reminder-badge"][data-status="recent"]')
    ).toBeVisible();
  });
});

test.describe('Demo Mode', () => {
  test('should activate demo mode automatically', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Login with demo credentials
    await page.fill('[data-testid="email-input"]', DEMO_CREDENTIALS.email);
    await page.fill('[data-testid="password-input"]', DEMO_CREDENTIALS.password);
    await page.click('[data-testid="login-button"]');

    // Should show demo banner
    await expect(page.locator('[data-testid="demo-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="demo-banner"]')).toContainText('Demo Mode');
  });

  test('should show guided tour for new users', async ({ page }) => {
    // Clear tour completion flag
    await page.evaluate(() => localStorage.removeItem('hasSeenDemoTour'));

    await loginAsDemo(page);

    // Should show tour automatically
    await expect(page.locator('[data-testid="guided-tour"]')).toBeVisible();

    // Should be able to navigate through tour
    await page.click('[data-testid="tour-next-button"]');
    await page.click('[data-testid="tour-next-button"]');

    // Should be able to finish tour
    await page.click('[data-testid="tour-finish-button"]');

    await expect(page.locator('[data-testid="guided-tour"]')).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);

    // Mobile navigation should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Desktop sidebar should be hidden
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

    // Should be able to open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);

    // Should show desktop-like layout
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();

    // Contact grid should adapt to width
    const contactGrid = page.locator('[data-testid="contact-grid"]');
    await expect(contactGrid).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load dashboard within performance budget', async ({ page }) => {
    await loginAsDemo(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large contact lists efficiently', async ({ page, request }) => {
    await loginAsDemo(page);

    // Generate bulk contacts
    await request.post(`${API_URL}/dev/generate-bulk-contacts`, {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`,
        'Content-Type': 'application/json',
      },
      data: { count: 50 },
    });

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/contacts`);
    await page.waitForSelector('[data-testid="contact-card"]');
    const loadTime = Date.now() - startTime;

    // Should still load efficiently with many contacts
    expect(loadTime).toBeLessThan(2000);

    // Should show pagination or virtual scrolling
    const contacts = page.locator('[data-testid="contact-card"]');
    const visibleCount = await contacts.count();

    // Should not render all 50+ contacts at once
    expect(visibleCount).toBeLessThanOrEqual(20);
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await loginAsDemo(page);

    // Simulate network failure
    await page.route('**/api/**', (route) => route.abort());

    await page.goto(`${BASE_URL}/contacts`);

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
  });

  test('should validate form inputs', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto(`${BASE_URL}/contacts`);

    // Try to create contact with invalid data
    await page.click('[data-testid="add-contact-button"]');

    // Submit without required fields
    await page.click('[data-testid="save-contact-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="first-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-name-error"]')).toBeVisible();
  });
});
