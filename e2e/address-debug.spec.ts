import { test } from '@playwright/test';

test('debug address search configuration', async ({ page }) => {
  // Capture console logs
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  // Capture network requests
  page.on('request', (request) => {
    console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
  });

  page.on('response', (response) => {
    console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
  });

  // Navigate to home page
  await page.goto('http://localhost:5173');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check environment variables in browser
  const envCheck = await page.evaluate(() => {
    return {
      VITE_ADDRESS_API_URL: (import.meta.env as any).VITE_ADDRESS_API_URL,
      VITE_ADDRESS_API_KEY: (import.meta.env as any).VITE_ADDRESS_API_KEY ? 'SET' : 'NOT SET',
      VITE_GETADDRESS_KEY: (import.meta.env as any).VITE_GETADDRESS_KEY ? 'SET' : 'NOT SET',
    };
  });

  console.log('[ENV CHECK]:', JSON.stringify(envCheck, null, 2));

  // Type in the address input
  const addressInput = page.getByTestId('home-address-input');
  await addressInput.fill('9 lower');

  // Wait for any network activity
  await page.waitForTimeout(2000);

  console.log('[TEST COMPLETE]');
});
