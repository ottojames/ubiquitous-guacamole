import { test, expect } from '@playwright/test';

test.describe('Address Search', () => {
  test('should fetch and display address suggestions', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:5173');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find the address input field
    const addressInput = page.getByTestId('home-address-input');
    await expect(addressInput).toBeVisible();

    // Type a search query
    await addressInput.fill('9 lower pa');

    // Wait a bit for debounce and fetch
    await page.waitForTimeout(500);

    // Check if suggestions menu appears
    const suggestMenu = page.getByTestId('home-suggest-menu');

    // Wait for the menu to appear with either suggestions or error
    await expect(suggestMenu).toBeVisible({ timeout: 10000 });

    // Check if we got suggestions (not an error)
    const errorMessage = page.getByText("Couldn't fetch suggestions. Try again.");
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      // If there's an error, fail the test
      throw new Error('Address search failed with error: Couldn\'t fetch suggestions');
    }

    // Check if we have suggestion items
    const suggestions = page.getByTestId('home-suggest-item');
    const suggestionCount = await suggestions.count();

    // We should have at least one suggestion
    expect(suggestionCount).toBeGreaterThan(0);

    console.log(`Found ${suggestionCount} address suggestions`);

    // Get the first suggestion text
    const firstSuggestion = await suggestions.first().textContent();
    console.log(`First suggestion: ${firstSuggestion}`);

    // Verify the suggestion contains relevant text
    expect(firstSuggestion).toBeTruthy();
  });

  test('should call backend API endpoint', async ({ page }) => {
    // Set up request interception to monitor API calls
    const apiCalls: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/addresses')) {
        apiCalls.push(url);
        console.log('API call detected:', url);
      }
    });

    // Navigate to home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Type in the address input
    const addressInput = page.getByTestId('home-address-input');
    await addressInput.fill('9 lower');

    // Wait for API call
    await page.waitForTimeout(500);

    // Verify API was called
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0]).toContain('/api/addresses?q=');
  });
});
