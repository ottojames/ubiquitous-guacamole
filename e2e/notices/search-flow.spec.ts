// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Notices search flow', () => {
  test('navigates from home and renders results with filters', async ({ page }) => {
    const suggestion = {
      id: 'addr-1',
      label: '10 Downing Street, London, SW1A 2AA',
      line1: '10 Downing Street',
      town: 'London',
      postcode: 'SW1A 2AA',
      uprn: '100023336956',
    };

    const noticesResponse = {
      items: [
        {
          id: 'notice-1',
          noticeType: 'Premises Licence',
          status: 'Open',
          premisesName: '10 Downing Street',
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

    await page.route('**/api/notices/search?*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(noticesResponse),
      });
    });

    await page.goto(`${BASE_URL}/`);

    const input = page.getByTestId('home-address-input');
    await input.fill('10 Downing');
    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(page).toHaveURL(/\/notices\?.*postcode=SW1A2AA/);

    await expect(page.getByRole('heading', { name: 'Premises Licence' })).toBeVisible();
    await expect(page.getByText('10 Downing Street')).toBeVisible();
    await expect(page.getByText('Open', { exact: false })).toBeVisible();

    const mapToggle = page.getByRole('button', { name: /Map view/i });
    await mapToggle.click();
    await expect(page.getByText('Map view coming soon')).toBeVisible();
    await mapToggle.click();
    await expect(page.getByRole('heading', { name: 'Premises Licence' })).toBeVisible();
  });
});
