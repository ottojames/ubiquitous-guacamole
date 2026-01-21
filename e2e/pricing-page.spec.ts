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

  test('displays correct prices (£50, £49, FREE, £19.99)', async ({ page }) => {
    // Public card: £50/notice
    const publicPrice = page.locator('text=£50').first();
    await expect(publicPrice).toBeVisible();
    const publicPerNotice = page.locator('text=/notice').first();
    await expect(publicPerNotice).toBeVisible();

    // Firms card: £49/month + £50 per notice
    const firmsMonthlyPrice = page.locator('text=£49').first();
    await expect(firmsMonthlyPrice).toBeVisible();
    const firmsMonthly = page.locator('text=/month').first();
    await expect(firmsMonthly).toBeVisible();
    // Check for the "+ £50 per notice" text in the firms card pricing section
    const firmsPlusNotice = page.locator('.mt-1.text-sm.text-slate-500').filter({ hasText: '+ £50 per notice' });
    await expect(firmsPlusNotice).toBeVisible();

    // Councils card: FREE + £19.99 per notice
    const freeText = page.locator('span').filter({ hasText: 'FREE' }).first();
    await expect(freeText).toBeVisible();
    // Check for the £19.99 price text in the councils card pricing section
    const councilNoticePrice = page.locator('.mt-1.text-sm.text-slate-500').filter({ hasText: '£19.99 per notice' });
    await expect(councilNoticePrice).toBeVisible();

    console.log('All prices are correct: £50/notice, £49/month + £50/notice, FREE + £19.99/notice');
  });
});
