import { test, expect } from '@playwright/test';

test('detailed address search verification', async ({ page }) => {
  // Track all network requests
  const requests: string[] = [];
  const responses: Array<{ url: string; status: number; body: string }> = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/addresses') || url.includes('getaddress')) {
      requests.push(`${request.method()} ${url}`);
      console.log(`[REQUEST]: ${request.method()} ${url}`);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/addresses') || url.includes('getaddress')) {
      const body = await response.text().catch(() => 'Could not read body');
      responses.push({ url, status: response.status(), body });
      console.log(`[RESPONSE]: ${response.status()} ${url}`);
      console.log(`[BODY]: ${body.substring(0, 300)}`);
    }
  });

  // Navigate to home
  console.log('=== Navigating to home page ===');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  console.log('=== Page loaded ===');

  // Take initial screenshot
  await page.screenshot({ path: 'test-results/address-step1-loaded.png' });

  // Find the input
  console.log('=== Looking for address input ===');
  const input = page.getByTestId('home-address-input');
  await expect(input).toBeVisible({ timeout: 5000 });
  console.log('=== Input is visible ===');

  // Click and type
  console.log('=== Clicking input ===');
  await input.click();
  await page.screenshot({ path: 'test-results/address-step2-focused.png' });

  console.log('=== Typing "9 lower" ===');
  await input.fill('9 lower');
  await page.screenshot({ path: 'test-results/address-step3-typed.png' });

  // Wait for debounce and API call
  console.log('=== Waiting 3 seconds for debounce and API calls ===');
  await page.waitForTimeout(3000);

  // Take screenshot after waiting
  await page.screenshot({ path: 'test-results/address-step4-afterwait.png', fullPage: true });

  // Check for suggestions in various ways
  console.log('=== Looking for suggestions dropdown ===');

  // Try multiple selectors
  const dropdownSelectors = [
    '[data-testid="home-address-suggestions"]',
    '[role="listbox"]',
    '[data-testid*="suggestions"]',
    'ul:has-text("Lower")',
    '.suggestions',
    '[class*="suggestion"]'
  ];

  let foundDropdown = false;
  for (const selector of dropdownSelectors) {
    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);
    console.log(`  Selector "${selector}": ${isVisible ? 'VISIBLE' : 'not found'}`);
    if (isVisible) {
      foundDropdown = true;
      break;
    }
  }

  // Check for any list items
  const allListItems = await page.locator('li').all();
  console.log(`=== Found ${allListItems.length} <li> elements on page ===`);

  for (let i = 0; i < Math.min(allListItems.length, 10); i++) {
    const text = await allListItems[i].textContent().catch(() => '');
    if (text.toLowerCase().includes('lower') || text.includes('9')) {
      console.log(`  Li[${i}]: "${text}"`);
    }
  }

  // Summary
  console.log('=== SUMMARY ===');
  console.log(`Total API requests made: ${requests.length}`);
  requests.forEach((req, i) => console.log(`  ${i + 1}. ${req}`));

  console.log(`Total API responses received: ${responses.length}`);
  responses.forEach((res, i) => {
    console.log(`  ${i + 1}. ${res.status} - ${res.url}`);
    if (res.body) {
      const parsed = JSON.parse(res.body);
      const count = parsed.items?.length || parsed.results?.length || 0;
      console.log(`     -> Returned ${count} items`);
    }
  });

  console.log(`Suggestions dropdown found: ${foundDropdown}`);

  // Assertions
  expect(requests.length).toBeGreaterThan(0);
  expect(responses.length).toBeGreaterThan(0);
  expect(responses[0].status).toBe(200);
});
