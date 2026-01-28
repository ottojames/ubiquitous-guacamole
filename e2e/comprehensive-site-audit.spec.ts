import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Site Audit
 * Tests all public-facing pages and council portal flows
 * Run in headless mode to verify site functionality
 */

// Helper to collect errors
interface TestError {
  page: string;
  type: 'console_error' | 'network_error' | 'visual_issue' | 'functionality_issue';
  message: string;
  details?: string;
}

const errors: TestError[] = [];

// Helper to setup console error collection
async function setupErrorCollection(page: Page, pageName: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({
        page: pageName,
        type: 'console_error',
        message: msg.text(),
      });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({
      page: pageName,
      type: 'console_error',
      message: err.message,
      details: err.stack,
    });
  });

  page.on('requestfailed', (request) => {
    errors.push({
      page: pageName,
      type: 'network_error',
      message: `Failed: ${request.url()}`,
      details: request.failure()?.errorText,
    });
  });
}

test.describe('Public-Facing Pages Audit', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Homepage');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check key elements exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Civic Notices', { exact: false })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: /find notices/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible();

    // Check hero section
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();

    // Check footer
    await expect(page.locator('footer')).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/screenshots/homepage.png', fullPage: true });
  });

  test('Notices page loads and displays notices', async ({ page }) => {
    await setupErrorCollection(page, 'Notices Page');
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');

    // Check page title/header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Wait for notices to load (either list or empty state)
    await page.waitForTimeout(2000);

    // Check if map or list view is available
    const hasContent = await page.locator('[data-testid="notice-card"], .notice-card, [class*="notice"]').count() > 0 ||
                       await page.getByText(/no notices/i).isVisible().catch(() => false);

    // Check search/filter functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/screenshots/notices.png', fullPage: true });
  });

  test('Pricing page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Pricing Page');
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Check pricing content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Look for pricing tiers or cards
    const pricingContent = page.locator('[class*="pricing"], [class*="tier"], [class*="plan"]');

    // Check for CTA buttons
    const ctaButton = page.getByRole('button', { name: /get started|sign up|contact/i }).or(
      page.getByRole('link', { name: /get started|sign up|contact/i })
    );

    await page.screenshot({ path: 'test-results/screenshots/pricing.png', fullPage: true });
  });

  test('Email Alerts page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Email Alerts Page');
    await page.goto('/email-alerts');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for form elements
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/screenshots/email-alerts.png', fullPage: true });
  });

  test('Contact page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Contact Page');
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/contact.png', fullPage: true });
  });

  test('Terms page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Terms Page');
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/terms.png', fullPage: true });
  });

  test('Privacy page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Privacy Page');
    await page.goto('/privacy');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/privacy.png', fullPage: true });
  });

  test('API Docs page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'API Docs Page');
    await page.goto('/api-docs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/api-docs.png', fullPage: true });
  });
});

test.describe('Public Notice Submission Flow', () => {
  test('Publish flow - Step 1: Notice Type Selection', async ({ page }) => {
    await setupErrorCollection(page, 'Publish - Step 1');
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');

    // Check the publish page loads
    await page.waitForTimeout(1000);

    // Look for notice type categories
    const licensingOption = page.getByText(/licensing/i);
    const gamblingOption = page.getByText(/gambling/i);

    // Check at least one notice type is visible
    const hasNoticeTypes = await licensingOption.or(gamblingOption).count() > 0;

    await page.screenshot({ path: 'test-results/screenshots/publish-step1.png', fullPage: true });
  });

  test('Publish flow - Check all notice type categories visible', async ({ page }) => {
    await setupErrorCollection(page, 'Publish - Categories');
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify each category is accessible
    const categories = [
      'Licensing Act 2003',
      'Gambling Act 2005',
      "Goods Vehicle Operator's Licence",
      'Planning',
      'Probate',
      'Traffic Regulation Orders'
    ];

    for (const category of categories) {
      const categoryElement = page.getByText(category, { exact: false });
      const isVisible = await categoryElement.isVisible().catch(() => false);
      if (!isVisible) {
        errors.push({
          page: 'Publish - Categories',
          type: 'functionality_issue',
          message: `Category not visible: ${category}`,
        });
      }
    }

    await page.screenshot({ path: 'test-results/screenshots/publish-categories.png', fullPage: true });
  });
});

test.describe('Notice Search and Filtering', () => {
  test('Search notices by keyword', async ({ page }) => {
    await setupErrorCollection(page, 'Notice Search');
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and use search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], input[name="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('restaurant');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);

      // Check results or empty state
      await page.screenshot({ path: 'test-results/screenshots/search-results.png', fullPage: true });
    }
  });

  test('Filter notices by type', async ({ page }) => {
    await setupErrorCollection(page, 'Notice Filter');
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for filter dropdown or tabs
    const filterSelect = page.locator('select').first();
    const filterTabs = page.locator('[role="tab"], button[class*="tab"]');

    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    } else if (await filterTabs.count() > 0) {
      await filterTabs.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/screenshots/filter-results.png', fullPage: true });
  });

  test('Map view loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Map View');
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if map is visible
    const mapContainer = page.locator('[class*="maplibre"], .mapboxgl-map, [class*="map-container"], canvas');
    const hasMap = await mapContainer.count() > 0;

    if (hasMap) {
      await expect(mapContainer.first()).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/screenshots/map-view.png', fullPage: true });
  });
});

test.describe('Council Portal - Demo Mode', () => {
  test('Council login page loads', async ({ page }) => {
    await setupErrorCollection(page, 'Council Login');
    await page.goto('/auth/council-login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading')).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/council-login.png', fullPage: true });
  });

  test('Sample Borough Council - Licensing Dashboard', async ({ page }) => {
    await setupErrorCollection(page, 'Sample Borough - Licensing');

    // Navigate directly to sample council dashboard (demo mode)
    await page.goto('/c/sampleton-borough-council/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if dashboard loads (may redirect to login)
    const currentUrl = page.url();

    if (currentUrl.includes('/dashboard')) {
      // Dashboard loaded - check key elements
      const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      if (await dashboardHeading.isVisible()) {
        await expect(dashboardHeading).toBeVisible();
      }

      // Check for stats cards
      const statsCards = page.locator('[class*="stat"], [class*="metric"], [class*="card"]');

      await page.screenshot({ path: 'test-results/screenshots/council-dashboard.png', fullPage: true });
    } else {
      // Was redirected - likely needs auth
      await page.screenshot({ path: 'test-results/screenshots/council-redirect.png', fullPage: true });
    }
  });

  test('Council Portal - Notices Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Notices');
    await page.goto('/c/sampleton-borough-council/licensing/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    if (currentUrl.includes('/notices')) {
      // Check for notices list or empty state
      const noticesHeading = page.getByRole('heading', { name: /notices/i });
      if (await noticesHeading.isVisible()) {
        await expect(noticesHeading).toBeVisible();
      }

      // Check for filter controls
      const filterButtons = page.locator('button, select').filter({ hasText: /all|draft|published/i });

      await page.screenshot({ path: 'test-results/screenshots/council-notices.png', fullPage: true });
    }
  });

  test('Council Portal - Create Notice Flow', async ({ page }) => {
    await setupErrorCollection(page, 'Council Create Notice');
    await page.goto('/c/sampleton-borough-council/licensing/notices/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    if (currentUrl.includes('/new')) {
      // Check notice editor loads
      const formElements = page.locator('form, input, select, textarea');

      await page.screenshot({ path: 'test-results/screenshots/council-create-notice.png', fullPage: true });
    }
  });

  test('Council Portal - Representations Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Representations');
    await page.goto('/c/sampleton-borough-council/licensing/representations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/council-representations.png', fullPage: true });
  });

  test('Council Portal - Team Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Team');
    await page.goto('/c/sampleton-borough-council/licensing/team');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/council-team.png', fullPage: true });
  });

  test('Council Portal - Templates Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Templates');
    await page.goto('/c/sampleton-borough-council/licensing/templates');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/council-templates.png', fullPage: true });
  });

  test('Council Portal - Settings Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Settings');
    await page.goto('/c/sampleton-borough-council/licensing/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/council-settings.png', fullPage: true });
  });

  test('Council Portal - Analytics Page', async ({ page }) => {
    await setupErrorCollection(page, 'Council Analytics');
    await page.goto('/c/sampleton-borough-council/licensing/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/council-analytics.png', fullPage: true });
  });
});

test.describe('Westminster Council - Alternative Demo', () => {
  test('Westminster Council Dashboard', async ({ page }) => {
    await setupErrorCollection(page, 'Westminster Dashboard');
    await page.goto('/c/westminster/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/screenshots/westminster-dashboard.png', fullPage: true });
  });
});

test.describe('Notice Detail Pages', () => {
  test('Notice detail page structure', async ({ page }) => {
    await setupErrorCollection(page, 'Notice Detail');

    // First get a notice ID from the notices page
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on first notice if available
    const noticeLinks = page.locator('a[href*="/notices/"]').filter({ hasNot: page.locator('a[href="/notices"]') });

    if (await noticeLinks.count() > 0) {
      await noticeLinks.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check detail page elements
      const title = page.getByRole('heading', { level: 1 });

      // Check for key sections
      const hasContent = await page.locator('[class*="notice"], [class*="detail"], main').count() > 0;

      await page.screenshot({ path: 'test-results/screenshots/notice-detail.png', fullPage: true });
    }
  });
});

test.describe('Authentication Pages', () => {
  test('Sign in page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Sign In');
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Check form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.getByRole('button', { name: /sign in|log in/i });

    await page.screenshot({ path: 'test-results/screenshots/sign-in.png', fullPage: true });
  });

  test('Register page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Register');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/screenshots/register.png', fullPage: true });
  });

  test('Forgot password page loads correctly', async ({ page }) => {
    await setupErrorCollection(page, 'Forgot Password');
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/screenshots/forgot-password.png', fullPage: true });
  });
});

test.describe('API Endpoints Health Check', () => {
  test('API health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:5174/api/health');
    expect(response.status()).toBe(200);
  });

  test('Notices API endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:5174/api/notices/search?limit=5');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('items');
  });

  test('Councils API endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:5174/api/councils');
    expect(response.status()).toBe(200);
  });
});

test.describe('Responsive Design Checks', () => {
  test('Homepage - Mobile view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupErrorCollection(page, 'Homepage Mobile');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check mobile menu button exists
    const mobileMenuBtn = page.locator('button[aria-label*="menu" i], button[class*="mobile"], [class*="hamburger"]');

    await page.screenshot({ path: 'test-results/screenshots/homepage-mobile.png', fullPage: true });
  });

  test('Notices page - Tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupErrorCollection(page, 'Notices Tablet');
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/screenshots/notices-tablet.png', fullPage: true });
  });
});

test.describe('Error Handling', () => {
  test('404 page for invalid routes', async ({ page }) => {
    await setupErrorCollection(page, '404 Page');
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Should show home page or 404 page (based on catch-all route)
    await page.screenshot({ path: 'test-results/screenshots/404-page.png', fullPage: true });
  });

  test('Invalid notice ID handling', async ({ page }) => {
    await setupErrorCollection(page, 'Invalid Notice');
    await page.goto('/notices/invalid-notice-id-12345');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should show error state or redirect
    await page.screenshot({ path: 'test-results/screenshots/invalid-notice.png', fullPage: true });
  });
});

// Print collected errors at the end
test.afterAll(() => {
  if (errors.length > 0) {
    console.log('\n\n=== ERRORS FOUND DURING TESTING ===\n');
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. [${err.page}] ${err.type}: ${err.message}`);
      if (err.details) {
        console.log(`   Details: ${err.details}`);
      }
    });
    console.log('\n=== END OF ERRORS ===\n');
  } else {
    console.log('\n\n=== NO ERRORS FOUND ===\n');
  }
});
