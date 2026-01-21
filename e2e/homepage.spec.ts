/**
 * Homepage E2E Tests
 *
 * Tests the homepage hero section, stats, CTAs, and mobile layout.
 * Verifies correct pricing (£50/notice), no false council claims,
 * and that the stats API returns real data.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('hero displays correct pricing: £50 per notice', async ({ page }) => {
    // Check the hero h1 contains the correct pricing
    const heroHeading = page.locator('h1').filter({ hasText: 'Publish legal notices digitally. £50 per notice.' });
    await expect(heroHeading).toBeVisible();

    // Check the subtitle mentions digital notices and audit trail
    const heroSubtitle = page.locator('p').filter({ hasText: 'Replace expensive newspaper ads with instant digital notices' });
    await expect(heroSubtitle).toBeVisible();

    // Check for the audit trail mention
    const auditTrailText = page.locator('text=Full audit trail included');
    await expect(auditTrailText).toBeVisible();

    console.log('Hero displays correct pricing: £50 per notice');
  });

  test('publish CTA links to /publish with correct text', async ({ page }) => {
    // Find the main publish CTA button
    const publishCta = page.locator('a').filter({ hasText: 'Publish a Notice - £50' });
    await expect(publishCta).toBeVisible();

    // Verify the href is correct
    const href = await publishCta.getAttribute('href');
    expect(href).toBe('/publish');

    console.log('Publish CTA correctly links to /publish with £50 price');
  });

  test('no false council count claims (40+, specific numbers)', async ({ page }) => {
    // We must NOT make false claims about council adoption
    const pageContent = await page.textContent('body');

    // Check there's no "40+ UK councils" or similar false claims
    expect(pageContent).not.toContain('40+ UK councils');
    expect(pageContent).not.toContain('Trusted by 40+ councils');
    expect(pageContent).not.toContain('40+ councils');

    // Check there's no specific council count in testimonials section
    // The testimonials badge should say "What our users say" not "Trusted by X UK councils"
    const testimonialsSection = page.locator('section').filter({ hasText: 'What our users say' });
    await expect(testimonialsSection).toBeVisible();

    // Verify the testimonials don't claim specific numbers
    const testimonialsBadge = page.locator('span').filter({ hasText: 'What our users say' });
    await expect(testimonialsBadge).toBeVisible();

    console.log('No false council count claims found');
  });

  test('stats load from API and display', async ({ page }) => {
    // Wait for stats to load - they come from /api/stats
    // The stats are displayed in badges: notices, comments, councils
    // Check that the badges exist and have numbers (not dashes or "undefined")

    // Wait for stats API to complete
    await page.waitForResponse(response =>
      response.url().includes('/api/stats') && response.status() === 200
    );

    // Find the stats badges by their container text
    const noticesBadge = page.locator('.text-blue-600\\/70').filter({ hasText: 'notices' });
    const commentsBadge = page.locator('.text-slate-600\\/70').filter({ hasText: 'comments' });
    const councilsBadge = page.locator('.text-emerald-600\\/70').filter({ hasText: 'councils' });

    // Verify all stats badges are visible
    await expect(noticesBadge).toBeVisible();
    await expect(commentsBadge).toBeVisible();
    await expect(councilsBadge).toBeVisible();

    // Get the stats values - they should be numbers, not "—" or "undefined"
    const statsContainer = page.locator('.flex.flex-wrap.items-center.justify-center.gap-4').first();
    const statsText = await statsContainer.textContent();

    // Should not contain the fallback dash character or undefined
    expect(statsText).not.toContain('—');
    expect(statsText).not.toContain('undefined');

    console.log('Stats loaded from API successfully');
  });

  test('no broken images on homepage', async ({ page }) => {
    // Find all images on the page
    const images = page.locator('img');
    const imageCount = await images.count();

    // Check each image for broken state
    const brokenImages: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);

      // Check if image is visible (not hidden due to onError)
      const isVisible = await img.isVisible();
      if (!isVisible) {
        continue; // Hidden images are OK (might be intentionally hidden via onError)
      }

      // Check the naturalWidth - broken images have naturalWidth === 0
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth === 0) {
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        brokenImages.push(`${src || 'no src'} (alt: ${alt || 'no alt'})`);
      }
    }

    // Fail if any broken images found
    if (brokenImages.length > 0) {
      throw new Error(`Found ${brokenImages.length} broken images:\n${brokenImages.join('\n')}`);
    }

    console.log(`All ${imageCount} images loaded successfully (no broken images)`);
  });

  test('mobile layout: hero and CTA buttons stack correctly', async ({ page }) => {
    // Set viewport to mobile (375px width like iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Hero should still be visible
    const heroHeading = page.locator('h1').filter({ hasText: '£50 per notice' });
    await expect(heroHeading).toBeVisible();

    // Verify the heading fits within viewport (not overflowing)
    const headingBox = await heroHeading.boundingBox();
    expect(headingBox).toBeTruthy();
    if (headingBox) {
      // Content should be contained within viewport width
      expect(headingBox.x).toBeGreaterThanOrEqual(0);
      expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(375 + 10); // Allow small margin
    }

    // CTA buttons container - should stack vertically on mobile
    const ctaContainer = page.locator('.flex.flex-col.items-center.justify-center.gap-4').first();
    await expect(ctaContainer).toBeVisible();

    // Publish button should be visible and full width on mobile
    const publishButton = page.locator('a').filter({ hasText: 'Publish a Notice - £50' });
    await expect(publishButton).toBeVisible();

    // Browse button should also be visible
    const browseButton = page.locator('a').filter({ hasText: 'Browse notices' });
    await expect(browseButton).toBeVisible();

    console.log('Mobile layout renders correctly at 375px viewport');
  });
});
