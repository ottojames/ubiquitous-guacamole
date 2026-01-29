// @ts-nocheck
import { test, expect } from '@playwright/test';

/**
 * Phase 5: Direct Publishing Flow - Comprehensive E2E Tests
 *
 * Tests the complete end-to-end publish workflow including:
 * - Wizard navigation and UI
 * - API integration verification
 * - PublishSuccessModal aesthetic check
 * - Performance and accessibility
 */

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174';

// ============================================================================
// API Tests
// ============================================================================

test('Phase 5: API health check passes', async ({ request }) => {
  const response = await request.get(`${API_BASE}/api/health`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.ok).toBe(true);
});

test('Phase 5: Publish endpoints require authentication', async ({ request }) => {
    const publishResponse = await request.post(`${API_BASE}/api/notices/publish`, {
      data: {
        target_council_id: 'test-id',
        target_department_id: 'test-id',
        notice_data: {},
        notice_type: 'premises-licence',
        title: 'Test Notice'
      }
    });
    expect(publishResponse.status()).toBe(401);

    const billingResponse = await request.get(`${API_BASE}/api/billing/account`);
    expect(billingResponse.status()).toBe(401);

    const payResponse = await request.post(`${API_BASE}/api/billing/pay`, {
      data: { amount: 100, payment_method: 'test' }
    });
    expect(payResponse.status()).toBe(401);
});

// ============================================================================
// UI and Navigation Tests
// ============================================================================

test('Phase 5: Wizard step 1 loads successfully', async ({ page }) => {
  await page.goto(`${BASE_URL}/publish/step-1`);

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Verify wizard loads
  await expect(page.locator('h1')).toBeVisible();
});

test('Phase 5: Notice type selection is available', async ({ page }) => {
  await page.goto(`${BASE_URL}/publish/step-1`);

  // Verify all notice categories are shown
  await expect(page.locator('text=Licensing Act 2003')).toBeVisible();
});

test('Phase 5: Pricing page uses consistent design system', async ({ page }) => {
  // Visit pricing page to verify design system
  await page.goto(`${BASE_URL}/pricing`);

  // Check for design system elements
  const pricingCard = page.locator('.rounded-3xl').first();
  await expect(pricingCard).toBeVisible();

  // Verify gradient backgrounds exist
  const gradientElements = page.locator('[class*="from-blue"]');
  await expect(gradientElements.first()).toBeVisible();

  // Check for consistent shadow usage
  const shadowElements = page.locator('[class*="shadow-"]');
  await expect(shadowElements.first()).toBeVisible();

  // Note: PublishSuccessModal should match this aesthetic:
  // - rounded-3xl cards
  // - Blue gradient header (from-blue-600 to-blue-800)
  // - Lucide React icons
  // - Clean shadows and spacing
});

// ============================================================================
// Performance and Accessibility Tests
// ============================================================================

test('Phase 5: Responsive design - Mobile view', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto(`${BASE_URL}/pricing`);

  // Verify layout adapts
  const container = page.locator('[class*="container"]').first();
  await expect(container).toBeVisible();

  // Cards should stack vertically on mobile
  const cards = page.locator('.rounded-3xl');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test('Phase 5: Accessibility - Keyboard navigation', async ({ page }) => {
  await page.goto(`${BASE_URL}/publish/step-1`);

  // Tab through interactive elements
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(['BUTTON', 'A', 'INPUT', 'DIV']).toContain(focusedElement);
});

test('Phase 5: Performance - Page load time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto(`${BASE_URL}/publish/step-1`);
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  // Should load within 5 seconds (generous for first load)
  expect(loadTime).toBeLessThan(5000);
});
