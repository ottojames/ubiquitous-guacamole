// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

const suggestion = {
  id: 'addr-1',
  label: '10 Downing Street, London, SW1A 2AA',
  line1: '10 Downing Street',
  town: 'London',
  postcode: 'SW1A 2AA',
  uprn: '100023336956',
};

test.describe('Homepage address search → notices', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((config) => {
      window.__addrApiConfig = config;
    }, { url: 'https://addr.mock', key: 'test-key' });

    await page.route('**/suggest?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [suggestion] }),
      });
    });
  });

  test('selecting a suggestion navigates to notices and triggers search request', async ({ page }) => {
    let apiRequestUrl: string | null = null;
    await page.route('**/api/notices/search?*', async (route) => {
      apiRequestUrl = route.request().url();
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto(`${BASE_URL}/`);

    const input = page.getByTestId('home-address-input');
    await input.fill('10 Downing');

    const menu = page.getByTestId('home-suggest-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId('home-suggest-item')).toHaveCount(1);
    await expect(menu).toContainText(suggestion.label);

    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/notices\?.*postcode=SW1A2AA/);
    expect(apiRequestUrl).toBeTruthy();
    expect(apiRequestUrl).toMatch(/postcode=SW1A2AA/);
  });

  test('hitting Search without selecting suggestion resolves postcode and navigates', async ({ page }) => {
    await page.route('**/postcode?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postcode: 'SW1A 2AA' }),
      });
    });

    await page.route('**/streets?postcode=SW1A2AA', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [suggestion] }),
      });
    });

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto(`${BASE_URL}/`);

    const input = page.getByTestId('home-address-input');
    await input.fill('SW1A 2AA');
    await page.getByTestId('home-search-btn').click();

    await expect(page).toHaveURL(/\/notices\?.*postcode=SW1A2AA/);
  });
});
