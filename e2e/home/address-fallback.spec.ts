// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

const fallbackResults = [
  {
    place_id: 101,
    display_name: '9 Lower Park Road, Chester, CH4 7BB, United Kingdom',
    address: {
      house_number: '9',
      road: 'Lower Park Road',
      city: 'Chester',
      postcode: 'CH4 7BB',
    },
  },
  {
    place_id: 102,
    display_name: '10 Lower Park Road, Chester, CH4 7BB, United Kingdom',
    address: {
      house_number: '10',
      road: 'Lower Park Road',
      city: 'Chester',
      postcode: 'CH4 7BB',
    },
  },
  {
    place_id: 103,
    display_name: 'Lower Park Road, Chester, United Kingdom',
    address: {
      road: 'Lower Park Road',
      city: 'Chester',
      postcode: 'CH4 7AA',
    },
  },
  {
    place_id: 104,
    display_name: '9 Lower Park Avenue, Preston, PR2 1AB, United Kingdom',
    address: {
      house_number: '9',
      road: 'Lower Park Avenue',
      city: 'Preston',
      postcode: 'PR2 1AB',
    },
  },
  {
    place_id: 105,
    display_name: '9 Park Road, Chester, United Kingdom',
    address: {
      house_number: '9',
      road: 'Park Road',
      city: 'Chester',
      postcode: 'CH1 1AB',
    },
  },
  {
    place_id: 106,
    display_name: 'Lower Road, Chester, United Kingdom',
    address: {
      road: 'Lower Road',
      city: 'Chester',
      postcode: 'CH2 2CD',
    },
  },
];

test.describe('Homepage fallback suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((config) => {
      window.__addrApiConfig = config;
    }, { url: 'https://addr.mock', key: 'test-key', fallbackUrl: 'https://nominatim.mock' });

    await page.route('**/suggest?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.route('**/postcode?*', async (route) => {
      await route.fulfill({
        status: 404,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
    });
  });

  test('uses fallback provider and free-text option', async ({ page }) => {
    let fallbackRequested = false;

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.route('**nominatim.mock/search?*', async (route) => {
      fallbackRequested = true;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(fallbackResults),
      });
    });

    await page.goto(`${BASE_URL}/`);

    const input = page.getByTestId('home-address-input');
    await input.fill('9 lower park road chester');

    const menu = page.getByTestId('home-suggest-menu');
    await expect(menu).toBeVisible();

    const suggestionItems = menu.getByTestId('home-suggest-item');
    await expect(async () => {
      const count = await suggestionItems.count();
      expect(count).toBeGreaterThanOrEqual(5);
    }).toPass();

    const firstItem = suggestionItems.first();
    await expect(firstItem).toContainText(/Lower Park Road/i);
    await expect(firstItem).toContainText(/Chester/i);

    expect(fallbackRequested).toBeTruthy();

    await page.getByTestId('home-suggest-free').click();

    await expect(page).toHaveURL(/\/notices\?.*query=9%20lower%20park%20road%20chester/i);
  });
});
