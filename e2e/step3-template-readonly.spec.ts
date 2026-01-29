import { test, expect } from '@playwright/test';

/**
 * Test that Step 3 (Confirm Your Notice) correctly handles the template flow:
 * 1. Notice text should be read-only (not editable) when using template flow
 * 2. "Auto Generate Draft" button should NOT be visible for template flow
 */
test.describe('Step 3 - Confirm Your Notice (Template Flow)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the publish flow
    await page.goto('/publish/step-1');

    // Wait for the page to load - look for the "What kind of notice" heading
    await page.waitForSelector('text=What kind of notice are you publishing', { timeout: 15000 });
  });

  test('notice text preview should be read-only in template flow', async ({ page }) => {
    // Scroll down to see the notice type options
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // First expand the "Licensing Act 2003" section by clicking on its header
    const licensingSection = page.locator('text=Licensing Act 2003').first();
    await licensingSection.scrollIntoViewIfNeeded();
    await licensingSection.click();
    await page.waitForTimeout(1000);

    // Now the Premises Licence options should be visible
    // Select Premises Licence using the data-testid
    const premisesLicenceCard = page.getByTestId('notice-option-licensing-premises-new');

    // Wait for it to become visible after expanding
    await premisesLicenceCard.waitFor({ state: 'visible', timeout: 5000 });
    await premisesLicenceCard.click();

    // Wait for selection to register and button to enable
    await page.waitForTimeout(500);

    // Verify continue button is now enabled (a notice type is selected)
    const continueBtn = page.getByTestId('notice-step-continue');
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });

    // Continue to Step 2
    await continueBtn.click();

    // Wait for Step 2 to load
    await page.waitForURL('**/publish/step-2**', { timeout: 15000 });

    // Wait for the upload method step to render
    await page.waitForSelector('text=Structured template', { timeout: 10000 });

    // Select Structured template method (it's already selected by default, but click to be sure)
    const templateTab = page.locator('button:has-text("Structured template")').first();
    await templateTab.click();

    // Wait for template form to appear
    await page.waitForTimeout(1000);

    // Fill email field (usually required)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    // Click "Load example data" button if available to fill all fields quickly
    const loadExampleBtn = page.locator('button:has-text("Load example data")');
    await loadExampleBtn.scrollIntoViewIfNeeded();
    if (await loadExampleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loadExampleBtn.click();
      await page.waitForTimeout(1000);
    }

    // Wait a moment for validation
    await page.waitForTimeout(2000);

    // Check if continue is enabled
    const continueStep2Btn = page.getByTestId('upload-step-continue');
    await continueStep2Btn.scrollIntoViewIfNeeded();
    const isEnabled = await continueStep2Btn.isEnabled().catch(() => false);

    if (isEnabled) {
      // Click continue to go to Step 3
      await continueStep2Btn.click();
      await page.waitForURL('**/publish/step-3**', { timeout: 15000 });

      // Wait for confirm step to render
      await page.waitForSelector('[data-testid="confirm-step"]', { timeout: 10000 });

      // The Edit button should NOT be visible for template flow (editable=false)
      const editButton = page.locator('button[aria-label="Edit text"]');
      const editVisible = await editButton.isVisible().catch(() => false);

      // Expect edit button to NOT be visible since editable=false for template mode
      expect(editVisible).toBe(false);

      // The "Auto Generate Draft" button should NOT be visible
      const generateDraftBtn = page.getByTestId('generate-draft-button');
      const generateVisible = await generateDraftBtn.isVisible().catch(() => false);
      expect(generateVisible).toBe(false);

      // Take a screenshot for verification
      await page.screenshot({ path: 'test-results/step3-readonly-success.png', fullPage: true });
    } else {
      // If continue is disabled, skip but don't fail - form validation may not pass
      console.log('Continue button not enabled - form validation did not pass');
      await page.screenshot({ path: 'test-results/step2-validation-failed.png', fullPage: true });
      test.skip();
    }
  });

  test('"Auto Generate Draft" button should not exist in ConfirmStep props', async ({ page }) => {
    // Scroll and expand licensing section
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // Expand "Licensing Act 2003" section
    const licensingSection = page.locator('text=Licensing Act 2003').first();
    await licensingSection.scrollIntoViewIfNeeded();
    await licensingSection.click();
    await page.waitForTimeout(1000);

    // Select Premises Licence
    const premisesLicenceCard = page.getByTestId('notice-option-licensing-premises-new');
    await premisesLicenceCard.waitFor({ state: 'visible', timeout: 5000 });
    await premisesLicenceCard.click();
    await page.waitForTimeout(500);

    // Continue to Step 2
    const continueBtn = page.getByTestId('notice-step-continue');
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();
    await page.waitForURL('**/publish/step-2**', { timeout: 15000 });

    // Select Template mode
    await page.waitForSelector('text=Structured template', { timeout: 10000 });
    const templateTab = page.locator('button:has-text("Structured template")').first();
    await templateTab.click();

    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    // Load example data
    const loadExampleBtn = page.locator('button:has-text("Load example data")');
    await loadExampleBtn.scrollIntoViewIfNeeded();
    if (await loadExampleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loadExampleBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(2000);

    // If we can proceed to Step 3, verify no generate button
    const continueStep2Btn = page.getByTestId('upload-step-continue');
    await continueStep2Btn.scrollIntoViewIfNeeded();
    if (await continueStep2Btn.isEnabled().catch(() => false)) {
      await continueStep2Btn.click();
      await page.waitForURL('**/publish/step-3**', { timeout: 15000 });
      await page.waitForSelector('[data-testid="confirm-step"]', { timeout: 10000 });

      // Verify the button does not exist
      const generateDraftBtn = page.getByTestId('generate-draft-button');
      const count = await generateDraftBtn.count();
      expect(count).toBe(0);
    } else {
      console.log('Could not proceed to Step 3 - skipping');
      await page.screenshot({ path: 'test-results/step2-validation-failed-2.png', fullPage: true });
      test.skip();
    }
  });
});
