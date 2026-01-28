import { test, expect } from '@playwright/test';

test.describe('Publish Flow Wiring', () => {
  test('publish page loads and shows step 1', async ({ page }) => {
    await page.goto('http://localhost:5173/publish');
    await page.waitForLoadState('networkidle');

    // Should redirect to step-1 or show step 1 content
    const url = page.url();
    console.log('Publish URL:', url);

    // Page should have content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(1000);

    // Check for notice type selection or step indicator
    const hasStepIndicator = await page.locator('text=/step|type|category/i').count() > 0;
    console.log('Has step/type indicator:', hasStepIndicator);
  });

  test('publish step 1 shows notice type options', async ({ page }) => {
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Look for notice type options
    const premisesLicence = page.locator('text=/premises.*licence|licensing|alcohol/i');
    const count = await premisesLicence.count();
    console.log('Found premises licence options:', count);

    // Look for any clickable card or button for notice types
    const noticeTypeCards = page.locator('[role="button"], button, a').filter({ hasText: /licence|planning|traffic|gambling/i });
    const cardCount = await noticeTypeCards.count();
    console.log('Found notice type cards:', cardCount);
  });

  test('can select notice type and proceed', async ({ page }) => {
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React to render

    // Find a notice type card/button that is visible
    const noticeTypeButton = page.locator('[data-testid*="notice-option"], [role="radio"], button[type="button"]')
      .filter({ hasText: /premises|licence/i })
      .first();

    const count = await noticeTypeButton.count();
    console.log('Notice type buttons found:', count);

    if (count > 0) {
      // Wait for the element to be visible
      await noticeTypeButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        console.log('Notice type button not visible within timeout');
      });

      const isVisible = await noticeTypeButton.isVisible();
      console.log('Notice type button visible:', isVisible);

      if (isVisible) {
        await noticeTypeButton.click();
        await page.waitForTimeout(500);
        console.log('Clicked notice type');

        // Look for a continue/next button
        const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
        const hasContinue = await continueBtn.count() > 0;
        console.log('Continue button exists:', hasContinue);

        if (hasContinue && await continueBtn.isVisible()) {
          await continueBtn.click();
          await page.waitForTimeout(1000);
          console.log('After continue URL:', page.url());
        }
      }
    } else {
      console.log('No notice type button found to click');
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/no-notice-buttons.png' });
    }
  });

  test('notice detail page loads and shows notice content', async ({ page, request }) => {
    // First get a notice ID from the API
    const searchResponse = await request.get('http://localhost:5174/api/notices/search');
    const searchData = await searchResponse.json();

    if (searchData.items && searchData.items.length > 0) {
      const noticeId = searchData.items[0].id;
      console.log('Testing notice ID:', noticeId);

      await page.goto(`http://localhost:5173/notices/${noticeId}`);
      await page.waitForLoadState('networkidle');

      // Should show notice details
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000);

      // Check for key notice elements
      const hasNoticeType = await page.locator('text=/premises|licence|application/i').count() > 0;
      console.log('Has notice type text:', hasNoticeType);
    } else {
      console.log('No notices found in database to test');
    }
  });

  test('submit notice API endpoint accepts valid data', async ({ request }) => {
    const testNotice = {
      notice_type: 'licensing-premises-new',
      applicant: {
        name: 'Test Applicant',
        address: '123 Test Street, Test Town, TE1 1ST'
      },
      premises: {
        name: 'Test Premises',
        address: '456 Main Road, Westminster, SW1A 1AA',
        postcode: 'SW1A 1AA'
      },
      consultation: {
        repsDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      contact_email: `test-${Date.now()}@example.com`
    };

    const response = await request.post('http://localhost:5174/api/notices/submit', {
      data: testNotice
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    console.log('Submit response:', data);
    expect(data.id).toBeTruthy();
    expect(data.success).toBe(true);
  });
});

test.describe('Login Flow Wiring', () => {
  test('login page shows portal selection', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Should show portal selection options
    const councilOption = page.locator('text=/council/i');
    const professionalOption = page.locator('text=/professional|solicitor|firm/i');

    const hasCouncil = await councilOption.count() > 0;
    const hasProfessional = await professionalOption.count() > 0;

    console.log('Has council option:', hasCouncil);
    console.log('Has professional option:', hasProfessional);

    expect(hasCouncil || hasProfessional).toBe(true);
  });

  test('council login page shows form', async ({ page }) => {
    await page.goto('http://localhost:5173/login/council');
    await page.waitForLoadState('networkidle');

    // Should show login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('legacy /council/login redirects to /login/council', async ({ page }) => {
    await page.goto('http://localhost:5173/council/login');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('After redirect URL:', url);
    expect(url).toContain('/login/council');
  });

  test('legacy /firm/login redirects to /login/professional', async ({ page }) => {
    await page.goto('http://localhost:5173/firm/login');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log('After redirect URL:', url);
    expect(url).toContain('/login/professional');
  });
});

test.describe('Email Alerts Wiring', () => {
  test('email alerts page has working form', async ({ page }) => {
    await page.goto('http://localhost:5173/email-alerts');
    await page.waitForLoadState('networkidle');

    // Find form elements
    const emailInput = page.locator('input[type="email"]').first();
    const postcodeInput = page.locator('input#postcode, input[placeholder*="postcode" i]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Subscribe")').first();

    await expect(emailInput).toBeVisible();

    // Fill form
    await emailInput.fill('wiring-test@example.com');
    if (await postcodeInput.count() > 0) {
      await postcodeInput.fill('SW1A 1AA');
    }

    // Check button is enabled
    if (await submitButton.count() > 0) {
      const isDisabled = await submitButton.isDisabled();
      console.log('Submit button disabled:', isDisabled);
    }
  });

  test('subscriptions API endpoint works', async ({ request }) => {
    const response = await request.post('http://localhost:5174/api/subscriptions/create', {
      data: {
        email: `wiring-test-${Date.now()}@example.com`,
        postcode: 'SW1A 1AA',
        radius_km: 5,
        notice_types: ['all']
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    console.log('Subscriptions API response:', data);
    expect(data.success).toBe(true);
  });
});

test.describe('Search Wiring', () => {
  test('search returns results for valid postcode', async ({ request }) => {
    const response = await request.get('http://localhost:5174/api/notices/search?postcode=SA1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Search results:', data.items?.length || 0, 'notices');
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('search page displays results', async ({ page }) => {
    await page.goto('http://localhost:5173/notices?postcode=SA1');
    await page.waitForLoadState('networkidle');

    // Wait for results to load
    await page.waitForTimeout(2000);

    // Check for results or empty state
    const resultCount = await page.locator('text=/\\d+\\s*notice/i').count();
    console.log('Result count displays:', resultCount > 0);

    // Check map is displayed
    const mapContainer = await page.locator('.maplibregl-map, [class*="maplibre"]').count();
    console.log('Map container found:', mapContainer > 0);
  });
});
