/**
 * Multi-role Auth Fixtures for Firm Portal E2E Tests
 *
 * Defines test users for each firm portal role to test RBAC permissions.
 * These users should exist in the test database with appropriate memberships.
 */

import { type Page, expect } from '@playwright/test';

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

// ============================================================================
// TEST USER DEFINITIONS
// ============================================================================

export interface FirmTestUser {
  email: string;
  password: string;
  role: 'owner' | 'org_admin' | 'officer' | 'viewer';
  displayRole: string;
  firmSlug: string;
  firmName: string;
  permissions: {
    canCreateNotices: boolean;
    canEditNotices: boolean;
    canDeleteNotices: boolean;
    canPublishNotices: boolean;
    canManageTeam: boolean;
    canManageTemplates: boolean;
    canManageBilling: boolean;
    canViewAudit: boolean;
    canDragKanban: boolean;
  };
}

/**
 * Test users for firm portal E2E tests
 * All users belong to the same test firm for isolation testing
 */
export const FIRM_TEST_USERS: Record<string, FirmTestUser> = {
  OWNER: {
    email: 'owner@testfirm.co.uk',
    password: 'TestFirmOwner123!',
    role: 'owner',
    displayRole: 'Owner',
    firmSlug: 'test-firm-e2e',
    firmName: 'Test Firm E2E',
    permissions: {
      canCreateNotices: true,
      canEditNotices: true,
      canDeleteNotices: true,
      canPublishNotices: true,
      canManageTeam: true,
      canManageTemplates: true,
      canManageBilling: true,
      canViewAudit: true,
      canDragKanban: true,
    },
  },
  ADMIN: {
    email: 'admin@testfirm.co.uk',
    password: 'TestFirmAdmin123!',
    role: 'org_admin',
    displayRole: 'Administrator',
    firmSlug: 'test-firm-e2e',
    firmName: 'Test Firm E2E',
    permissions: {
      canCreateNotices: true,
      canEditNotices: true,
      canDeleteNotices: true,
      canPublishNotices: true,
      canManageTeam: true,
      canManageTemplates: true,
      canManageBilling: false, // Only owner can manage billing
      canViewAudit: true,
      canDragKanban: true,
    },
  },
  EDITOR: {
    email: 'editor@testfirm.co.uk',
    password: 'TestFirmEditor123!',
    role: 'officer',
    displayRole: 'Editor',
    firmSlug: 'test-firm-e2e',
    firmName: 'Test Firm E2E',
    permissions: {
      canCreateNotices: true,
      canEditNotices: true,
      canDeleteNotices: false,
      canPublishNotices: true,
      canManageTeam: false,
      canManageTemplates: false, // Can view but not create/edit
      canManageBilling: false,
      canViewAudit: false,
      canDragKanban: true,
    },
  },
  VIEWER: {
    email: 'viewer@testfirm.co.uk',
    password: 'TestFirmViewer123!',
    role: 'viewer',
    displayRole: 'Viewer',
    firmSlug: 'test-firm-e2e',
    firmName: 'Test Firm E2E',
    permissions: {
      canCreateNotices: false,
      canEditNotices: false,
      canDeleteNotices: false,
      canPublishNotices: false,
      canManageTeam: false,
      canManageTemplates: false,
      canManageBilling: false,
      canViewAudit: false,
      canDragKanban: false,
    },
  },
};

// Alternate firm for multi-tenant isolation tests
export const ALTERNATE_FIRM_USER: FirmTestUser = {
  email: 'owner@otherfirm.co.uk',
  password: 'OtherFirmOwner123!',
  role: 'owner',
  displayRole: 'Owner',
  firmSlug: 'other-firm-e2e',
  firmName: 'Other Firm E2E',
  permissions: {
    canCreateNotices: true,
    canEditNotices: true,
    canDeleteNotices: true,
    canPublishNotices: true,
    canManageTeam: true,
    canManageTemplates: true,
    canManageBilling: true,
    canViewAudit: true,
    canDragKanban: true,
  },
};

// ============================================================================
// AUTH HELPER FUNCTIONS
// ============================================================================

/**
 * Login as a firm user via the Professional Portal
 */
export async function loginAsFirmUser(
  page: Page,
  user: FirmTestUser
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);

  // Select Professional Portal tab
  const firmPortalButton = page.locator('button', { hasText: 'Professional Portal' });
  await expect(firmPortalButton).toBeVisible({ timeout: 10000 });
  await firmPortalButton.click();

  // Fill credentials
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to firm dashboard
  await page.waitForURL(new RegExp(`/f/${user.firmSlug}/`), { timeout: 15000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify logged in by checking for dashboard or sidebar content
  const navContent = page.locator('nav a, nav button').filter({ hasText: /dashboard|notices|clients/i }).first();
  await expect(navContent).toBeVisible({ timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logoutFirmUser(page: Page): Promise<void> {
  // Look for logout/sign out button in sidebar or header
  const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Log out"), button:has-text("Logout")').first();

  if (await logoutButton.isVisible({ timeout: 3000 })) {
    await logoutButton.click();
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
  } else {
    // Fallback: navigate directly to login which should clear auth
    await page.goto(`${BASE_URL}/login`);
  }
}

/**
 * Navigate to firm dashboard
 */
export async function navigateToFirmDashboard(page: Page, firmSlug: string): Promise<void> {
  await page.goto(`${BASE_URL}/f/${firmSlug}/dashboard`);
  await expect(page).toHaveURL(new RegExp(`/f/${firmSlug}/dashboard`), { timeout: 10000 });
}

/**
 * Navigate to firm notices (Kanban view)
 */
export async function navigateToFirmNotices(page: Page, firmSlug: string): Promise<void> {
  await page.goto(`${BASE_URL}/f/${firmSlug}/notices`);
  await expect(page).toHaveURL(new RegExp(`/f/${firmSlug}/notices`), { timeout: 10000 });
}

/**
 * Navigate to firm templates
 */
export async function navigateToFirmTemplates(page: Page, firmSlug: string): Promise<void> {
  await page.goto(`${BASE_URL}/f/${firmSlug}/templates`);
  await expect(page).toHaveURL(new RegExp(`/f/${firmSlug}/templates`), { timeout: 10000 });
}

/**
 * Navigate to firm team management
 */
export async function navigateToFirmTeam(page: Page, firmSlug: string): Promise<void> {
  await page.goto(`${BASE_URL}/f/${firmSlug}/team`);
  await expect(page).toHaveURL(new RegExp(`/f/${firmSlug}/team`), { timeout: 10000 });
}

/**
 * Get the current user's firm slug from the URL
 */
export function getFirmSlugFromUrl(url: string): string | null {
  const match = url.match(/\/f\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Assert user is on their firm portal (not another firm's)
 */
export async function assertOnCorrectFirm(page: Page, expectedSlug: string): Promise<void> {
  const currentUrl = page.url();
  const actualSlug = getFirmSlugFromUrl(currentUrl);
  expect(actualSlug).toBe(expectedSlug);
}

/**
 * Assert user cannot access another firm's portal
 */
export async function assertCannotAccessOtherFirm(
  page: Page,
  otherFirmSlug: string
): Promise<void> {
  await page.goto(`${BASE_URL}/f/${otherFirmSlug}/dashboard`);

  // Should either redirect to login or show access denied
  await page.waitForTimeout(2000);
  const currentUrl = page.url();

  // Should not be on the other firm's dashboard
  expect(currentUrl).not.toMatch(new RegExp(`/f/${otherFirmSlug}/dashboard`));
}
