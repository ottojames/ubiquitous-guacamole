// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

// Helper to generate mock notices
function generateMockNotices(count: number) {
  const notices = [];
  for (let i = 1; i <= count; i++) {
    notices.push({
      id: `notice-${i}`,
      noticeType: i % 3 === 0 ? 'Traffic Order' : i % 2 === 0 ? 'Planning' : 'Premises Licence',
      status: 'published',
      premisesName: `Test Premises ${i}`,
      premisesAddress: {
        line1: `${i} Test Street`,
        town: 'London',
        postcode: 'SW1A 1AA',
      },
      repsDeadline: '2025-12-31',
      publicationDate: '2025-01-15',
      viewUrl: `/notices/notice-${i}`,
      location: {
        type: 'Point',
        coordinates: [-0.127758 + (i * 0.001), 51.507351 + (i * 0.001)],
      },
    });
  }
  return notices;
}

test.describe('Notices pagination', () => {
  test('list view: shows pagination for 33 results', async ({ page }) => {
    const mockNotices = generateMockNotices(33);

    // Mock address API
    await page.route('**/api/addresses?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: 'addr-1',
            label: 'Westminster, London, SW1A 1AA',
          }],
          source: 'getaddress',
        }),
      });
    });

    // Mock notices search API with 33 results
    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: mockNotices }),
      });
    });

    // Navigate to notices page
    await page.goto(`${BASE_URL}/notices?postcode=SW1A1AA`);

    // Wait for results to load
    await expect(page.getByRole('heading', { name: 'Test Premises 1', exact: true })).toBeVisible({ timeout: 5000 });

    // Check that we're on page 1 by default
    await expect(page).toHaveURL(/page=1|(?!.*page=)/);

    // Verify only 10 results visible on first page (not all 33)
    await expect(page.getByRole('heading', { name: 'Test Premises 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 10', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 11', exact: true })).not.toBeVisible();

    // Check pagination controls exist
    await expect(page.getByText(/Showing 1–10 of 33/)).toBeVisible();

    // Verify page 2 button exists
    const page2Button = page.getByRole('button', { name: '2', exact: true });
    await expect(page2Button).toBeVisible();

    // Click to page 2
    await page2Button.click();

    // Verify URL updated
    await expect(page).toHaveURL(/page=2/);

    // Verify results 11-20 are visible
    await expect(page.getByRole('heading', { name: 'Test Premises 11', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 20', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 10', exact: true })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 21', exact: true })).not.toBeVisible();

    // Check pagination text updated
    await expect(page.getByText(/Showing 11–20 of 33/)).toBeVisible();

    // Go to page 4 (last page - should show results 31-33)
    const page4Button = page.getByRole('button', { name: '4', exact: true });
    await page4Button.click();

    await expect(page).toHaveURL(/page=4/);
    await expect(page.getByRole('heading', { name: 'Test Premises 31', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 33', exact: true })).toBeVisible();
    await expect(page.getByText(/Showing 31–33 of 33/)).toBeVisible();

    // Verify "Next" button is disabled on last page
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeDisabled();
  });

  test('list view: changes items per page', async ({ page }) => {
    const mockNotices = generateMockNotices(33);

    await page.route('**/api/addresses?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'addr-1', label: 'Westminster, London, SW1A 1AA' }],
          source: 'getaddress',
        }),
      });
    });

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: mockNotices }),
      });
    });

    await page.goto(`${BASE_URL}/notices?postcode=SW1A1AA`);
    await expect(page.getByRole('heading', { name: 'Test Premises 1', exact: true })).toBeVisible({ timeout: 5000 });

    // Default: 10 per page
    await expect(page.getByText(/Showing 1–10 of 33/)).toBeVisible();

    // Change to 25 per page
    const perPageSelect = page.locator('select').filter({ hasText: /per page/i });
    await perPageSelect.selectOption('25');

    // Verify URL updated
    await expect(page).toHaveURL(/per_page=25/);

    // Verify now showing 25 items
    await expect(page.getByText(/Showing 1–25 of 33/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Premises 25', exact: true })).toBeVisible();

    // Verify only 2 pages now (not 4)
    await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '3', exact: true })).not.toBeVisible();
  });

  test('map view: "Show More" button reveals all results', async ({ page }) => {
    const mockNotices = generateMockNotices(33);

    await page.route('**/api/addresses?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'addr-1', label: 'Westminster, London, SW1A 1AA' }],
          source: 'getaddress',
        }),
      });
    });

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: mockNotices }),
      });
    });

    // Navigate to notices page in map view
    await page.goto(`${BASE_URL}/notices?postcode=SW1A1AA&view=map`);

    // Wait for map to load
    await page.waitForTimeout(2000);

    // Check sidebar shows only 10 results initially
    const sidebar = page.locator('aside').filter({ hasText: /Test Premises/i });
    await expect(sidebar).toBeVisible();

    // Verify first 10 notices visible in sidebar
    await expect(sidebar.getByRole('heading', { name: 'Test Premises 1', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('heading', { name: 'Test Premises 10', exact: true })).toBeVisible();

    // Verify notice 11+ not visible
    await expect(sidebar.getByRole('heading', { name: 'Test Premises 11', exact: true })).not.toBeVisible();

    // Find and click "Show all 33 notices" button
    const showMoreButton = sidebar.getByRole('button', { name: /Show all 33 notices/i });
    await expect(showMoreButton).toBeVisible();
    await showMoreButton.click();

    // Verify all notices now visible in sidebar
    await expect(sidebar.getByRole('heading', { name: 'Test Premises 11', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('heading', { name: 'Test Premises 33', exact: true })).toBeVisible();

    // Verify "Show More" button is gone
    await expect(showMoreButton).not.toBeVisible();
  });

  test('lowercase postcode search works', async ({ page }) => {
    const mockNotices = generateMockNotices(5);

    // Mock address API to return uppercase postcode
    await page.route('**/api/addresses?*', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      // Simulate backend normalization - return uppercase regardless of input
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: 'addr-1',
            label: 'Westminster, London, SW1A 1AA',
          }],
          source: 'getaddress',
        }),
      });
    });

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: mockNotices }),
      });
    });

    // Navigate to home page
    await page.goto(`${BASE_URL}/`);

    // Type LOWERCASE postcode
    const input = page.getByTestId('home-address-input');
    await input.fill('sw1a 1aa');

    // Wait for suggestions
    await page.waitForTimeout(500);

    // Select first suggestion
    await input.press('ArrowDown');
    await input.press('Enter');

    // Should navigate to notices page with normalized postcode
    await expect(page).toHaveURL(/\/notices\?.*postcode=SW1A1AA/);

    // Verify results are visible
    await expect(page.getByRole('heading', { name: 'Test Premises 1', exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('pagination resets when filters change', async ({ page }) => {
    const mockNotices = generateMockNotices(33);

    await page.route('**/api/addresses?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'addr-1', label: 'Westminster, London, SW1A 1AA' }],
          source: 'getaddress',
        }),
      });
    });

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: mockNotices }),
      });
    });

    // Start on page 3
    await page.goto(`${BASE_URL}/notices?postcode=SW1A1AA&page=3`);
    await expect(page.getByRole('heading', { name: 'Test Premises 21', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/page=3/);

    // Apply a filter (e.g., type filter)
    const typeFilter = page.getByRole('button', { name: /Premises Licence/i }).first();
    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // Page should reset to 1 (URL should not have page=3)
      await expect(page).not.toHaveURL(/page=3/);
    }
  });
});
