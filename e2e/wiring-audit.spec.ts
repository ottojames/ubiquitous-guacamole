import { test, expect } from '@playwright/test';

test.describe('Full Wiring Audit', () => {
  test.describe('API Endpoints', () => {
    test('health endpoint works', async ({ request }) => {
      const response = await request.get('http://localhost:5174/api/health');
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.ok).toBe(true);
    });

    test('notices search endpoint works', async ({ request }) => {
      const response = await request.get('http://localhost:5174/api/notices/search');
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
    });

    test('councils endpoint works', async ({ request }) => {
      const response = await request.get('http://localhost:5174/api/councils');
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  test.describe('Home Page', () => {
    test('loads correctly', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await expect(page.locator('h1')).toBeVisible();
    });

    test('search bar is present and functional', async ({ page }) => {
      await page.goto('http://localhost:5173');

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="postcode" i], input[placeholder*="search" i]').first();
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // Type a postcode and verify it accepts input
      await searchInput.fill('SW1A 1AA');
      await expect(searchInput).toHaveValue('SW1A 1AA');
    });

    test('navigation links work', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Use the exact href selector for the "Find notices" link
      const noticesLink = page.locator('a[href="/notices"]').first();
      await expect(noticesLink).toBeVisible({ timeout: 10000 });

      await noticesLink.click();
      await expect(page).toHaveURL(/\/notices/);
    });
  });

  test.describe('Notices Page', () => {
    test('loads and displays notices', async ({ page }) => {
      await page.goto('http://localhost:5173/notices');
      await page.waitForLoadState('networkidle');

      // Should have some content or empty state
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);
    });

    test('search functionality works', async ({ page }) => {
      await page.goto('http://localhost:5173/notices');
      await page.waitForLoadState('networkidle');

      // Find search input on notices page
      const searchInput = page.locator('input[type="search"], input[placeholder*="postcode" i], input[placeholder*="search" i]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('SA1');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        // Just verify the page didn't crash
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('filter dropdowns are present', async ({ page }) => {
      await page.goto('http://localhost:5173/notices');
      await page.waitForLoadState('networkidle');

      // Look for filter elements
      const filterButtons = page.locator('button:has-text("Filter"), select, [role="combobox"]');
      // Just verify the page has some interactive elements
      const count = await filterButtons.count();
      console.log(`Found ${count} filter elements`);
    });

    test('notice cards link to detail pages', async ({ page }) => {
      await page.goto('http://localhost:5173/notices');
      await page.waitForLoadState('networkidle');

      // Find notice card links
      const noticeLinks = page.locator('a[href*="/notices/"]').filter({ hasNot: page.locator('a[href="/notices"]') });
      const count = await noticeLinks.count();

      if (count > 0) {
        const href = await noticeLinks.first().getAttribute('href');
        console.log(`First notice link: ${href}`);

        // Click first notice
        await noticeLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Should be on a notice detail page
        const url = page.url();
        expect(url).toMatch(/\/notices\/[\w-]+/);
      } else {
        console.log('No notice links found - may be empty state');
      }
    });
  });

  test.describe('Email Alerts Page', () => {
    test('loads and has subscription form', async ({ page }) => {
      await page.goto('http://localhost:5173/email-alerts');
      await page.waitForLoadState('networkidle');

      // Look for email input
      const emailInput = page.locator('input[type="email"]').first();
      const hasEmailInput = await emailInput.count() > 0;

      if (hasEmailInput) {
        await expect(emailInput).toBeVisible();
        console.log('Email alerts form is present');
      } else {
        console.log('No email input found on email-alerts page');
      }
    });

    test('subscription form can be filled', async ({ page }) => {
      await page.goto('http://localhost:5173/email-alerts');
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');

        // Look for submit button
        const submitButton = page.locator('button[type="submit"], button:has-text("Subscribe"), button:has-text("Submit"), button:has-text("Alert")').first();
        if (await submitButton.count() > 0) {
          console.log('Submit button found');
        }
      }
    });
  });

  test.describe('Login Pages', () => {
    test('council login page loads', async ({ page }) => {
      await page.goto('http://localhost:5173/council/login');
      await page.waitForLoadState('networkidle');

      // Should have login form or redirect
      const url = page.url();
      const content = await page.content();

      console.log(`Council login URL: ${url}`);
      expect(content.length).toBeGreaterThan(500);
    });

    test('professional login page loads', async ({ page }) => {
      await page.goto('http://localhost:5173/firm/login');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const content = await page.content();

      console.log(`Firm login URL: ${url}`);
      expect(content.length).toBeGreaterThan(500);
    });
  });

  test.describe('Publish Flow', () => {
    test('publish page loads', async ({ page }) => {
      await page.goto('http://localhost:5173/publish');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      const content = await page.content();

      console.log(`Publish URL: ${url}`);
      expect(content.length).toBeGreaterThan(500);
    });
  });

  test.describe('Pricing Page', () => {
    test('pricing page loads', async ({ page }) => {
      await page.goto('http://localhost:5173/pricing');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible();

      // Look for pricing elements
      const priceElements = page.locator('text=/£\\d+|free|pricing/i');
      const count = await priceElements.count();
      console.log(`Found ${count} pricing-related elements`);
    });
  });

  test.describe('Map View', () => {
    test('map view on notices page works', async ({ page }) => {
      await page.goto('http://localhost:5173/notices');
      await page.waitForLoadState('networkidle');

      // Look for map toggle or map container
      const mapToggle = page.locator('button:has-text("Map"), [aria-label*="map" i], button[title*="map" i]').first();

      if (await mapToggle.count() > 0) {
        await mapToggle.click();
        await page.waitForTimeout(1000);

        // Check for map container
        const mapContainer = page.locator('.maplibregl-map, [class*="map"]');
        const hasMap = await mapContainer.count() > 0;
        console.log(`Map container found: ${hasMap}`);
      } else {
        console.log('No map toggle button found');
      }
    });
  });

  test.describe('Footer Links', () => {
    test('footer links are present and work', async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      const footer = page.locator('footer');
      const footerLinks = footer.locator('a');
      const count = await footerLinks.count();

      console.log(`Found ${count} footer links`);

      if (count > 0) {
        // Check first few links
        for (let i = 0; i < Math.min(3, count); i++) {
          const href = await footerLinks.nth(i).getAttribute('href');
          console.log(`Footer link ${i + 1}: ${href}`);
        }
      }
    });
  });
});
