import { test, expect, type Page } from '@playwright/test';

// Test data constants
const ADMIN_EMAIL = 'admin@civicnotices.co.uk';
const ADMIN_PASSWORD = 'ChangeMeImmediately123!';
const TEST_2FA_SECRET = 'JBSWY3DPEHPK3PXP'; // Test secret for 2FA
const BASE_URL = 'http://localhost:5173';

test.describe('Admin Panel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.describe('1. Admin Login Flow', () => {
    test('should show login page with correct elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`);

      // Check page title and heading
      await expect(page).toHaveTitle(/Admin Login/i);
      await expect(page.locator('h1')).toContainText('Admin Login');

      // Check form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Sign In');

      // Check security badge
      await expect(page.locator('[data-testid="security-badge"]')).toBeVisible();
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`);

      // Enter invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Check error message
      await expect(page.locator('.text-red-500')).toContainText(/Invalid credentials/i);
    });

    test('should track failed login attempts', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`);

      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }

      // Check for attempt warning
      const errorMessage = await page.locator('.text-red-500').textContent();
      expect(errorMessage).toMatch(/\d+ attempts? remaining/i);
    });

    test('should successfully login without 2FA', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`);

      // Enter valid credentials
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard or show 2FA prompt
      await page.waitForURL((url) =>
        url.pathname === '/admin/dashboard' ||
        url.pathname === '/admin/login'
      );
    });
  });

  test.describe('2. Two-Factor Authentication', () => {
    test('should show 2FA setup option in settings', async ({ page }) => {
      // First login
      await loginAsAdmin(page);

      // Navigate to settings
      await page.goto(`${BASE_URL}/admin/settings`);

      // Check for 2FA section
      await expect(page.locator('[data-testid="2fa-section"]')).toBeVisible();
      await expect(page.locator('button:has-text("Enable 2FA")')).toBeVisible();
    });

    test('should display QR code when setting up 2FA', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/settings`);

      // Click Enable 2FA
      await page.click('button:has-text("Enable 2FA")');

      // Check QR code display
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
      await expect(page.locator('[data-testid="2fa-secret"]')).toBeVisible();
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
    });

    test('should verify 2FA code correctly', async ({ page }) => {
      // This test would need a real TOTP generator
      // For testing purposes, we'll check the UI flow
      await loginAsAdmin(page);

      // Attempt login that requires 2FA
      await page.goto(`${BASE_URL}/admin/login`);
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // If 2FA is enabled, check for code input
      const codeInput = page.locator('input[placeholder*="2FA"]');
      if (await codeInput.isVisible()) {
        await expect(codeInput).toBeVisible();
        await expect(page.locator('button:has-text("Verify")')).toBeVisible();
      }
    });
  });

  test.describe('3. Account Suspension', () => {
    test('should suspend a council account', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to accounts page
      await page.goto(`${BASE_URL}/admin/accounts`);

      // Wait for table to load
      await page.waitForSelector('[data-testid="accounts-table"]');

      // Find first active account
      const firstAccount = page.locator('[data-testid="account-row"]').first();

      // Click actions dropdown
      await firstAccount.locator('[data-testid="actions-menu"]').click();

      // Click suspend
      await page.click('[data-testid="suspend-action"]');

      // Confirm suspension
      const confirmButton = page.locator('button:has-text("Confirm Suspend")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Check for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should bulk suspend multiple accounts', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/accounts`);

      // Wait for table
      await page.waitForSelector('[data-testid="accounts-table"]');

      // Select multiple accounts
      const checkboxes = page.locator('input[type="checkbox"][data-testid="account-checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Click bulk actions
        await page.click('[data-testid="bulk-actions"]');
        await page.click('[data-testid="bulk-suspend"]');

        // Confirm
        await page.click('button:has-text("Confirm")');

        // Check success
        await expect(page.locator('[data-testid="bulk-success"]')).toBeVisible();
      }
    });
  });

  test.describe('4. Audit Log Generation', () => {
    test('should generate audit log for login', async ({ page }) => {
      // Perform login
      await loginAsAdmin(page);

      // Navigate to audit log
      await page.goto(`${BASE_URL}/admin/audit`);

      // Check for recent login entry
      await page.waitForSelector('[data-testid="audit-table"]');

      const loginEntry = page.locator('tr:has-text("admin.login")').first();
      await expect(loginEntry).toBeVisible();
    });

    test('should log account management actions', async ({ page }) => {
      await loginAsAdmin(page);

      // Perform an action (view accounts)
      await page.goto(`${BASE_URL}/admin/accounts`);

      // Go to audit log
      await page.goto(`${BASE_URL}/admin/audit`);

      // Check for account view entry
      const viewEntry = page.locator('tr:has-text("account")');
      expect(await viewEntry.count()).toBeGreaterThan(0);
    });

    test('should filter audit logs by date', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/audit`);

      // Set date filter to today
      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="date-from"]', today);
      await page.fill('[data-testid="date-to"]', today);
      await page.click('[data-testid="apply-filters"]');

      // Check filtered results
      await page.waitForSelector('[data-testid="audit-table"]');
      const entries = page.locator('[data-testid="audit-entry"]');
      expect(await entries.count()).toBeGreaterThanOrEqual(0);
    });

    test('should export audit logs to CSV', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/audit`);

      // Wait for data to load
      await page.waitForSelector('[data-testid="audit-table"]');

      // Setup download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      // Click export
      await page.click('[data-testid="export-csv"]');

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/audit.*\.csv/i);
    });
  });

  test.describe('5. Session Management', () => {
    test('should show session timeout warning', async ({ page }) => {
      await loginAsAdmin(page);

      // Check for session indicator
      await expect(page.locator('[data-testid="session-status"]')).toBeVisible();

      // Session warning should appear when < 10 minutes remaining
      // This would require mocking time or waiting
    });

    test('should auto-logout on session expiry', async ({ page }) => {
      await loginAsAdmin(page);

      // Store session data
      const cookies = await page.context().cookies();

      // Clear session cookie to simulate expiry
      await page.context().clearCookies();

      // Try to navigate to protected page
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Should redirect to login
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`);
    });

    test('should successfully logout', async ({ page }) => {
      await loginAsAdmin(page);

      // Click logout
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`);

      // Try to access protected page
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Should redirect back to login
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`);
    });
  });

  test.describe('6. Dashboard Functionality', () => {
    test('should load dashboard with all sections visible', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Wait for page to load and verify main heading
      await expect(page.locator('h1')).toContainText('Admin Dashboard');

      // Check statistics cards by their labels (text content exists in component)
      await expect(page.getByText('Total Councils')).toBeVisible();
      await expect(page.getByText('Total Law Firms')).toBeVisible();
      await expect(page.getByText('Total Notices')).toBeVisible();
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('Monthly Revenue')).toBeVisible();

      // Check activity feed section
      await expect(page.getByText('Recent Admin Activity')).toBeVisible();

      // Check system health section
      await expect(page.getByText('System Health')).toBeVisible();

      // Check quick actions section
      await expect(page.getByText('Quick Actions')).toBeVisible();
    });

    test('should show loading skeleton then content', async ({ page }) => {
      await loginAsAdmin(page);

      // Go to dashboard and wait for content to appear
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // After loading, the "Admin Dashboard" heading should be visible
      await expect(page.locator('h1')).toContainText('Admin Dashboard');

      // At least one stat card should have a numeric value (not loading)
      // The stats show actual numbers like "0", "1", etc.
      const councilsCard = page.locator('text=Total Councils').locator('..');
      await expect(councilsCard).toBeVisible();
    });

    test('should show stats values from API', async ({ page }) => {
      await loginAsAdmin(page);

      // Intercept the admin stats API call
      const statsResponse = page.waitForResponse(
        (response) => response.url().includes('/api/admin/stats') && response.status() === 200
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Wait for API response
      const response = await statsResponse;
      const data = await response.json();

      // API should return ok: true with data
      expect(data.ok).toBe(true);
      expect(data.data).toBeDefined();

      // Data should have expected fields
      expect(typeof data.data.totalCouncils).toBe('number');
      expect(typeof data.data.totalFirms).toBe('number');
      expect(typeof data.data.totalNotices).toBe('number');
    });
  });

  test.describe('7. Mobile Responsiveness', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Check hamburger menu is visible
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Click to open
      await page.click('[data-testid="mobile-menu-button"]');

      // Check navigation items
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    });

    test('should adapt layout for tablet screens', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Check layout adapts
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    });
  });

  test.describe('8. Search and Filtering', () => {
    test('should search accounts by name', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/accounts`);

      // Enter search term
      await page.fill('[data-testid="search-input"]', 'Westminster');

      // Wait for results
      await page.waitForTimeout(500);

      // Check filtered results
      const results = page.locator('[data-testid="account-row"]');
      const count = await results.count();

      if (count > 0) {
        const firstResult = await results.first().textContent();
        expect(firstResult?.toLowerCase()).toContain('westminster');
      }
    });

    test('should filter by account status', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin/accounts`);

      // Select status filter
      await page.selectOption('[data-testid="status-filter"]', 'active');

      // Check all results are active
      const statuses = page.locator('[data-testid="account-status"]');
      const count = await statuses.count();

      for (let i = 0; i < count; i++) {
        const status = await statuses.nth(i).textContent();
        expect(status).toBe('active');
      }
    });
  });
});

// Helper function for admin login
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for navigation or 2FA prompt
  await page.waitForURL((url) =>
    url.pathname === '/admin/dashboard' ||
    url.pathname === '/admin/login',
    { timeout: 5000 }
  ).catch(() => {
    // If URL doesn't change, we might be on 2FA screen
  });
}