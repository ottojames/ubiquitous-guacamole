// @ts-nocheck
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const PUBLISH_UPLOAD_PATH = `${BASE_URL}/next/publish/upload`;

async function dispatchValidate(page: Page) {
  await page.evaluate(() => {
    const node = document.querySelector('[data-address-block-id]');
    node?.dispatchEvent(new Event('address-block:validate', { bubbles: true }));
  });
}

async function dispatchTestSuggestion(
  page: Page,
  detail: {
    id?: string;
    label?: string;
    line1?: string;
    line2?: string;
    town?: string;
    postcode?: string;
    uprn?: string;
  }
) {
  await page.evaluate((payload) => {
    const node = document.querySelector('[data-address-block-id]');
    node?.dispatchEvent(
      new CustomEvent('address-block:test-select', {
        detail: payload,
        bubbles: true,
      })
    );
  }, detail);
}

test.describe('Publish address block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLISH_UPLOAD_PATH);
    await expect(page.locator('[data-address-block-id]')).toBeVisible();
  });

  test('normalises postcode and surfaces required feedback', async ({ page }) => {
    const line1 = page.getByTestId('addr-line1');
    const town = page.getByTestId('addr-town');
    const postcode = page.getByTestId('addr-postcode');

    await postcode.fill('sw1a 1aa');
    await postcode.blur();
    await expect(postcode).toHaveValue('SW1A 1AA');

    await line1.focus();
    await postcode.focus();

    await town.focus();
    await postcode.focus();

    await expect(line1).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('addr-error-line1')).toBeVisible();

    await expect(town).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByTestId('addr-error-town')).toBeVisible();

    await dispatchValidate(page);
    await expect(page.getByTestId('addr-error-summary')).toBeVisible();
  });

  test('persists selected UPRN and clears it on manual edits', async ({ page }) => {
    await dispatchTestSuggestion(page, {
      id: 'suggestion-123',
      label: '10 Downing Street, London, SW1A 2AA',
      line1: '10 Downing Street',
      town: 'London',
      postcode: 'SW1A2AA',
      uprn: '1234567890',
    });

    const line1 = page.getByTestId('addr-line1');
    const town = page.getByTestId('addr-town');
    const postcode = page.getByTestId('addr-postcode');
    const uprn = page.getByTestId('addr-uprn');

    await expect(line1).toHaveValue('10 Downing Street');
    await expect(town).toHaveValue('London');
    await expect(postcode).toHaveValue('SW1A 2AA');
    await expect(uprn).toHaveValue('1234567890');

    await line1.fill('10 Downing St');
    await expect(uprn).toHaveValue('');
  });
});
