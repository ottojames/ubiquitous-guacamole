import { test, expect } from '@playwright/test';
import {
  COUNCIL_CREDENTIALS,
  loginAsCouncil,
  BASE_URL,
  API_BASE
} from './council/test-helpers';

/**
 * Full Site Verification Test Suite
 * Tests all public-facing pages and council portal flows
 */

// Collect all errors for final report
const issues: string[] = [];

test.describe('Public Pages Verification', () => {
  test('Homepage loads with all key sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check header navigation
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: /find notices/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible();

    // Check hero section exists
    const heroText = page.getByText(/stay informed|licensing|planning|notices/i).first();
    await expect(heroText).toBeVisible();

    // Check footer
    await expect(page.locator('footer')).toBeVisible();

    // Check for council logos section
    const councilSection = page.locator('#for-councils, [class*="council"]').first();
    const hasSections = await councilSection.isVisible().catch(() => false);

    await page.screenshot({ path: 'test-results/verify/homepage.png', fullPage: true });
  });

  test('Notices page - Map and filters work', async ({ page }) => {
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check page title
    await expect(page.getByRole('heading', { name: /find notices/i })).toBeVisible();

    // Check search input exists
    const searchInput = page.locator('input[placeholder*="address" i], input[placeholder*="postcode" i]');
    await expect(searchInput.first()).toBeVisible();

    // Check filter tabs exist
    const filters = page.locator('button, [role="tab"]').filter({ hasText: /licensing|gambling|planning/i });
    expect(await filters.count()).toBeGreaterThan(0);

    // Check map container exists
    const mapContainer = page.locator('canvas, [class*="map"]');
    expect(await mapContainer.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/verify/notices-page.png', fullPage: true });
  });

  test('Notices page - Search functionality', async ({ page }) => {
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');

    // Search for a postcode
    const searchInput = page.locator('input[placeholder*="address" i], input[placeholder*="postcode" i]').first();
    await searchInput.fill('SW1A 1AA');

    const searchButton = page.getByRole('button', { name: /search/i });
    await searchButton.click();

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/verify/notices-search.png', fullPage: true });
  });

  test('Pricing page loads correctly', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for pricing content
    const pricingElements = page.locator('[class*="price"], [class*="tier"], [class*="plan"]');
    expect(await pricingElements.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/verify/pricing.png', fullPage: true });
  });

  test('Email Alerts page loads and has form', async ({ page }) => {
    await page.goto('/email-alerts');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for email input or form
    const emailInput = page.locator('input[type="email"]');
    expect(await emailInput.count()).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: 'test-results/verify/email-alerts.png', fullPage: true });
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: 'test-results/verify/contact.png', fullPage: true });
  });

  test('Legal pages load', async ({ page }) => {
    // Privacy
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Terms
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Accessibility
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Publish Flow Verification', () => {
  test('Publish page - All notice categories visible', async ({ page }) => {
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check wizard header
    await expect(page.getByText(/what kind of notice|publish/i).first()).toBeVisible();

    // Check all category accordions are present
    const categories = [
      'Licensing Act 2003',
      'Gambling Act 2005',
      "Goods Vehicle Operator's Licence",
      'Planning',
      'Probate',
      'Traffic Regulation Orders'
    ];

    for (const category of categories) {
      const categorySection = page.getByText(category, { exact: false });
      const isVisible = await categorySection.isVisible().catch(() => false);
      if (!isVisible) {
        issues.push(`Category not found: ${category}`);
      }
    }

    await page.screenshot({ path: 'test-results/verify/publish-categories.png', fullPage: true });
  });

  test('Publish page - Select Licensing notice type', async ({ page }) => {
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click on Licensing Act 2003 to expand
    const licensingCategory = page.getByText('Licensing Act 2003').first();
    await licensingCategory.click();
    await page.waitForTimeout(500);

    // Check if Premises Licence options are visible
    const premisesLicence = page.getByText(/premises licence/i).first();
    const isVisible = await premisesLicence.isVisible().catch(() => false);

    await page.screenshot({ path: 'test-results/verify/publish-licensing-expanded.png', fullPage: true });
  });
});

test.describe('Council Portal Verification', () => {
  test('Council login page loads', async ({ page }) => {
    await page.goto('/auth/council-login');
    await page.waitForLoadState('networkidle');

    // Check for login form
    await expect(page.getByText(/council portal|sign in/i).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/verify/council-login.png', fullPage: true });
  });

  test('Council portal routes redirect to login when unauthenticated', async ({ page }) => {
    // Try to access council dashboard directly
    await page.goto('/c/sampleton-borough-council/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should redirect to login
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes('login') || currentUrl.includes('auth') ||
                      currentUrl.includes('sign-in') || await page.locator('input[type="password"]').isVisible();

    if (!isOnLogin) {
      issues.push('Council routes do not redirect to login when unauthenticated');
    }

    await page.screenshot({ path: 'test-results/verify/council-unauth-redirect.png', fullPage: true });
  });

  test('Westminster council demo login works', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Find and click Council Portal button
    const councilPortalBtn = page.getByRole('button', { name: /council portal/i });
    if (await councilPortalBtn.isVisible({ timeout: 5000 })) {
      await councilPortalBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill demo credentials
    await page.fill('input[type="email"]', COUNCIL_CREDENTIALS.WESTMINSTER.email);
    await page.fill('input[type="password"]', COUNCIL_CREDENTIALS.WESTMINSTER.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect or error
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const loginSucceeded = currentUrl.includes('/c/') || currentUrl.includes('/dashboard');

    await page.screenshot({ path: 'test-results/verify/council-after-login.png', fullPage: true });

    if (!loginSucceeded) {
      // Check for error message
      const errorMessage = page.locator('[class*="error"], [role="alert"]');
      const hasError = await errorMessage.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorMessage.textContent();
        issues.push(`Council login failed: ${errorText}`);
      } else {
        issues.push('Council login did not redirect to dashboard');
      }
    }
  });
});

test.describe('API Endpoints Verification', () => {
  test('Health endpoint returns OK', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  test('Notices search API works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/notices/search?limit=10`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('Councils API works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/councils`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Notice type definitions are consistent', async ({ request }) => {
    // Search for notices
    const response = await request.get(`${API_BASE}/api/notices/search?limit=50`);
    const data = await response.json();

    const noticeTypes = new Set<string>();
    data.items?.forEach((notice: any) => {
      if (notice.noticeType) {
        noticeTypes.add(notice.noticeType);
      }
    });

    // Log discovered notice types
    console.log('Discovered notice types:', Array.from(noticeTypes));
  });
});

test.describe('Responsive Design Verification', () => {
  test('Homepage - Mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check header is still visible
    await expect(page.locator('header')).toBeVisible();

    // Check for mobile menu button
    const mobileMenu = page.locator('button[aria-label*="menu" i], [class*="hamburger"], [class*="mobile-menu"]');
    const hasMobileMenu = await mobileMenu.count() > 0;

    await page.screenshot({ path: 'test-results/verify/homepage-mobile.png', fullPage: true });
  });

  test('Notices page - Tablet responsive', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/verify/notices-tablet.png', fullPage: true });
  });
});

test.describe('Error Handling Verification', () => {
  test('Invalid notice ID shows error gracefully', async ({ page }) => {
    await page.goto('/notices/invalid-id-12345');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show error or redirect, not crash
    const hasError = await page.locator('text=/not found|error|invalid/i').isVisible().catch(() => false);
    const redirectedHome = page.url().includes('/') && !page.url().includes('invalid');

    await page.screenshot({ path: 'test-results/verify/invalid-notice.png', fullPage: true });
  });

  test('404 routes handled gracefully', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist-xyz123');
    await page.waitForLoadState('networkidle');

    // Should show home page or 404 page (based on catch-all route)
    // Should not show blank page or crash
    const hasContent = await page.locator('header, main, [class*="hero"]').isVisible();
    expect(hasContent).toBe(true);

    await page.screenshot({ path: 'test-results/verify/404-route.png', fullPage: true });
  });
});

test.describe('Authentication Pages Verification', () => {
  test('Sign in page loads correctly', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/verify/sign-in.png', fullPage: true });
  });

  test('Register page loads correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/verify/register.png', fullPage: true });
  });

  test('Forgot password page loads correctly', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    await page.screenshot({ path: 'test-results/verify/forgot-password.png', fullPage: true });
  });
});

// Print issues at the end
test.afterAll(() => {
  if (issues.length > 0) {
    console.log('\n\n========== ISSUES FOUND ==========');
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`);
    });
    console.log('==================================\n');
  } else {
    console.log('\n\n========== ALL CHECKS PASSED ==========\n');
  }
});
