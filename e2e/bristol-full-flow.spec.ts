import { test, expect } from '@playwright/test';

test('Navigate to template form and check Bristol Council', async ({ page }) => {
  // Enable detailed console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CouncilDepartmentSelect]') || text.includes('Bristol') || text.includes('Sampleton')) {
      console.log('🔍 BROWSER:', text);
    }
  });

  // Step 1: Navigate to publish flow
  console.log('Step 1: Navigate to /publish/step-1');
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');

  // Step 2: Select a licensing notice type
  console.log('Step 2: Select Premises Licence notice type');

  // Take screenshot to see what's on the page
  await page.screenshot({ path: '/tmp/step-1-loaded.png', fullPage: true });

  // Try to find the button with data-testid
  const premisesButton = page.locator('[data-testid="notice-option-licensing-premises-new"]');
  const count = await premisesButton.count();
  console.log(`Found ${count} premises licence buttons`);

  if (count > 0) {
    const isVisible = await premisesButton.isVisible();
    console.log(`Button visible: ${isVisible}`);

    // Force click even if hidden
    await premisesButton.click({ force: true });
    console.log('✓ Clicked Premises Licence button');
  } else {
    throw new Error('Premises Licence button not found');
  }

  // Step 3: Click Next to go to step-2
  console.log('Step 3: Click Next button');
  await page.waitForTimeout(500); // Brief wait for UI to update
  const nextButton = page.locator('button:has-text("Next")').first();
  await nextButton.click({ force: true });

  // Wait for step-2
  await page.waitForURL(/step-2/, { timeout: 10000 });
  console.log('✓ On step-2');

  // Step 4: Select "Build from template"
  console.log('Step 4: Click Build from template');
  await page.waitForTimeout(1000); // Wait for step to load
  const templateButton = page.locator('button:has-text("Build from template"), label:has-text("Build from template")').first();
  await templateButton.click({ force: true });
  await page.waitForTimeout(2000); // Wait for form to load
  console.log('✓ Clicked Build from template');

  // Screenshot
  await page.screenshot({ path: '/tmp/template-form-loaded.png', fullPage: true });

  // Step 5: Find council input
  console.log('Step 5: Looking for council input field...');
  const councilInput = page.locator('input[name="authorityname"]').first();
  await councilInput.waitFor({ timeout: 10000 });

  console.log('✓ Found council input');

  // Step 6: Click and type
  console.log('Step 6: Clicking council input and typing "bristol"');
  await councilInput.click();
  await page.waitForTimeout(1000);

  await councilInput.fill('bristol');
  await page.waitForTimeout(2000);

  // Screenshot after typing
  await page.screenshot({ path: '/tmp/typed-bristol.png', fullPage: true });

  // Step 7: Check what appears
  console.log('Step 7: Checking dropdown contents...');

  const bodyText = await page.textContent('body');

  if (bodyText?.includes('Bristol Council')) {
    console.log('✅ SUCCESS: Bristol Council found in dropdown!');

    // Try to click it
    const bristolOption = page.locator('text=Bristol Council').first();
    await bristolOption.click();

    console.log('✅ Clicked Bristol Council option');
  } else if (bodyText?.includes('Sampleton')) {
    console.log('❌ FAIL: Still showing Sampleton (old static data)');
    throw new Error('Old CouncilSelect component is still being used');
  } else {
    console.log('❌ FAIL: No dropdown options visible');
    console.log('Page text:', bodyText?.substring(0, 500));
    throw new Error('Dropdown not showing any options');
  }

  // Final assertion
  expect(bodyText).toContain('Bristol Council');
});
