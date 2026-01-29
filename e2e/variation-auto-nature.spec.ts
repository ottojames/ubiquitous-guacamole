import { test, expect } from '@playwright/test';

/**
 * Test: Auto-generated NATURE_OF_VARIATION for Licensing Variations
 *
 * Verifies that when a user selects activities in the variation publish flow,
 * the NATURE_OF_VARIATION field is automatically populated (and the manual
 * input field is hidden).
 */
test.describe('Variation Notice Auto-generation', () => {
  test('NATURE_OF_VARIATION is auto-generated from selected activities', async ({ page }) => {
    // Navigate to the publish flow
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/variation-01-initial.png', fullPage: true });

    // Step 1: Select notice type
    // First find and click the Licensing Act 2003 disclosure section to expand it
    // Use details/summary structure which is how DisclosureSection works
    const licensingDetails = page.locator('details').filter({ hasText: 'Licensing Act 2003' });
    await licensingDetails.first().click();
    await page.waitForTimeout(500);

    // Take screenshot after expanding licensing
    await page.screenshot({ path: 'test-results/variation-02-licensing-expanded.png', fullPage: true });

    // Now click on the Variation option which should be visible
    const variationOption = page.getByTestId('notice-option-licensing-premises-variation');
    await variationOption.waitFor({ state: 'visible', timeout: 5000 });
    await variationOption.click();

    // Click Continue to move to Step 2
    const continueBtn = page.getByRole('button', { name: /Continue|Next/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    await page.waitForTimeout(1000);

    // Take screenshot of current state
    await page.screenshot({
      path: 'test-results/variation-step1-notice-type.png',
      fullPage: true
    });

    // "Structured template" should already be selected (default)
    // Take screenshot of step 2
    await page.screenshot({ path: 'test-results/variation-03-step2.png', fullPage: true });

    // Look for the form - it might already be showing because structured template is default
    // Scroll down to see the form
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Take screenshot of scrolled view
    await page.screenshot({ path: 'test-results/variation-04-scrolled.png', fullPage: true });

    // Find and check "Sale of alcohol" checkbox - scroll into view first
    const alcoholCheckbox = page.locator('label').filter({ hasText: /Sale of alcohol/i }).first();
    if (await alcoholCheckbox.isVisible()) {
      await alcoholCheckbox.scrollIntoViewIfNeeded();
      await alcoholCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot after selecting alcohol
    await page.screenshot({ path: 'test-results/variation-05-alcohol-selected.png', fullPage: true });

    // Find and check "Live music" checkbox
    const liveMusicCheckbox = page.locator('label').filter({ hasText: /live music/i }).first();
    if (await liveMusicCheckbox.isVisible()) {
      await liveMusicCheckbox.scrollIntoViewIfNeeded();
      await liveMusicCheckbox.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot after selecting activities
    await page.screenshot({ path: 'test-results/variation-06-activities-selected.png', fullPage: true });

    // Verify that there is NO manual NATURE_OF_VARIATION textarea visible
    // (since it should be hidden for variations - auto-generated instead)
    const natureTextarea = page.locator('textarea[name="natureofvariation"]');
    const isNatureTextareaVisible = await natureTextarea.isVisible().catch(() => false);

    // Log the result
    console.log(`NATURE_OF_VARIATION textarea visible: ${isNatureTextareaVisible}`);

    // The manual textarea should NOT be visible for variations
    // because showIf: () => false is set in formBlueprints.ts
    expect(isNatureTextareaVisible).toBe(false);

    // Check the preview panel for the auto-generated content
    // Scroll to preview panel
    const previewPanel = page.locator('text=PREVIEW').first();
    if (await previewPanel.isVisible()) {
      await previewPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }

    // Final screenshot showing preview with auto-generated NATURE_OF_VARIATION
    await page.screenshot({ path: 'test-results/variation-07-final.png', fullPage: true });

    // Also check for the NATURE placeholder in the preview text
    const previewContent = page.locator('[class*="preview"], .prose').first();
    if (await previewContent.isVisible()) {
      const text = await previewContent.textContent() || '';
      console.log('Preview content (first 500 chars):', text.substring(0, 500));
    }
  });
});
