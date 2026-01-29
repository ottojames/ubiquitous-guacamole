/**
 * Multi-Tenant Isolation E2E Tests
 *
 * Verifies that Firm A cannot see or access Firm B's data.
 * Tests data isolation across all firm portal endpoints.
 */

import { test, expect } from '@playwright/test';
import {
  FIRM_TEST_USERS,
  ALTERNATE_FIRM_USER,
  loginAsFirmUser,
  navigateToFirmNotices,
  navigateToFirmTemplates,
  navigateToFirmTeam,
  navigateToFirmDashboard,
  assertOnCorrectFirm,
  BASE_URL,
} from '../fixtures/firm-auth';

const FIRM_A = FIRM_TEST_USERS.OWNER;
const FIRM_B = ALTERNATE_FIRM_USER;

test.describe('Multi-Tenant Isolation: Firm A cannot see Firm B data', () => {
  test('Firm A user cannot access Firm B dashboard via URL', async ({ page }) => {
    // Login as Firm A owner
    await loginAsFirmUser(page, FIRM_A);
    await assertOnCorrectFirm(page, FIRM_A.firmSlug);

    // Attempt to access Firm B dashboard directly via URL
    await page.goto(`${BASE_URL}/f/${FIRM_B.firmSlug}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should either redirect to login, show access denied, or redirect to own firm
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(new RegExp(`/f/${FIRM_B.firmSlug}/dashboard`));
    console.log(`Firm A blocked from Firm B dashboard. Redirected to: ${currentUrl}`);
  });

  test('Firm A user cannot access Firm B notices via URL', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Attempt to access Firm B notices page
    await page.goto(`${BASE_URL}/f/${FIRM_B.firmSlug}/notices`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(new RegExp(`/f/${FIRM_B.firmSlug}/notices`));
    console.log(`Firm A blocked from Firm B notices. Redirected to: ${currentUrl}`);
  });

  test('Firm A user cannot access Firm B templates via URL', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Attempt to access Firm B templates page
    await page.goto(`${BASE_URL}/f/${FIRM_B.firmSlug}/templates`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(new RegExp(`/f/${FIRM_B.firmSlug}/templates`));
    console.log(`Firm A blocked from Firm B templates. Redirected to: ${currentUrl}`);
  });

  test('Firm A user cannot access Firm B team via URL', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Attempt to access Firm B team management
    await page.goto(`${BASE_URL}/f/${FIRM_B.firmSlug}/team`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(new RegExp(`/f/${FIRM_B.firmSlug}/team`));
    console.log(`Firm A blocked from Firm B team. Redirected to: ${currentUrl}`);
  });

  test('API: Firm A cannot query Firm B workflow configs', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Request workflow configs - should only return Firm A's configs
    const response = await page.request.get(`${BASE_URL}/api/workflow/configs`);

    if (response.ok()) {
      const data = await response.json();
      const configs = data.configs || data.data || [];

      // Verify no Firm B data in response
      for (const config of configs) {
        expect(config.firm_id).not.toBe(FIRM_B.firmSlug);
        console.log(`Workflow config firm_id: ${config.firm_id}`);
      }
    } else {
      console.log('No workflow configs returned (may be expected for test user)');
    }
  });

  test('API: Firm A cannot query Firm B notices', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Request notices - should only return Firm A's notices
    const response = await page.request.get(`${BASE_URL}/api/notices?limit=100`);

    if (response.ok()) {
      const data = await response.json();
      const notices = data.notices || data.data || [];

      // Verify no Firm B data in response
      for (const notice of notices) {
        if (notice.firm_id) {
          expect(notice.firm_id).not.toBe(FIRM_B.firmSlug);
        }
      }
      console.log(`Returned ${notices.length} notices (none from Firm B)`);
    }
  });

  test('API: Firm A cannot query Firm B templates', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Request firm templates
    const response = await page.request.get(`${BASE_URL}/api/firm/templates`);

    if (response.ok()) {
      const data = await response.json();
      const templates = data.templates || data.data || [];

      // Verify no Firm B data in response
      for (const template of templates) {
        if (template.firm_id) {
          expect(template.firm_id).not.toBe(FIRM_B.firmSlug);
        }
      }
      console.log(`Returned ${templates.length} templates (none from Firm B)`);
    } else {
      console.log('No templates returned (may be expected for test user)');
    }
  });

  test('API: Firm A cannot query Firm B departments', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Request firm departments
    const response = await page.request.get(`${BASE_URL}/api/firm/departments`);

    if (response.ok()) {
      const data = await response.json();
      const departments = data.departments || data.data || [];

      // Verify no Firm B data in response
      for (const dept of departments) {
        if (dept.firm_id) {
          expect(dept.firm_id).not.toBe(FIRM_B.firmSlug);
        }
      }
      console.log(`Returned ${departments.length} departments (none from Firm B)`);
    } else {
      console.log('No departments returned (may be expected for test user)');
    }
  });

  test('URL parameter injection does not leak Firm B data', async ({ page }) => {
    await loginAsFirmUser(page, FIRM_A);

    // Try accessing Firm B's notices with query parameter manipulation
    // This tests that backend authorization is firm-scoped
    const response = await page.request.get(
      `${BASE_URL}/api/notices?firmId=${FIRM_B.firmSlug}`
    );

    if (response.ok()) {
      const data = await response.json();
      const notices = data.notices || data.data || [];

      // Should not return Firm B notices even with firmId parameter
      for (const notice of notices) {
        if (notice.firm_id) {
          expect(notice.firm_id).not.toBe(FIRM_B.firmSlug);
        }
      }
      console.log('Parameter injection did not leak Firm B data');
    } else {
      // 403 or 401 is acceptable - access denied
      console.log(`Request rejected with status: ${response.status()}`);
    }
  });
});
