// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('New publish wizard', () => {
  test('wizard stable 1→4', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish/step-1`);

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    await expect(page).toHaveURL(/\/publish\/step-2/);

    const ocrSection = page.getByTestId('upload-ocr-panel');
    await ocrSection.locator('summary').click();
    await expect(page.getByText(/drop pdf\/docx\/png\/jpg/i)).toBeVisible();

    await page.getByTestId('upload-step-continue').click();
    await expect(page).toHaveURL(/\/publish\/step-3/);

    await page.getByTestId('confirm-step-continue').click();
    await expect(page).toHaveURL(/\/publish\/step-4/);
  });

  test('renders one stepper only', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish/step-1`);
    const navigations = page.getByRole('navigation', { name: /progress/i });
    await expect(navigations).toHaveCount(1);
  });

  test('redirects once to step-1 if draft missing', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish/step-3`);
    await expect(page).toHaveURL(/\/publish\/step-1/);
    await expect(page.getByRole('alert')).toContainText(/start at step 1/i);
  });
});
