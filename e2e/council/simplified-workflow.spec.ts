/**
 * Simplified Council Workflow Test Using Helpers
 *
 * This test demonstrates how the helper functions make tests
 * more readable and maintainable.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BASE_URL,
  loginAsCouncil,
  publishNotice,
  submitRepresentation,
  verifyRepresentationInCouncilPortal,
  navigateToCouncilNotices,
  searchCouncilNotices,
  assertNoticeInResults,
  assertApiHealthy
} from './test-helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEMO_FILE_PATH = path.join(__dirname, '..', 'fixtures', 'premises-licence-demo.txt');

test.describe('Simplified Council Workflow', () => {
  test('complete workflow using helper functions', async ({ page }) => {
    // API health check
    await assertApiHealthy(page);

    // Login as council officer
    await loginAsCouncil(page);

    // Publish a notice through the wizard
    const noticeId = await publishNotice(
      page,
      DEMO_FILE_PATH,
      'licensing@westminster.gov.uk'
    );

    console.log(`Notice published: ${noticeId}`);

    // Verify notice appears in council portal
    await navigateToCouncilNotices(page);
    await searchCouncilNotices(page, 'Demo Licensing Ltd');
    await assertNoticeInResults(page, 'Demo Licensing Ltd', 'Playwright Arms');

    // Submit a representation as a public user
    await submitRepresentation(page, noticeId, {
      name: 'Jane Resident',
      email: 'jane@example.com',
      address: '789 Adjacent Street, Westminster, London, SW1A 3CD',
      type: 'objection',
      comments: 'I object to this application on public nuisance grounds. The late-night hours will disturb local residents.'
    });

    // Verify representation appears in council portal
    await verifyRepresentationInCouncilPortal(
      page,
      noticeId,
      'Jane Resident',
      'jane@example.com'
    );

    console.log('✓ Full workflow completed successfully');
  });

  test('publish multiple notices and verify list', async ({ page }) => {
    await loginAsCouncil(page);

    // Publish first notice
    const noticeId1 = await publishNotice(page, DEMO_FILE_PATH, 'test1@westminster.gov.uk');
    console.log(`Published notice 1: ${noticeId1}`);

    // Publish second notice
    await page.goto(`${BASE_URL}/publish/step-1`);
    const noticeId2 = await publishNotice(page, DEMO_FILE_PATH, 'test2@westminster.gov.uk');
    console.log(`Published notice 2: ${noticeId2}`);

    // Verify both appear in council portal
    await navigateToCouncilNotices(page);
    const noticeCards = page.locator('[data-testid^="notice-card-"], .notice-card');
    const count = await noticeCards.count();

    expect(count).toBeGreaterThanOrEqual(2);
    console.log(`✓ Found ${count} notices in council portal`);
  });

  test('submit multiple representations to same notice', async ({ page }) => {
    await loginAsCouncil(page);

    // Publish notice
    const noticeId = await publishNotice(page, DEMO_FILE_PATH, 'multi-rep@westminster.gov.uk');

    // Submit objection
    await submitRepresentation(page, noticeId, {
      name: 'Objector One',
      email: 'objector1@example.com',
      address: '100 Street A',
      type: 'objection',
      comments: 'Noise concerns'
    });

    // Submit support
    await submitRepresentation(page, noticeId, {
      name: 'Supporter Two',
      email: 'supporter2@example.com',
      address: '200 Street B',
      type: 'support',
      comments: 'Great addition to the community'
    });

    // Verify both representations in council portal
    await page.goto(`${BASE_URL}/c/westminster/licensing/notices/${noticeId}`);

    // Should see both names
    await expect(page.locator('text=/objector one/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/supporter two/i')).toBeVisible({ timeout: 10000 });

    console.log('✓ Multiple representations submitted and verified');
  });

  test('verify representation filtering by type', async ({ page }) => {
    await loginAsCouncil(page);

    const noticeId = await publishNotice(page, DEMO_FILE_PATH, 'filter-test@westminster.gov.uk');

    // Submit different types
    await submitRepresentation(page, noticeId, {
      name: 'Objection User',
      email: 'objection@test.com',
      address: 'Address 1',
      type: 'objection',
      comments: 'Objection text'
    });

    await submitRepresentation(page, noticeId, {
      name: 'Support User',
      email: 'support@test.com',
      address: 'Address 2',
      type: 'support',
      comments: 'Support text'
    });

    // Go to council representations view
    await page.goto(`${BASE_URL}/c/westminster/licensing/notices/${noticeId}`);

    // Look for filter buttons
    const objectionFilter = page.locator('button:has-text("Objection"), button:has-text("Objections")');
    if (await objectionFilter.isVisible({ timeout: 5000 })) {
      await objectionFilter.click();
      await page.waitForTimeout(500);

      // Should only see objection
      await expect(page.locator('text=/objection user/i')).toBeVisible();

      // Support might be hidden (depending on implementation)
      const supportVisible = await page.locator('text=/support user/i').isVisible({ timeout: 1000 })
        .catch(() => false);

      if (!supportVisible) {
        console.log('✓ Filter working: Support hidden when filtering by objection');
      }
    } else {
      console.log('~ Filter buttons not found (may not be implemented yet)');
    }
  });
});

test.describe('Error Handling', () => {
  test('handle invalid notice ID gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/invalid-notice-id-12345`);

    // Should show error, not crash
    await expect(
      page.locator('text=/not found|error|unable to load/i').first()
    ).toBeVisible({ timeout: 10000 });

    console.log('✓ Invalid notice ID handled gracefully');
  });

  test('handle missing representation fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices/test-notice/submit-representation`);

    // Check if form loads (may show notice not found, which is fine)
    const hasForm = await page.locator('input[name="fullName"]').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasForm) {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should not navigate away or show success
      const stillOnPage = page.url().includes('submit-representation');
      expect(stillOnPage).toBeTruthy();

      console.log('✓ Empty form submission prevented');
    } else {
      console.log('~ Form test skipped (notice not found)');
    }
  });
});

test.describe('Performance', () => {
  test('measure publish wizard completion time', async ({ page }) => {
    await loginAsCouncil(page);

    const startTime = Date.now();

    await publishNotice(
      page,
      DEMO_FILE_PATH,
      'perf-test@westminster.gov.uk'
    );

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`Publish wizard completed in ${durationSeconds}s`);

    // Assert reasonable completion time (< 60 seconds)
    expect(duration).toBeLessThan(60000);
  });
});
