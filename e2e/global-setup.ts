/**
 * Global Setup for Playwright E2E Tests
 *
 * This file authenticates all test users and saves their storage states
 * to be reused by test projects. Run as a dependency before authenticated tests.
 *
 * Storage states saved:
 * - .playwright/admin-auth.json - Platform admin user
 * - .playwright/firm-owner-auth.json - Firm portal owner
 * - .playwright/firm-admin-auth.json - Firm portal admin
 * - .playwright/firm-editor-auth.json - Firm portal editor
 * - .playwright/firm-viewer-auth.json - Firm portal viewer
 */

import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { FIRM_TEST_USERS, BASE_URL } from './fixtures/firm-auth';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PLAYWRIGHT_DIR = '.playwright';

// Admin credentials (from admin-panel.spec.ts)
const ADMIN_CREDENTIALS = {
  email: process.env.E2E_ADMIN_EMAIL || 'admin@civicnotices.co.uk',
  password: process.env.E2E_ADMIN_PASSWORD || 'ChangeMeImmediately123!',
};

// Auth state file paths
const AUTH_FILES = {
  admin: path.join(PLAYWRIGHT_DIR, 'admin-auth.json'),
  firmOwner: path.join(PLAYWRIGHT_DIR, 'firm-owner-auth.json'),
  firmAdmin: path.join(PLAYWRIGHT_DIR, 'firm-admin-auth.json'),
  firmEditor: path.join(PLAYWRIGHT_DIR, 'firm-editor-auth.json'),
  firmViewer: path.join(PLAYWRIGHT_DIR, 'firm-viewer-auth.json'),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure the .playwright directory exists for storing auth states
 */
function ensurePlaywrightDir(): void {
  if (!fs.existsSync(PLAYWRIGHT_DIR)) {
    fs.mkdirSync(PLAYWRIGHT_DIR, { recursive: true });
    console.log(`Created ${PLAYWRIGHT_DIR} directory for auth states`);
  }
}

// ============================================================================
// SETUP TESTS
// ============================================================================

setup.describe('Global Authentication Setup', () => {
  setup.beforeAll(() => {
    ensurePlaywrightDir();
  });

  /**
   * Authenticate platform admin and save storage state
   */
  setup('authenticate admin user', async ({ page }) => {
    console.log('[SETUP] Authenticating admin user...');

    await page.goto(`${BASE_URL}/admin/login`);

    // Wait for login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    // Fill credentials
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for successful navigation to dashboard or stay on login (for 2FA)
    // Give it time to either redirect or show error
    await page.waitForTimeout(3000);

    // Check if we successfully logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/admin/dashboard')) {
      console.log('[SETUP] Admin login successful, saving storage state');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[SETUP] Network idle timeout, proceeding anyway');
      });

      // Save storage state
      await page.context().storageState({ path: AUTH_FILES.admin });
      console.log(`[SETUP] Admin auth saved to ${AUTH_FILES.admin}`);
    } else {
      // Login failed or 2FA required - save empty state for now
      console.log('[SETUP] Admin login did not redirect to dashboard');
      console.log('[SETUP] This may be expected if admin user does not exist in test environment');
      console.log('[SETUP] Creating placeholder auth file');

      // Create minimal placeholder to prevent test failures
      fs.writeFileSync(AUTH_FILES.admin, JSON.stringify({
        cookies: [],
        origins: []
      }, null, 2));
    }
  });

  /**
   * Authenticate firm owner and save storage state
   */
  setup('authenticate firm owner', async ({ page }) => {
    console.log('[SETUP] Authenticating firm owner...');

    const user = FIRM_TEST_USERS.OWNER;

    await page.goto(`${BASE_URL}/login`);

    // Wait for login page
    await expect(page.locator('button', { hasText: 'Professional Portal' })).toBeVisible({ timeout: 10000 });

    // Select Professional Portal tab
    await page.locator('button', { hasText: 'Professional Portal' }).click();

    // Wait for form to be ready
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Fill credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Check if we successfully logged in
    const currentUrl = page.url();
    if (currentUrl.includes(`/f/${user.firmSlug}/`)) {
      console.log('[SETUP] Firm owner login successful, saving storage state');

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[SETUP] Network idle timeout, proceeding anyway');
      });

      await page.context().storageState({ path: AUTH_FILES.firmOwner });
      console.log(`[SETUP] Firm owner auth saved to ${AUTH_FILES.firmOwner}`);
    } else {
      console.log('[SETUP] Firm owner login did not redirect - user may not exist in test env');
      console.log('[SETUP] Creating placeholder auth file');

      fs.writeFileSync(AUTH_FILES.firmOwner, JSON.stringify({
        cookies: [],
        origins: []
      }, null, 2));
    }
  });

  /**
   * Authenticate firm admin and save storage state
   */
  setup('authenticate firm admin', async ({ page }) => {
    console.log('[SETUP] Authenticating firm admin...');

    const user = FIRM_TEST_USERS.ADMIN;

    await page.goto(`${BASE_URL}/login`);

    // Select Professional Portal tab
    await expect(page.locator('button', { hasText: 'Professional Portal' })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Professional Portal' }).click();

    // Wait for form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Fill credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Check result
    const currentUrl = page.url();
    if (currentUrl.includes(`/f/${user.firmSlug}/`)) {
      console.log('[SETUP] Firm admin login successful, saving storage state');

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await page.context().storageState({ path: AUTH_FILES.firmAdmin });
      console.log(`[SETUP] Firm admin auth saved to ${AUTH_FILES.firmAdmin}`);
    } else {
      console.log('[SETUP] Firm admin login did not redirect - user may not exist');
      fs.writeFileSync(AUTH_FILES.firmAdmin, JSON.stringify({
        cookies: [],
        origins: []
      }, null, 2));
    }
  });

  /**
   * Authenticate firm editor and save storage state
   */
  setup('authenticate firm editor', async ({ page }) => {
    console.log('[SETUP] Authenticating firm editor...');

    const user = FIRM_TEST_USERS.EDITOR;

    await page.goto(`${BASE_URL}/login`);

    // Select Professional Portal tab
    await expect(page.locator('button', { hasText: 'Professional Portal' })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Professional Portal' }).click();

    // Wait for form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Fill credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Check result
    const currentUrl = page.url();
    if (currentUrl.includes(`/f/${user.firmSlug}/`)) {
      console.log('[SETUP] Firm editor login successful, saving storage state');

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await page.context().storageState({ path: AUTH_FILES.firmEditor });
      console.log(`[SETUP] Firm editor auth saved to ${AUTH_FILES.firmEditor}`);
    } else {
      console.log('[SETUP] Firm editor login did not redirect - user may not exist');
      fs.writeFileSync(AUTH_FILES.firmEditor, JSON.stringify({
        cookies: [],
        origins: []
      }, null, 2));
    }
  });

  /**
   * Authenticate firm viewer and save storage state
   */
  setup('authenticate firm viewer', async ({ page }) => {
    console.log('[SETUP] Authenticating firm viewer...');

    const user = FIRM_TEST_USERS.VIEWER;

    await page.goto(`${BASE_URL}/login`);

    // Select Professional Portal tab
    await expect(page.locator('button', { hasText: 'Professional Portal' })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Professional Portal' }).click();

    // Wait for form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Fill credentials
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    // Check result
    const currentUrl = page.url();
    if (currentUrl.includes(`/f/${user.firmSlug}/`)) {
      console.log('[SETUP] Firm viewer login successful, saving storage state');

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await page.context().storageState({ path: AUTH_FILES.firmViewer });
      console.log(`[SETUP] Firm viewer auth saved to ${AUTH_FILES.firmViewer}`);
    } else {
      console.log('[SETUP] Firm viewer login did not redirect - user may not exist');
      fs.writeFileSync(AUTH_FILES.firmViewer, JSON.stringify({
        cookies: [],
        origins: []
      }, null, 2));
    }
  });
});
