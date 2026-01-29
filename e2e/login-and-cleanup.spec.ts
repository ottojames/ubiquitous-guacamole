import { test, expect } from '@playwright/test';

/**
 * Login and Database Cleanup Test
 * Uses real credentials to login and verify access
 */

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174';

// Real credentials
const CREDENTIALS = {
  email: 'ottoclarke@icloud.com',
  password: 'AdminPass2026!'
};

test.describe('Login with Real Credentials', () => {
  test('Login to council portal', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click Council Portal tab if visible
    const councilPortalBtn = page.getByRole('button', { name: /council portal/i });
    if (await councilPortalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await councilPortalBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill credentials
    await page.fill('input[type="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"]', CREDENTIALS.password);

    await page.screenshot({ path: 'test-results/cleanup/login-filled.png', fullPage: true });

    // Submit
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    await page.screenshot({ path: 'test-results/cleanup/login-result.png', fullPage: true });

    // Check if we're logged in
    const loginSucceeded = currentUrl.includes('/c/') ||
                          currentUrl.includes('/dashboard') ||
                          currentUrl.includes('/f/');

    if (!loginSucceeded) {
      const errorElement = page.locator('[class*="error"], [role="alert"], .text-red');
      if (await errorElement.isVisible().catch(() => false)) {
        const errorText = await errorElement.textContent();
        console.log('Error message:', errorText);
      }
    }

    expect(loginSucceeded).toBe(true);
  });
});

test.describe('Check Current Database State', () => {
  test('List all notices in database', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/notices/search?limit=100`);
    const data = await response.json();

    console.log('\n=== NOTICES IN DATABASE ===');
    console.log(`Total notices: ${data.items?.length || 0}`);

    data.items?.forEach((notice: any, idx: number) => {
      console.log(`${idx + 1}. ID: ${notice.id}`);
      console.log(`   Name: ${notice.premisesName || notice.applicantName || 'Unknown'}`);
      console.log(`   Type: ${notice.noticeType}`);
      console.log(`   Council: ${notice.council_id || 'None'}`);
      console.log('');
    });
  });

  test('List all councils/organizations', async ({ request }) => {
    // Try to get organizations through a public endpoint
    const response = await request.get(`${API_BASE}/api/stats`);

    if (response.ok()) {
      const data = await response.json();
      console.log('\n=== PLATFORM STATS ===');
      console.log(JSON.stringify(data, null, 2));
    }
  });
});
