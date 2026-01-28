import { test, expect } from '@playwright/test';

test('Navigate through variation publish flow', async ({ page }) => {
  // Navigate to step 1
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('Step 1: Loaded page');

  // Click on the "Licensing Act 2003" section to expand it
  await page.click('text=Licensing Act 2003');
  await page.waitForTimeout(500);

  console.log('Step 2: Expanded Licensing Act 2003 section');
  await page.screenshot({ path: '/tmp/licensing-section-expanded.png', fullPage: true });

  // Now click on "Variation" or "Variation of Premises Licence"
  const variationOption = page.locator('text=/variation.*premises/i').or(
    page.locator('button:has-text("Variation")')
  ).first();

  await variationOption.click();
  await page.waitForTimeout(1000);

  console.log('Step 3: Selected Variation option');
  await page.screenshot({ path: '/tmp/variation-selected.png', fullPage: true });

  // Look for and click "Structured Template" button
  const structuredButton = page.locator('button:has-text("Structured Template")').or(
    page.locator('text=Structured Template')
  ).first();

  const isStructuredVisible = await structuredButton.isVisible().catch(() => false);
  console.log('Structured Template button visible:', isStructuredVisible);

  if (isStructuredVisible) {
    await structuredButton.click();
    await page.waitForTimeout(1000);
    console.log('Step 4: Clicked Structured Template');
  } else {
    // Maybe need to click Continue first
    const continueButton = page.locator('button:has-text("Continue")').first();
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(1000);
      console.log('Step 4: Clicked Continue instead');
    }
  }

  // Wait for step 2 to load
  await page.waitForURL('**/publish/step-2**', { timeout: 10000 }).catch(() => {
    console.log('Did not navigate to step-2, current URL:', page.url());
  });

  await page.screenshot({ path: '/tmp/step-2-variation-form.png', fullPage: true });

  // Check for "Nature of variation" field
  const natureField = page.locator('label:has-text("Nature of variation")').or(
    page.locator('text=/nature.*variation/i')
  );
  const isNatureVisible = await natureField.isVisible().catch(() => false);
  console.log('Nature of Variation field visible:', isNatureVisible);

  // Check for preview panel
  const previewPanel = page.locator('[class*="preview"]').or(
    page.locator('text=/preview/i').locator('..')
  ).first();
  const hasPreview = await previewPanel.count() > 0;
  console.log('Preview panel exists:', hasPreview);

  // List all form labels for debugging
  const labels = await page.locator('label').allTextContents();
  console.log('Form labels found:', labels.slice(0, 10));

  // Try to find and interact with licensing authority dropdown
  const councilDropdown = page.locator('input[placeholder*="council"]').or(
    page.locator('input[placeholder*="authority"]')
  ).or(
    page.locator('select')
  ).first();

  if (await councilDropdown.isVisible().catch(() => false)) {
    console.log('Found licensing authority dropdown');
    await councilDropdown.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/step-2-dropdown-clicked.png', fullPage: true });

    // Try to select first option
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/step-2-council-selected.png', fullPage: true });

      // Check if preview has content now
      const previewText = await page.locator('[class*="preview"]').textContent().catch(() => '');
      console.log('Preview content length:', previewText.length);
      console.log('Preview content sample:', previewText.substring(0, 200));
    }
  }
});
