import { test, expect } from '@playwright/test';

test('address search returns suggestions in the UI', async ({ page }) => {
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

  console.log('Waiting for suggestions to appear...');
  // Wait for suggestions dropdown to appear
  const suggestionsDropdown = page.locator('[data-testid="home-address-suggestions"]').or(
    page.locator('[role="listbox"]')
  ).or(
    page.locator('ul').filter({ hasText: 'Lower' })
  );

  await suggestionsDropdown.waitFor({ state: 'visible', timeout: 5000 });

  // Check that we have suggestions
  const suggestions = await page.locator('[role="option"]').or(
    page.locator('li').filter({ hasText: 'Lower' })
  ).all();

  console.log(`Found ${suggestions.length} suggestions`);
  expect(suggestions.length).toBeGreaterThan(0);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/address-success.png', fullPage: true });
  console.log('Screenshot saved to test-results/address-success.png');

  console.log('✓ Address search is working!');
});
