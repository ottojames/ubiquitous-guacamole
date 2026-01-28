import { test, expect } from '@playwright/test';

test('Verify Variation form fields and preview', async ({ page }) => {
  // Step 1: Navigate to publish flow
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Step 2: Expand Licensing Act 2003 section
  await page.click('text=Licensing Act 2003');
  await page.waitForTimeout(500);

  // Step 3: Click on the "Premises Licence — Variation" card
  const variationCard = page.locator('text=Premises Licence — Variation').locator('..');
  await variationCard.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: '/tmp/after-selecting-variation-card.png', fullPage: true });

  // Step 4: Wait for Continue button to be enabled and click it
  const continueButton = page.locator('button:has-text("Continue")');
  await continueButton.waitFor({ state: 'visible', timeout: 5000 });

  // Check if it's enabled
  const isEnabled = await continueButton.isEnabled();
  console.log('Continue button enabled:', isEnabled);

  if (isEnabled) {
    await continueButton.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('Continue button still disabled, checking what needs to be selected');
    const bodyText = await page.locator('body').textContent();
    console.log('Current page state:', bodyText?.substring(0, 500));
  }

  // Step 5: Should be on step 2 now - check URL
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  await page.screenshot({ path: '/tmp/step-2-initial.png', fullPage: true });

  // Step 6: Check for "Nature of variation" field
  const natureLabels = await page.locator('label').allTextContents();
  console.log('All form labels:', natureLabels);

  const natureField = page.locator('label:text-is("Nature of variation")').or(
    page.locator('label:has-text("Nature of variation")')
  ).or(
    page.locator('text=/nature.*variation/i')
  );

  const natureFieldVisible = await natureField.isVisible().catch(() => false);
  console.log('Nature of Variation field visible:', natureFieldVisible);

  // Step 7: Check for preview panel
  const previewElements = await page.locator('[class*="preview"]').count();
  console.log('Elements with "preview" in class:', previewElements);

  // Step 8: Try to find licensing authority dropdown
  const allInputs = await page.locator('input[type="text"], input[role="combobox"]').all();
  console.log('Number of text inputs found:', allInputs.length);

  const councilInput = page.locator('input').filter({
    hasText: /licensing authority|council/i
  }).or(
    page.locator('input[placeholder*="council" i]')
  ).or(
    page.locator('input[placeholder*="authority" i]')
  ).first();

  const councilInputVisible = await councilInput.isVisible().catch(() => false);
  console.log('Council/authority input visible:', councilInputVisible);

  if (councilInputVisible) {
    await councilInput.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/dropdown-opened.png', fullPage: true });

    // Try to select an option
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    console.log('Dropdown options found:', optionCount);

    if (optionCount > 0) {
      await options.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/after-selecting-council.png', fullPage: true });

      // Check preview content
      const previewPanel = page.locator('[class*="preview"]').first();
      if (await previewPanel.isVisible().catch(() => false)) {
        const previewText = await previewPanel.textContent();
        console.log('Preview text length:', previewText?.length || 0);
        console.log('Preview text sample:', previewText?.substring(0, 300));
      }
    }
  }

  // Final summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('1. Navigated to Step 2:', currentUrl.includes('step-2'));
  console.log('2. Nature of Variation field visible:', natureFieldVisible);
  console.log('3. Preview panel exists:', previewElements > 0);
  console.log('4. Council dropdown visible:', councilInputVisible);
});
