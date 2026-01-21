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

  test('old pricing tiers are not visible', async ({ page }) => {
    // Old tier names that should NOT be visible (exact names from old pricing)
    // Note: "Professional Portal" is our new tier name, not the old "Professional" tier
    const oldTierNames = [
      'Business',            // Old £400/month tier
      'Enterprise',          // Old £1200/month tier
      'Parish & Town',       // Old council tier
      'Parish and Town',     // Alternative spelling
      'District Council',    // Old council tier
      'Unitary & County',    // Old council tier
      'Unitary and County',  // Alternative spelling
    ];

    // Old tier prices that should NOT be visible
    const oldPrices = [
      '£150/month',   // Old Professional tier
      '£400/month',   // Old Business tier
      '£1200/month',  // Old Enterprise tier
      '£199/month',   // Old District Council tier
      '£499/month',   // Old Unitary & County tier
      '£49.99',       // Old individual price (now £50)
    ];

    // Check that none of the old tier names appear as card titles (h3)
    for (const oldTier of oldTierNames) {
      const oldTierCard = page.locator('h3').filter({ hasText: oldTier });
      await expect(oldTierCard).toHaveCount(0);
    }

    // Check that none of the old prices appear on the page
    for (const oldPrice of oldPrices) {
      const priceElement = page.locator(`text=${oldPrice}`);
      await expect(priceElement).toHaveCount(0);
    }

    console.log('Old pricing tiers are correctly removed from the page');
  });

  test('no false council count claims (40+)', async ({ page }) => {
    // We must NOT make false claims about council adoption
    // Previously the page said "Trusted by 40+ UK councils" which is false
    const falseClaimPatterns = [
      '40+ UK councils',
      '40+ councils',
      'Trusted by 40+',
      '40+',  // Any reference to 40+ in council context
    ];

    for (const claim of falseClaimPatterns) {
      // Search for these patterns in the page content
      const claimElements = page.locator(`text=${claim}`);
      const count = await claimElements.count();

      // If any match found, verify it's not in a council/trust context
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const element = claimElements.nth(i);
          const text = await element.textContent();
          // Fail if the text contains council-related claims
          if (text && (text.toLowerCase().includes('council') || text.toLowerCase().includes('trusted'))) {
            throw new Error(`Found false claim: "${text}"`);
          }
        }
      }
    }

    // Also check there's no specific "40+ UK councils" anywhere on the page
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('40+ UK councils');
    expect(pageContent).not.toContain('Trusted by 40+ councils');

    console.log('No false council count claims found on pricing page');
  });

  test('Public CTA links to /publish', async ({ page }) => {
    // Find the One-Off Publishing card
    const publicCard = page.locator('div').filter({ hasText: /One-Off Publishing/ }).first();

    // Find the CTA button within or near the public card section
    // The button text is "Publish Now - £50" and should link to /publish
    const publishCta = page.locator('a').filter({ hasText: 'Publish Now - £50' });
    await expect(publishCta).toBeVisible();

    // Verify the href is correct
    const href = await publishCta.getAttribute('href');
    expect(href).toBe('/publish');

    console.log('Public CTA correctly links to /publish');
  });

  test('Firms CTA links to sign-up?plan=firm', async ({ page }) => {
    // Find the "Start Free Trial" CTA button in the Professional Portal card
    // This should link to /sign-up?plan=firm
    const firmsCta = page.locator('a').filter({ hasText: 'Start Free Trial' });
    await expect(firmsCta).toBeVisible();

    // Verify the href is correct
    const href = await firmsCta.getAttribute('href');
    expect(href).toBe('/sign-up?plan=firm');

    console.log('Firms CTA correctly links to /sign-up?plan=firm');
  });
});
