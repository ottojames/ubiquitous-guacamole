// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const PUBLISH_PATH = `${BASE_URL}/next/publish/upload`;
const STORAGE_KEY = 'publish.activitiesHours';

test.describe('Publish activities & hours collapsible', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLISH_PATH);
    await page.evaluate((key) => window.sessionStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
    await page.getByTestId('act-alcohol_on-header').waitFor();
  });

  test('collapsed by default and toggles open/closed', async ({ page }) => {
    const header = page.getByTestId('act-alcohol_on-header');
    const panel = page.getByTestId('act-alcohol_on-panel');

    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('updates badges live when hours change', async ({ page }) => {
    await page.getByTestId('act-alcohol_on-header').click();
    await page.getByTestId('act-alcohol_on-Fri-enabled').check();
    await page.getByTestId('act-alcohol_on-Fri-open').fill('23:00');
    await page.getByTestId('act-alcohol_on-Fri-close').fill('02:00');

    await expect(page.getByTestId('act-alcohol_on-badges')).toContainText('Fri–Sat 23:00–02:00');
  });

  test('persists expanded state and badges across reload', async ({ page }) => {
    const alcoholHeader = page.getByTestId('act-alcohol_on-header');
    const lateRefreshmentHeader = page.getByTestId('act-late_refreshment-header');

    await alcoholHeader.click();
    await lateRefreshmentHeader.click();

    await page.getByTestId('act-alcohol_on-Fri-enabled').check();
    await page.getByTestId('act-alcohol_on-Fri-open').fill('23:00');
    await page.getByTestId('act-alcohol_on-Fri-close').fill('02:00');
    await expect(page.getByTestId('act-alcohol_on-badges')).toContainText('Fri–Sat 23:00–02:00');

    await page.reload();

    await expect(page.getByTestId('act-alcohol_on-header')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('act-alcohol_on-panel')).toBeVisible();
    await expect(page.getByTestId('act-late_refreshment-header')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('act-late_refreshment-panel')).toBeVisible();
    await expect(page.getByTestId('act-alcohol_on-badges')).toContainText('Fri–Sat 23:00–02:00');
  });
});
