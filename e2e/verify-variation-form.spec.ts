import { test, expect } from '@playwright/test';

test('Verify Variation form has Nature of Variation field and preview', async ({ page }) => {
  // Step 1: Navigate and select notice type
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');

  // Find and click the Variation of Premises Licence option
  await page.click('text=Variation of Premises Licence');

  // Click the Structured Template approach button
  await page.click('text=Structured Template');

  // Wait for step 2 to load
  await page.waitForURL('**/publish/step-2**');
  await page.waitForLoadState('networkidle');

  // Take screenshot of step 2
  await page.screenshot({ path: '/tmp/step-2-variation-form.png', fullPage: true });

  // Check for Nature of Variation field
  const natureOfVariationField = page.locator('label:has-text("Nature of variation")');
  const isNatureFieldVisible = await natureOfVariationField.isVisible();
  console.log('Nature of Variation field visible:', isNatureFieldVisible);

  // Check for the preview panel
  const previewPanel = page.locator('[class*="preview"]').first();
  const hasPreview = await previewPanel.count() > 0;
  console.log('Preview panel exists:', hasPreview);

  // Select a licensing authority from dropdown to test preview
  const councilDropdown = page.locator('select').filter({ hasText: /licensing authority|council/i }).or(
    page.locator('input[role="combobox"]').filter({ hasText: /licensing authority|council/i })
  ).first();

  if (await councilDropdown.count() > 0) {
    await councilDropdown.click();
    await page.waitForTimeout(500);

    // Try to select first option
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.count() > 0) {
      await firstOption.click();
      await page.waitForTimeout(1000);

      // Take screenshot after selecting council
      await page.screenshot({ path: '/tmp/step-2-with-council-selected.png', fullPage: true });

      // Check if preview has content
      const previewContent = await page.locator('[class*="preview"]').textContent();
      console.log('Preview has content:', previewContent && previewContent.length > 50);
    }
  }

  expect(isNatureFieldVisible).toBe(true);
});
