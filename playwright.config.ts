import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Civic Notices E2E Tests
 *
 * Projects:
 * - default: Basic tests without authentication
 * - admin: Admin panel tests with admin auth state
 * - firm-owner: Firm portal tests as owner role
 * - firm-admin: Firm portal tests as admin role
 * - firm-editor: Firm portal tests as editor role
 * - firm-viewer: Firm portal tests as viewer role
 */

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI for now */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [['html', { open: 'never' }], ['list']],
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for different roles */
  projects: [
    /* Default project for unauthenticated tests */
    {
      name: 'default',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/firm-portal/**', '**/admin-panel/**'],
    },

    /* Admin panel tests */
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/admin-auth.json',
      },
      testMatch: '**/admin-panel/**',
      dependencies: ['admin-setup'],
    },

    /* Setup project for admin auth state */
    {
      name: 'admin-setup',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/global-setup.ts',
    },

    /* Firm portal tests - Owner role (full permissions) */
    {
      name: 'firm-owner',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/firm-owner-auth.json',
      },
      testMatch: '**/firm-portal/owner-*.spec.ts',
      dependencies: ['firm-setup'],
    },

    /* Firm portal tests - Admin role */
    {
      name: 'firm-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/firm-admin-auth.json',
      },
      testMatch: '**/firm-portal/admin-*.spec.ts',
      dependencies: ['firm-setup'],
    },

    /* Firm portal tests - Editor role */
    {
      name: 'firm-editor',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/firm-editor-auth.json',
      },
      testMatch: '**/firm-portal/editor-*.spec.ts',
      dependencies: ['firm-setup'],
    },

    /* Firm portal tests - Viewer role (read-only) */
    {
      name: 'firm-viewer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/firm-viewer-auth.json',
      },
      testMatch: '**/firm-portal/viewer-*.spec.ts',
      dependencies: ['firm-setup'],
    },

    /* Multi-tenant isolation tests (requires alternate firm user) */
    {
      name: 'firm-isolation',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.playwright/firm-owner-auth.json',
      },
      testMatch: '**/firm-portal/multi-tenant-*.spec.ts',
      dependencies: ['firm-setup'],
    },

    /* Setup project for firm auth states */
    {
      name: 'firm-setup',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/global-setup.ts',
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
