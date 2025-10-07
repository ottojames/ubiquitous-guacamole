// @ts-nocheck
import { expect, test } from '@playwright/test';

import { mockAddressSuggest } from '../mocks/address-api';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

const suggestion = {
  id: 'addr-9',
  label: '9 Lower Park Road, Camden, CA1 4XY',
  line1: '9 Lower Park Road',
  town: 'Camden',
  postcode: 'CA1 4XY',
  uprn: '100010011',
};

async function enableAddressConfig(page, overrides = {}) {
  await page.addInitScript((config) => {
    window.__addrApiConfig = config;
  }, { url: 'https://addr.mock', key: 'test-key', ...overrides });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage?.clear();
  });
});

test('selecting an address creates a draft and navigates to publish', async ({ page }) => {
  await enableAddressConfig(page);
  await mockAddressSuggest(page, { status: 200, body: { results: [suggestion] } });

  let draftRequestBody: any = null;
  await page.route('**/api/notices/draft', async (route) => {
    draftRequestBody = await route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'draft-123' }),
    });
  });

  await page.goto(`${BASE_URL}/`);

  const input = page.getByTestId('home-address-input');
  await input.fill('9 lower park roa');

  const menu = page.getByTestId('home-suggest-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByTestId('home-suggest-item')).toHaveCount(1);

  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page).toHaveURL(/\/publish\?draft=draft-123/);

  const addressField = page.locator('textarea#premisesAddress');
  await expect(addressField).toBeVisible();
  await expect(addressField).toHaveValue(/9 Lower Park Road/i);

  const councilField = page.locator('input#councilName');
  await expect(councilField).toHaveValue(/Camden Council/i);

  expect(draftRequestBody).toBeTruthy();
  expect(draftRequestBody.address.line1).toBe('9 Lower Park Road');
  expect(draftRequestBody.postcode).toBe('CA14XY');
  expect(draftRequestBody.councilId).toBe('camden');
});

test('fallback link appears when no suggestions', async ({ page }) => {
  await enableAddressConfig(page);
  await mockAddressSuggest(page, { status: 200, body: { results: [] } });

  await page.goto(`${BASE_URL}/`);

  const input = page.getByTestId('home-address-input');
  await input.fill('zzzx unknown lane');

  const menu = page.getByTestId('home-suggest-menu');
  await expect(menu).toContainText('No suggestions');

  const fallback = menu.getByTestId('home-suggest-fallback');
  await expect(fallback).toBeVisible();
  await fallback.click();

  await expect(page).toHaveURL(/\/notices\?query=zzzx%20unknown%20lane/);
});

test('401 responses surface inline credentials hint', async ({ page }) => {
  await enableAddressConfig(page);
  await mockAddressSuggest(page, { status: 401, body: { errors: ['invalid'] } });

  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') {
      warnings.push(message.text());
    }
  });

  await page.goto(`${BASE_URL}/`);

  const input = page.getByTestId('home-address-input');
  await input.fill('10 downing');

  await expect(page.getByText('Address service credentials invalid')).toBeVisible();
  expect(warnings.some((text) => /credentials invalid/i.test(text))).toBeTruthy();
});

test('429 rate limit retries once then shows suggestions', async ({ page }) => {
  await enableAddressConfig(page);
  await mockAddressSuggest(page, [
    { status: 429, body: { message: 'slow down' } },
    { status: 200, body: { results: [suggestion] } },
  ]);

  await page.goto(`${BASE_URL}/`);

  const input = page.getByTestId('home-address-input');
  await input.fill('9 lower park roa');

  await expect(page.getByText('Rate limited—retrying…')).toBeVisible();
  const menu = page.getByTestId('home-suggest-menu');
  await expect(menu.getByTestId('home-suggest-item')).toHaveCount(1);
});

test('missing env short-circuits lookup without network calls', async ({ page }) => {
  let called = false;
  await page.route('**/suggest?*', async (route) => {
    called = true;
    await route.abort();
  });

  await page.goto(`${BASE_URL}/`);

  const input = page.getByTestId('home-address-input');
  await input.fill('something street');

  await expect(page.getByText('Address search not configured')).toBeVisible();
  expect(called).toBeFalsy();
});
