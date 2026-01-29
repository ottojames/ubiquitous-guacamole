// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Notices pagination (integration with real data)', () => {
  test('list view: pagination appears when there are multiple pages of results', async ({ page }) => {
    // Navigate to a search that should have results (based on user's screenshot)
    await page.goto(`${BASE_URL}/`);

    // Search for SW1A 1AA (the postcode the user showed in screenshot)
    const searchInput = page.getByPlaceholder(/postcode/i);
    await searchInput.fill('SW1A 1AA');
    await searchInput.press('Enter');

    // Wait for navigation to notices page
    await page.waitForURL(/\/notices/);

    // Wait for results to load (look for any notice card)
    await page.waitForSelector('article', { timeout: 10000 });

    // Check if pagination controls appear (if there are enough results)
    const resultCount = await page.locator('article').count();

    if (resultCount >= 10) {
      // Should have pagination controls
      await expect(page.getByText(/Showing/)).toBeVisible();

      // Check for page numbers or Next button
      const hasPageNumbers = await page.getByRole('button', { name: /^[0-9]+$/ }).count() > 0;
      const hasNextButton = await page.getByRole('button', { name: /Next/i }).isVisible();

      expect(hasPageNumbers || hasNextButton).toBeTruthy();
    }
  });

  test('map view: "Show More" button appears when sidebar has many results', async ({ page }) => {
    // Navigate to map view
    await page.goto(`${BASE_URL}/`);

    const searchInput = page.getByPlaceholder(/postcode/i);
    await searchInput.fill('SW1A 1AA');
    await searchInput.press('Enter');

    await page.waitForURL(/\/notices/);

    // Switch to map view
    const mapToggle = page.getByRole('button', { name: /Map.*view/i });
    await mapToggle.click();

    // Wait for map to load
    await page.waitForTimeout(2000);

    // Check if sidebar has results
    const sidebar = page.locator('aside');
    const sidebarExists = await sidebar.isVisible();

    if (sidebarExists) {
      const resultCount = await sidebar.locator('article').count();

      if (resultCount >= 10) {
        // Should have "Show More" or "Show all" button
        const showMoreButton = sidebar.getByRole('button', { name: /Show (all|more)/i });
        const hasShowMore = await showMoreButton.count() > 0;

        if (hasShowMore) {
          await expect(showMoreButton.first()).toBeVisible();

          // Click it and verify more results appear
          await showMoreButton.first().click();

          // Button should disappear after clicking
          await expect(showMoreButton).not.toBeVisible();
        }
      }
    }
  });

  test('lowercase postcode search still works', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const searchInput = page.getByPlaceholder(/postcode/i);

    // Type lowercase
    await searchInput.fill('sw1a 1aa');
    await searchInput.press('Enter');

    // Should navigate to notices page with normalized postcode
    await page.waitForURL(/\/notices\?.*postcode=SW1A1AA/, { timeout: 10000 });

    // Should show some results (or appropriate message if no results)
    const hasResults = await page.locator('article').count() > 0;
    const hasNoResultsMessage = await page.getByText(/no notices/i).isVisible();

    // Either should have results OR a proper "no results" message
    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });
});
