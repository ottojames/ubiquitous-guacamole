import { test } from '@playwright/test';

test('capture browser console errors for address search', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture all console messages
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on('pageerror', (err) => {
    const errorText = `[PAGE ERROR] ${err.message}\n${err.stack}`;
    errors.push(errorText);
    console.log(errorText);
  });

  console.log('=== Navigating to home page ===');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  console.log('=== Finding and clicking input ===');
  const input = page.getByTestId('home-address-input');
  await input.click();

  console.log('=== Typing "9 lower" ===');
  await input.fill('9 lower');

  console.log('=== Waiting 4 seconds ===');
  await page.waitForTimeout(4000);

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));

  console.log('\n=== ALL PAGE ERRORS ===');
  if (errors.length === 0) {
    console.log('No page errors captured');
  } else {
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  await page.screenshot({ path: 'test-results/address-console-final.png', fullPage: true });
});
