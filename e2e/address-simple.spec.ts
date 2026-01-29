import { test } from '@playwright/test';

test('simple address test with full logging', async ({ page }) => {
  // Log all console messages
  page.on('console', async (msg) => {
    const type = msg.type();
    const text = msg.text();
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));

    if (text.includes('address') || text.includes('Address') || text.includes('fetch')) {
      console.log(`[BROWSER ${type}]:`, text);
      if (args.length > 1) {
        console.log('[BROWSER args]:', JSON.stringify(args, null, 2));
      }
    }
  });

  // Log page errors
  page.on('pageerror', (err) => {
    console.log('[PAGE ERROR]:', err.message);
  });

  // Log network
  let addressRequestCount = 0;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/addresses') || url.includes('getaddress')) {
      addressRequestCount++;
      console.log(`[REQUEST #${addressRequestCount}]: ${request.method()} ${url}`);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/addresses') || url.includes('getaddress')) {
      console.log(`[RESPONSE]: ${response.status()} ${url}`);
      const body = await response.text().catch(() => 'Could not read body');
      console.log(`[RESPONSE BODY]:`, body.substring(0, 200));
    }
  });

  console.log('Navigating to home page...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');

  // Find and focus input
  const input = page.getByTestId('home-address-input');
  console.log('Found input, clicking...');
  await input.click();

  console.log('Typing "9 lower"...');
  await input.fill('9 lower');

  console.log('Waiting 3 seconds for debounce and requests...');
  await page.waitForTimeout(3000);

  console.log(`Total address API requests made: ${addressRequestCount}`);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/address-debug.png', fullPage: true });
  console.log('Screenshot saved to test-results/address-debug.png');
});
