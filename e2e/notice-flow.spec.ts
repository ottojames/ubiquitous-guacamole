import { test, expect } from '@playwright/test';

test.describe('Notice Search and Detail Flow', () => {
  test('should search from home page, view results, and open notice detail', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/Find.*notices/i);

    // Search for SW1A 1AA (Westminster postcode with test data)
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('SW1A 1AA');
    await searchInput.press('Enter');

    // Should navigate to /notices page
    await expect(page).toHaveURL(/\/notices/);

    // Wait for search results to load
    await page.waitForTimeout(2000); // Give API time to respond

    // Check that results are displayed (should show notices, not "0 notices")
    const resultsCount = page.locator('text=/\\d+ notice/i').first();
    await expect(resultsCount).toBeVisible({ timeout: 10000 });

    // Verify we have more than 0 notices
    const countText = await resultsCount.textContent();
    expect(countText).not.toContain('0 notice');
    console.log(`Found results: ${countText}`);

    // Wait for notice cards to appear
    const noticeCards = page.locator('article').first();
    await expect(noticeCards).toBeVisible({ timeout: 5000 });

    // Click on the first notice card
    await noticeCards.click();

    // Should navigate to notice detail page
    await expect(page).toHaveURL(/\/notices\/[a-f0-9-]+$/);

    // Wait for notice detail page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

    // Verify key elements are present on detail page
    await expect(page.locator('text=/Premises|Traffic|Planning/i')).toBeVisible();

    // Check that either map loads or error state shows
    const mapContainer = page.locator('[class*="h-[400px]"]').first();
    await expect(mapContainer).toBeVisible();

    // Verify location information is displayed
    await expect(page.locator('text=Location')).toBeVisible();

    console.log('✓ Full flow completed successfully');
  });

  test('should handle card click navigation correctly', async ({ page }) => {
    // Go directly to notices page with search
    await page.goto('/notices?query=SW1A+1AA&postcode=SW1A1AA');

    // Wait for results
    await page.waitForTimeout(2000);

    // Find a notice card
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Click the card (not the "View full notice" button)
    await card.click({ position: { x: 10, y: 10 } });

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/notices\/[a-f0-9-]+$/, { timeout: 5000 });

    // Verify we're on the detail page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle "View full notice" button click', async ({ page }) => {
    // Go to notices page
    await page.goto('/notices?query=SW1A+1AA&postcode=SW1A1AA');

    // Wait for results
    await page.waitForTimeout(2000);

    // Find the "View full notice" button in first card
    const viewButton = page.locator('button:has-text("View full notice")').first();
    await expect(viewButton).toBeVisible({ timeout: 10000 });

    // Click the button
    await viewButton.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/notices\/[a-f0-9-]+$/, { timeout: 5000 });
  });

  test('should show map with proper loading states', async ({ page }) => {
    // Go to notices and click first result
    await page.goto('/notices?query=SW1A+1AA&postcode=SW1A1AA');
    await page.waitForTimeout(2000);

    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // Wait for detail page
    await expect(page).toHaveURL(/\/notices\/[a-f0-9-]+$/);

    // Map container should be visible
    const mapContainer = page.locator('[class*="h-[400px]"]').first();
    await expect(mapContainer).toBeVisible();

    // Either loading state or loaded map should appear
    const loadingOrMap = page.locator('text=Loading map').or(page.locator('canvas')).or(page.locator('text=Unable to load map'));
    await expect(loadingOrMap).toBeVisible({ timeout: 10000 });

    console.log('✓ Map loading states working correctly');
  });

  test('should navigate back from detail page', async ({ page }) => {
    // Go to a notice detail page
    await page.goto('/notices?query=SW1A+1AA&postcode=SW1A1AA');
    await page.waitForTimeout(2000);

    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    // Wait for detail page
    await expect(page).toHaveURL(/\/notices\/[a-f0-9-]+$/);

    // Click back button
    const backButton = page.locator('button:has-text("Back")').first();
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Should go back to previous page
    await expect(page).toHaveURL(/\/notices/);
  });

  test('should show pagination on map view', async ({ page }) => {
    // Go to notices page in map view
    await page.goto('/notices?query=SW1A+1AA&postcode=SW1A1AA&view=map');

    // Wait for map view to load
    await page.waitForTimeout(2000);

    // Check for "Show More" button if there are more than 10 results
    const resultsCount = page.locator('text=/\\d+ notice/i').first();
    await expect(resultsCount).toBeVisible({ timeout: 10000 });

    const countText = await resultsCount.textContent();
    const noticeCount = parseInt(countText?.match(/(\d+)/)?.[1] || '0');

    if (noticeCount > 10) {
      // Should show "Show More" button
      const showMoreButton = page.locator('button:has-text("Show all")');
      await expect(showMoreButton).toBeVisible();

      // Click it
      await showMoreButton.click();

      // Button should disappear after showing all
      await expect(showMoreButton).not.toBeVisible();
    }

    console.log(`✓ Pagination working correctly for ${noticeCount} notices`);
  });
});
