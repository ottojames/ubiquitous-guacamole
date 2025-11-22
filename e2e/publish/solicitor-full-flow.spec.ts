// @ts-nocheck
/**
 * Solicitor Publish Flow E2E Test
 *
 * Tests the complete flow for a solicitor publishing a premises licence notice
 * using the structured template builder (not OCR upload).
 *
 * This is the critical flow for the Thursday Bristol Council demo.
 */

import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Solicitor: Complete Publish Flow', () => {
  test('Complete premises licence publication with activities & hours', async ({ page }) => {
    // STEP 1: Select Notice Type
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    // Expand the "Licensing" category (collapsed by default)
    const licensingDisclosure = page.locator('details:has-text("Licensing")');
    await licensingDisclosure.click();

    // Select "New premises licence"
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await expect(page.getByTestId('notice-option-licensing-premises-new')).toHaveClass(/bg-blue/);

    // Continue to Step 2
    await page.getByTestId('notice-step-continue').click();
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // STEP 2: Choose structured template (not OCR)
    await page.getByTestId('upload-method-template').click();

    // Fill confirmation email
    await page.getByLabel(/confirmation email/i).fill('solicitor@wilsonpartners.com');

    // Fill applicant details
    await page.getByLabel(/applicant name/i).fill('Wilson & Partners LLP');
    await page.getByLabel(/applicant status/i).selectOption('llp');
    await page.getByLabel(/applicant address/i).fill('123 High Street, Bristol, BS1 2AA');

    // Fill premises details
    await page.getByLabel(/premises name/i).fill('The Red Lion');
    await page.getByLabel(/premises address/i).fill('45 Old Market Street, Bristol, BS2 0EJ');

    // ACTIVITIES & HOURS SECTION - This is the critical part for the demo

    // First, verify the "no activities selected" warning appears
    await expect(page.getByText(/select at least one licensable activity/i)).toBeVisible();

    // Select "Sale of alcohol - On premises"
    const alcoholOnCheckbox = page.locator('#activity-alcohol_on');
    await alcoholOnCheckbox.check();

    // The activity panel should expand
    const alcoholPanel = alcoholOnCheckbox.locator('xpath=ancestor::div[contains(@class, "rounded-xl")]/div[last()]');
    await expect(alcoholPanel).toBeVisible();

    // Verify warning about setting hours appears
    await expect(alcoholPanel.getByText(/set at least one day's hours/i)).toBeVisible();

    // Use the quick action to set weekday hours
    await alcoholPanel.getByRole('button', { name: /copy to weekdays/i }).click();

    // Set Monday hours as 11:00 - 23:00
    await page.locator('#Mon-start').fill('11:00');
    await page.locator('#Mon-end').fill('23:00');

    // Click "Copy to weekdays" to apply to Tue-Fri
    await alcoholPanel.getByRole('button', { name: /copy to weekdays/i }).click();

    // Set different weekend hours
    await page.locator('#Sat-start').fill('10:00');
    await page.locator('#Sat-end').fill('00:00');
    await page.locator('#Sun-start').fill('12:00');
    await page.locator('#Sun-end').fill('22:00');

    // Verify the "hours not set" warning is gone
    await expect(alcoholPanel.getByText(/set at least one day's hours/i)).not.toBeVisible();

    // Now the DPS (Designated Premises Supervisor) section should appear
    await expect(page.getByText(/designated premises supervisor/i)).toBeVisible();

    // Fill DPS details (REQUIRED when alcohol is selected)
    await page.getByLabel(/dps name/i).fill('Jane Smith');
    await page.getByLabel(/dps licensing authority/i).fill('Bristol City Council');

    // Select "Live music" as well
    const liveMusicCheckbox = page.locator('#activity-live_music');
    await liveMusicCheckbox.check();

    // Set live music hours (Fri-Sat only)
    await page.locator('#activity-live_music').locator('xpath=ancestor::div[contains(@class, "rounded-xl")]').within(async (panel) => {
      await page.locator('#Fri-start').fill('20:00');
      await page.locator('#Fri-end').fill('23:00');
      await page.locator('#Sat-start').fill('20:00');
      await page.locator('#Sat-end').fill('00:00');
    });

    // Fill dates
    const today = new Date();
    const applicationDate = today.toISOString().split('T')[0];
    const deadlineDate = new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await page.getByLabel(/application date/i).fill(applicationDate);
    // Deadline should auto-fill to 28 days later
    await expect(page.getByLabel(/representation deadline/i)).toHaveValue(deadlineDate);

    // Fill authority details
    await page.getByLabel(/licensing authority name/i).fill('Bristol City Council');
    await page.getByLabel(/authority email/i).fill('licensing@bristol.gov.uk');

    // Verify the Continue button is now enabled
    const continueButton = page.getByTestId('upload-step-continue');
    await expect(continueButton).toBeEnabled();

    // Verify right-rail checklist shows all fields complete
    await expect(page.getByText(/confirmation email/i)).toHaveClass(/text-emerald/);
    await expect(page.getByText(/applicant name/i)).toHaveClass(/text-emerald/);

    // Continue to Step 3
    await continueButton.click();
    await expect(page).toHaveURL(/\/publish\/step-3/);

    // STEP 3: Review and Confirm

    // Verify the preview shows the generated notice text
    await expect(page.getByText(/The Red Lion/i)).toBeVisible();
    await expect(page.getByText(/Wilson & Partners LLP/i)).toBeVisible();
    await expect(page.getByText(/sale of alcohol/i)).toBeVisible();
    await expect(page.getByText(/live music/i)).toBeVisible();

    // Continue to Step 4 (Payment)
    await page.getByTestId('confirm-step-continue').click();
    await expect(page).toHaveURL(/\/publish\/step-4/);

    // STEP 4: Payment & Submit

    // Verify the notice summary is shown
    await expect(page.getByText(/The Red Lion/i)).toBeVisible();

    // For this test, we'll skip actual submission to avoid creating test data
    // In production, solicitor would click "Submit and Pay"

    console.log('✓ Complete solicitor publish flow test PASSED');
  });

  test('Validation: Cannot proceed without activities selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    const licensingDisclosure = page.locator('details:has-text("Licensing")');
    await licensingDisclosure.click();

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Choose template mode
    await page.getByTestId('upload-method-template').click();

    // Fill email
    await page.getByLabel(/confirmation email/i).fill('test@example.com');

    // Fill all other required fields EXCEPT activities
    await page.getByLabel(/applicant name/i).fill('Test Applicant');
    await page.getByLabel(/applicant address/i).fill('Test Address, BS1 1AA');
    await page.getByLabel(/premises name/i).fill('Test Premises');
    await page.getByLabel(/premises address/i).fill('Test Address, BS1 1AA');

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/application date/i).fill(today);

    await page.getByLabel(/licensing authority name/i).fill('Test Council');

    // Verify warning is shown
    await expect(page.getByText(/select at least one licensable activity/i)).toBeVisible();

    // Continue button should be DISABLED
    await expect(page.getByTestId('upload-step-continue')).toBeDisabled();
  });

  test('Validation: DPS required when alcohol selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    const licensingDisclosure = page.locator('details:has-text("Licensing")');
    await licensingDisclosure.click();

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    await page.getByTestId('upload-method-template').click();
    await page.getByLabel(/confirmation email/i).fill('test@example.com');

    // Fill minimal required fields
    await page.getByLabel(/applicant name/i).fill('Test Applicant');
    await page.getByLabel(/applicant address/i).fill('Test Address, BS1 1AA');
    await page.getByLabel(/premises name/i).fill('Test Premises');
    await page.getByLabel(/premises address/i).fill('Test Address, BS1 1AA');

    // Select alcohol activity
    await page.locator('#activity-alcohol_on').check();

    // Set hours
    await page.locator('#Mon-start').fill('11:00');
    await page.locator('#Mon-end').fill('23:00');

    // DPS section should appear
    await expect(page.getByText(/designated premises supervisor/i)).toBeVisible();

    // Try to continue WITHOUT filling DPS - should be blocked
    await expect(page.getByTestId('upload-step-continue')).toBeDisabled();

    // Fill DPS name
    await page.getByLabel(/dps name/i).fill('Test DPS');

    // Complete dates and authority
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/application date/i).fill(today);
    await page.getByLabel(/licensing authority name/i).fill('Test Council');

    // Now Continue should be ENABLED
    await expect(page.getByTestId('upload-step-continue')).toBeEnabled();
  });
});
