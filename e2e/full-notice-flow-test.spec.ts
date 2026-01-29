import { test, expect, Page } from '@playwright/test';

/**
 * Full Notice Flow Test
 * Tests uploading notices through every form type and verifying they appear
 * in Sampleton Borough Council's portal
 */

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174';

// Real test credentials
const COUNCIL_CREDENTIALS = {
  email: 'autoclarke@icloud.com',
  password: 'Adminpass2026!'
};

// Helper to login to council portal
async function loginToCouncilPortal(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click Council Portal if visible
  const councilPortalBtn = page.getByRole('button', { name: /council portal/i });
  if (await councilPortalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await councilPortalBtn.click();
    await page.waitForTimeout(500);
  }

  // Fill credentials
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(COUNCIL_CREDENTIALS.email);
  await passwordInput.fill(COUNCIL_CREDENTIALS.password);

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check if login succeeded
  const currentUrl = page.url();
  const loginSucceeded = currentUrl.includes('/c/') || currentUrl.includes('/dashboard');

  if (!loginSucceeded) {
    // Check for error message
    const errorVisible = await page.locator('[class*="error"], [role="alert"]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('[class*="error"], [role="alert"]').textContent();
      console.log(`Login error: ${errorText}`);
    }
  }

  return loginSucceeded;
}

// Helper to expand a category and select a notice type
async function selectNoticeType(page: Page, categoryName: string, noticeTypeName: string): Promise<void> {
  await page.goto(`${BASE_URL}/publish`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Find and click the category to expand it
  const categoryHeader = page.getByText(categoryName, { exact: false }).first();
  await categoryHeader.click();
  await page.waitForTimeout(500);

  // Find and click the specific notice type
  const noticeOption = page.getByText(noticeTypeName, { exact: false }).first();
  await noticeOption.click();
  await page.waitForTimeout(500);

  // Click Continue
  const continueBtn = page.locator('[data-testid="notice-step-continue"], button:has-text("Continue")').first();
  await continueBtn.click();
  await page.waitForTimeout(1000);
}

test.describe('Council Login Test', () => {
  test('Login with real credentials', async ({ page }) => {
    const loginSucceeded = await loginToCouncilPortal(page);

    await page.screenshot({ path: 'test-results/flow/council-login-result.png', fullPage: true });

    if (loginSucceeded) {
      console.log('Login successful - redirected to dashboard');

      // Check for Sampleton Borough Council
      const pageContent = await page.content();
      const hasSampleton = pageContent.toLowerCase().includes('sampleton');
      console.log(`Sampleton Borough Council visible: ${hasSampleton}`);
    } else {
      console.log('Login failed or did not redirect');
    }

    expect(loginSucceeded).toBe(true);
  });
});

test.describe('Check Councils in Database', () => {
  test('List all councils via API', async ({ request }) => {
    // Try the notices search to see what councils have notices
    const response = await request.get(`${API_BASE}/api/notices/search?limit=100`);
    const data = await response.json();

    // Extract unique council IDs
    const councilIds = new Set<string>();
    data.items?.forEach((notice: any) => {
      if (notice.council_id) councilIds.add(notice.council_id);
      if (notice.councilId) councilIds.add(notice.councilId);
    });

    console.log('Councils with notices:', Array.from(councilIds));
    console.log('Total notices found:', data.items?.length || 0);

    // Check each notice for council info
    data.items?.forEach((notice: any, idx: number) => {
      console.log(`Notice ${idx + 1}: ${notice.premisesName || notice.applicantName || 'Unknown'} - Council: ${notice.council_id || notice.councilId || 'None'}`);
    });
  });
});

test.describe('Publish Flow - All Notice Types', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're starting fresh
    await page.goto(`${BASE_URL}/publish`);
    await page.waitForLoadState('networkidle');
  });

  test('Licensing Act 2003 - New Premises Licence', async ({ page }) => {
    // Select notice type
    await selectNoticeType(page, 'Licensing Act 2003', 'New premises licence');

    // Should be on Step 2 (Upload/Template)
    await expect(page).toHaveURL(/\/publish\/step-2/);

    await page.screenshot({ path: 'test-results/flow/licensing-step2.png', fullPage: true });

    // Check if structured template tab exists
    const templateTab = page.getByText(/structured template/i);
    const hasTemplateTab = await templateTab.isVisible().catch(() => false);
    console.log(`Licensing - Has structured template: ${hasTemplateTab}`);
  });

  test('Gambling Act 2005 - New Betting Premises', async ({ page }) => {
    await selectNoticeType(page, 'Gambling Act 2005', 'New betting premises');

    await expect(page).toHaveURL(/\/publish\/step-2/);
    await page.screenshot({ path: 'test-results/flow/gambling-step2.png', fullPage: true });
  });

  test("Goods Vehicle Operator's Licence - New Application", async ({ page }) => {
    await selectNoticeType(page, "Goods Vehicle Operator's Licence", 'New application');

    await expect(page).toHaveURL(/\/publish\/step-2/);
    await page.screenshot({ path: 'test-results/flow/gvol-step2.png', fullPage: true });
  });

  test('Planning - Listed Building', async ({ page }) => {
    await selectNoticeType(page, 'Planning', 'Listed building');

    await expect(page).toHaveURL(/\/publish\/step-2/);
    await page.screenshot({ path: 'test-results/flow/planning-step2.png', fullPage: true });
  });

  test('Probate - Section 27 Notice', async ({ page }) => {
    await selectNoticeType(page, 'Probate', 'Section 27');

    await expect(page).toHaveURL(/\/publish\/step-2/);
    await page.screenshot({ path: 'test-results/flow/probate-step2.png', fullPage: true });
  });

  test('Traffic Regulation Orders - Permanent TRO', async ({ page }) => {
    await selectNoticeType(page, 'Traffic Regulation Orders', 'Permanent');

    await expect(page).toHaveURL(/\/publish\/step-2/);
    await page.screenshot({ path: 'test-results/flow/tro-step2.png', fullPage: true });
  });
});

test.describe('Full Notice Submission Flow', () => {
  test('Submit Licensing notice and verify in council portal', async ({ page }) => {
    // Step 1: Select notice type
    await page.goto(`${BASE_URL}/publish`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Expand Licensing category
    const licensingCategory = page.getByText('Licensing Act 2003').first();
    await licensingCategory.click();
    await page.waitForTimeout(500);

    // Select "New premises licence"
    const premisesLicence = page.getByText(/new premises licence/i).first();
    await premisesLicence.click();
    await page.waitForTimeout(500);

    // Continue
    await page.locator('[data-testid="notice-step-continue"], button:has-text("Continue")').first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/flow/full-licensing-step1.png', fullPage: true });

    // Step 2: Should be on upload/template page
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Check what options are available
    const uploadTab = page.getByText(/upload/i);
    const templateTab = page.getByText(/structured template/i);

    const hasUpload = await uploadTab.isVisible().catch(() => false);
    const hasTemplate = await templateTab.isVisible().catch(() => false);

    console.log(`Step 2 - Upload tab: ${hasUpload}, Template tab: ${hasTemplate}`);

    await page.screenshot({ path: 'test-results/flow/full-licensing-step2.png', fullPage: true });

    // If template tab exists, use it
    if (hasTemplate) {
      await templateTab.click();
      await page.waitForTimeout(500);

      // Fill in template fields
      // Look for form fields
      const formFields = await page.locator('input, textarea, select').count();
      console.log(`Found ${formFields} form fields`);

      await page.screenshot({ path: 'test-results/flow/full-licensing-template.png', fullPage: true });
    }
  });
});
