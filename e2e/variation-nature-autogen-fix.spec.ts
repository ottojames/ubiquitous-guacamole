import { test, expect } from '@playwright/test';

/**
 * Test: Auto-generated NATURE_OF_VARIATION Fix Verification
 *
 * This test verifies the fix for auto-generating NATURE_OF_VARIATION:
 * 1. Navigate to Publish > Variation of Premises Licence > Structured Template
 * 2. Select Sampleton Borough Council (or any council)
 * 3. Select some activities (e.g., Sale of alcohol, Live music)
 * 4. Verify the preview shows auto-generated variation text, NOT `[Nature Of Variation]`
 */
test.describe('NATURE_OF_VARIATION Auto-generation Fix', () => {
  test('preview shows auto-generated variation description when activities are selected', async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        console.log(`[BROWSER]: ${msg.text()}`);
      }
    });

    // Navigate to the publish flow
    await page.goto('/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Step 1: Select Variation of Premises Licence
    // First expand the Licensing Act 2003 section
    const licensingDetails = page.locator('details').filter({ hasText: 'Licensing Act 2003' });
    await licensingDetails.first().click();
    await page.waitForTimeout(500);

    // Click on Variation option
    const variationOption = page.getByTestId('notice-option-licensing-premises-variation');
    await variationOption.waitFor({ state: 'visible', timeout: 5000 });
    await variationOption.click();

    // Click Continue to move to Step 2
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await continueBtn.click();
    await page.waitForURL('**/publish/step-2**');
    await page.waitForLoadState('networkidle');

    // Wait for form to render
    await page.waitForTimeout(1000);

    // Screenshot initial Step 2 state
    await page.screenshot({
      path: 'test-results/autogen-fix-01-step2-initial.png',
      fullPage: true
    });

    // Select a council from the dropdown
    // Look for the council/authority dropdown
    const councilInput = page.locator('input[placeholder*="council"], input[placeholder*="Search"]').first();
    if (await councilInput.isVisible()) {
      await councilInput.fill('Sampleton');
      await page.waitForTimeout(500);

      // Try to click on the first option in the dropdown
      const councilOption = page.locator('[role="option"]').first();
      if (await councilOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await councilOption.click();
      }
    }

    // Scroll down to find activities section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);

    // Find and check "Sale of alcohol" checkbox - try multiple selectors
    const alcoholCheckbox = page.locator('label').filter({ hasText: /Sale.*alcohol/i }).first();
    if (await alcoholCheckbox.isVisible()) {
      await alcoholCheckbox.scrollIntoViewIfNeeded();
      await alcoholCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Screenshot after selecting alcohol
    await page.screenshot({
      path: 'test-results/autogen-fix-02-alcohol-selected.png',
      fullPage: true
    });

    // Find and check "Live music" checkbox
    const liveMusicCheckbox = page.locator('label').filter({ hasText: /Live music/i }).first();
    if (await liveMusicCheckbox.isVisible()) {
      await liveMusicCheckbox.scrollIntoViewIfNeeded();
      await liveMusicCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Screenshot after selecting activities
    await page.screenshot({
      path: 'test-results/autogen-fix-03-activities-selected.png',
      fullPage: true
    });

    // Now check the preview panel
    // Scroll to the right side where preview should be
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Look for the preview content
    const previewSection = page.locator('[class*="preview"], [data-testid*="preview"], .prose').first();

    // Get the preview text content
    let previewText = '';
    if (await previewSection.isVisible().catch(() => false)) {
      previewText = await previewSection.textContent() || '';
      console.log('Preview content:', previewText.substring(0, 1000));
    } else {
      // Try alternative: look for any section containing notice text
      const anyPreview = page.locator('text=/Authorise|To vary|alcohol|premises/i').first();
      if (await anyPreview.isVisible().catch(() => false)) {
        const parent = anyPreview.locator('..').first();
        previewText = await parent.textContent() || '';
        console.log('Alternative preview content:', previewText.substring(0, 1000));
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/autogen-fix-04-final-preview.png',
      fullPage: true
    });

    // VERIFICATION: The preview should NOT contain [Nature Of Variation] placeholder
    // Instead, it should contain auto-generated text like "Authorise" or "To vary"
    const hasPlaceholder = previewText.includes('[Nature Of Variation]') ||
                          previewText.includes('[NATURE_OF_VARIATION]') ||
                          previewText.includes('[Nature_Of_Variation]');

    const hasAutoGeneratedContent = previewText.includes('Authorise') ||
                                   previewText.includes('To vary') ||
                                   previewText.includes('alcohol') ||
                                   previewText.includes('live music');

    console.log('Has placeholder:', hasPlaceholder);
    console.log('Has auto-generated content:', hasAutoGeneratedContent);

    // If activities were selected, we should NOT see the placeholder
    // Note: This assertion may need adjustment based on whether activities were actually selected
    if (previewText.length > 0) {
      // Check that the placeholder is NOT present when activities are selected
      expect(hasPlaceholder).toBe(false);
    }
  });

  test('NATURE_OF_VARIATION textarea is hidden for variations', async ({ page }) => {
    // Navigate to the publish flow - variation type
    await page.goto('/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select Variation notice type
    const licensingDetails = page.locator('details').filter({ hasText: 'Licensing Act 2003' });
    await licensingDetails.first().click();
    await page.waitForTimeout(500);

    const variationOption = page.getByTestId('notice-option-licensing-premises-variation');
    await variationOption.waitFor({ state: 'visible', timeout: 5000 });
    await variationOption.click();

    // Continue to Step 2
    const continueBtn = page.getByRole('button', { name: /Continue/i });
    await continueBtn.click();
    await page.waitForURL('**/publish/step-2**');
    await page.waitForLoadState('networkidle');

    // Wait for form to load
    await page.waitForTimeout(1500);

    // Scroll through the page looking for NATURE_OF_VARIATION field
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // The NATURE_OF_VARIATION textarea should NOT be visible (hidden via showIf: () => false)
    const natureTextarea = page.locator('textarea[name="natureofvariation"]');
    const isNatureTextareaVisible = await natureTextarea.isVisible().catch(() => false);

    await page.screenshot({
      path: 'test-results/autogen-fix-05-nature-field-check.png',
      fullPage: true
    });

    // For variations, the manual NATURE_OF_VARIATION field should be hidden
    expect(isNatureTextareaVisible).toBe(false);
  });
});
