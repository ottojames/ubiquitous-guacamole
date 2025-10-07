// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

const successResponse = {
  items: [
    {
      id: 'notice-1',
      noticeType: 'Premises Licence',
      status: 'Open',
      premisesName: 'Example Premises',
      premisesAddress: {
        line1: '10 Downing Street',
        town: 'London',
        postcode: 'SW1A 2AA',
      },
      repsDeadline: '2025-04-01',
      publicationDate: '2025-03-20',
      viewUrl: '/notices/notice-1',
    },
  ],
};

test.describe('/notices results page', () => {
  test('renders notices for a postcode query', async ({ page }) => {
    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(successResponse),
      });
    });

    await page.goto(`${BASE_URL}/notices?postcode=SW1A2AA`);

    await expect(page.getByRole('heading', { name: 'Premises Licence' })).toBeVisible();
    await expect(page.getByText('Example Premises')).toBeVisible();
  });

  test('shows retry controls on error and recovers after retry', async ({ page }) => {
    let attempt = 0;
    await page.route('**/api/notices/search?*', async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.fulfill({
          status: 500,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: 'boom' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(successResponse),
        });
      }
    });

    await page.goto(`${BASE_URL}/notices?postcode=SW1A2AA`);

    const errorBanner = page.getByText(/Search failed/, { exact: false });
    await expect(errorBanner).toBeVisible();

    await page.getByRole('button', { name: /Retry/i }).click();

    await expect(page.getByRole('heading', { name: 'Premises Licence' })).toBeVisible();
  });
});
