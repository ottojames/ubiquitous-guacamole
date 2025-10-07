// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

async function gotoHome(page) {
  await page.goto(`${BASE_URL}/`);
}

async function waitForPublish(page) {
  await page.waitForURL('**/publish**', { timeout: 5000 });
  await expect(page.getByTestId('input-premises-address')).toBeVisible();
}

test.describe('Homepage search delegates to Publish flow', () => {
  test('address query pre-fills publish search box', async ({ page }) => {
    await gotoHome(page);

    const query = '9 lower park roa';
    const input = page.getByTestId('home-address-input');
    await input.fill(query);
    await page.keyboard.press('Enter');

    await waitForPublish(page);
    await expect(page.getByTestId('input-premises-address')).toHaveValue(query);
  });

  test('postcode query normalises on publish page', async ({ page }) => {
    await gotoHome(page);

    const input = page.getByTestId('home-address-input');
    await input.fill('ch4 7bb');
    await page.getByTestId('home-search-btn').click();

    await waitForPublish(page);
    await expect(page.getByTestId('input-premises-address')).toHaveValue('CH4 7BB');
  });

  test('nonsense query still redirects without errors', async ({ page }) => {
    await gotoHome(page);

    const input = page.getByTestId('home-address-input');
    await input.fill('zzzx unknown place 123');
    await page.keyboard.press('Enter');

    await waitForPublish(page);
    await expect(page.getByTestId('input-premises-address')).toHaveValue('zzzx unknown place 123');
  });
});
