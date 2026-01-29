import { test, expect } from '@playwright/test';

test('Complete variation form verification with screenshots', async ({ page }) => {
  console.log('=== STARTING VERIFICATION ===\n');

  // Navigate to step 1
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  console.log('1. Loaded step 1');

  // Expand Licensing Act 2003
  await page.click('text=Licensing Act 2003');
  await page.waitForTimeout(500);
  console.log('2. Expanded Licensing Act 2003 section');

  // Click "Premises Licence — Variation"
  const variationCard = page.locator('text=Premises Licence — Variation');
  await variationCard.click();
  await page.waitForTimeout(1000);
  console.log('3. Selected Variation notice type');

  // Click Continue
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(2000);
  console.log('4. Clicked Continue to step 2');

  // Should be on step 2 - click "Structured template"
  await page.waitForURL('**/publish/step-2**');
  await page.click('button:has-text("Structured template")');
  await page.waitForTimeout(2000);
  console.log('5. Selected Structured Template approach');

  await page.screenshot({ path: '/tmp/variation-structured-form-top.png', fullPage: false });

  // Scroll down to find Nature of variation field
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/variation-form-middle.png', fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/variation-form-bottom.png', fullPage: false });

  // Take full page screenshot
  await page.screenshot({ path: '/tmp/variation-form-full.png', fullPage: true });
  console.log('6. Captured form screenshots');

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Find all labels
  const allLabels = await page.locator('label').allTextContents();
  console.log('\n=== ALL FORM LABELS ===');
  allLabels.forEach((label, idx) => {
    console.log(`${idx + 1}. ${label}`);
  });

  // Check specifically for Nature of variation
  const hasNatureOfVariation = allLabels.some(label =>
    label.toLowerCase().includes('nature of variation')
  );
  console.log('\n=== NATURE OF VARIATION CHECK ===');
  console.log('Found "Nature of variation" in labels:', hasNatureOfVariation);

  // Try to find the field by scrolling to it
  const natureField = page.locator('label:has-text("Nature of variation")');
  if (await natureField.count() > 0) {
    await natureField.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/nature-of-variation-field.png' });
    console.log('Nature of variation field is in the DOM');
  }

  // Check for preview panel
  console.log('\n=== PREVIEW PANEL CHECK ===');
  const previewPanel = page.locator('[class*="preview"]');
  const previewCount = await previewPanel.count();
  console.log('Elements with "preview" class:', previewCount);

  if (previewCount > 0) {
    const previewText = await previewPanel.first().textContent();
    console.log('Preview panel text length:', previewText?.length || 0);
    if (previewText && previewText.length > 50) {
      console.log('Preview has content (first 200 chars):', previewText.substring(0, 200));
    }
  }

  // Check for licensing authority dropdown
  console.log('\n=== LICENSING AUTHORITY DROPDOWN CHECK ===');
  const councilLabel = page.locator('label:has-text("Licensing authority")');
  if (await councilLabel.count() > 0) {
    await councilLabel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Find the associated input/select
    const councilInput = page.locator('input[id*="council"], input[id*="authority"], [role="combobox"]').first();
    if (await councilInput.isVisible().catch(() => false)) {
      console.log('Licensing authority dropdown found and visible');

      // Try to interact with it
      await councilInput.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/council-dropdown-opened.png' });

      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      console.log('Dropdown options available:', optionCount);

      if (optionCount > 0) {
        // Select first council
        await options.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/council-selected-with-preview.png', fullPage: true });
        console.log('Selected a council from dropdown');

        // Re-check preview panel
        const updatedPreviewText = await previewPanel.first().textContent().catch(() => '');
        console.log('Preview text after council selection (length):', updatedPreviewText.length);
        console.log('Preview shows content:', updatedPreviewText.length > 100);
      }
    }
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
});
