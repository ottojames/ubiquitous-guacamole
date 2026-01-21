/**
 * Pricing Page E2E Tests
 *
 * Tests the three-tier pricing structure:
 * - Public: £50/notice (no account)
 * - Firms: £49/month + £50/notice
 * - Councils: FREE portal + £19.99/notice
 */

import { test, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
  });

  test('displays three pricing cards', async ({ page }) => {
    // Find the pricing cards section
    const pricingSection = page.locator('section').filter({ hasText: 'Choose your plan' });
    await expect(pricingSection).toBeVisible();

    // Check for the three pricing card titles
    const publicCard = page.locator('h3').filter({ hasText: 'One-Off Publishing' });
    const firmsCard = page.locator('h3').filter({ hasText: 'Professional Portal' });
    const councilsCard = page.locator('h3').filter({ hasText: 'Council Portal' });

    await expect(publicCard).toBeVisible();
    await expect(firmsCard).toBeVisible();
    await expect(councilsCard).toBeVisible();

    console.log('All three pricing cards are visible');
  });
});
