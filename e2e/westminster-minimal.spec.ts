import { test, expect } from '@playwright/test';

test('Westminster template - minimal test', async ({ page }) => {
  console.log('🧪 Starting minimal Westminster test...');

  // Step 1: Navigate and expand category
  await page.goto('http://localhost:5173/f/wilson-partners/publish');
  await page.waitForLoadState('networkidle');

  await page.locator('summary:has-text("Licensing Act 2003")').first().click();
  await page.waitForTimeout(500);

  // Step 2: Select notice type
  await page.click('button[data-testid="notice-option-licensing-premises-new"]');
  await page.waitForTimeout(500);

  // Step 3: Click Continue
  await page.click('button[data-testid="notice-step-continue"]');
  await page.waitForTimeout(3000);
  console.log('✓ On form page');

  // Step 4: Fill ONLY the fields that appear - use a more flexible approach
  // Fill all visible, editable text inputs with some data
  const textInputs = await page.locator('input[type="text"]:not([readonly]):visible, input[type="email"]:not([readonly]):visible, input[type="date"]:not([readonly]):visible, textarea:not([readonly]):visible').all();
  console.log(`Found ${textInputs.length} fillable fields`);

  for (let i = 0; i < Math.min(textInputs.length, 15); i++) {
    const input = textInputs[i];
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const isReadonly = await input.getAttribute('readonly');

    if (isReadonly) {
      console.log(`Skipping readonly field ${i}`);
      continue;
    }

    console.log(`Filling field ${i}: name="${name}", placeholder="${placeholder}"`);

    try {
      if (name?.includes('name') || placeholder?.toLowerCase().includes('name')) {
        await input.fill('Test Value', { timeout: 2000 });
      } else if (name?.includes('date')) {
        await input.fill(new Date().toISOString().split('T')[0], { timeout: 2000 });
      } else if (name?.includes('postcode') || placeholder?.toLowerCase().includes('postcode')) {
        await input.fill('SW1A 1AA', { timeout: 2000 });
      } else {
        await input.fill('Test', { timeout: 2000 });
      }
    } catch (e) {
      console.log(`Failed to fill field ${i}: ${e.message}`);
    }
  }

  // Step 5: Select Westminster
  console.log('Selecting Westminster...');
  // Try to find the council/authority input field
  const councilInput = page.locator('input[name="authorityname"]').or(page.locator('input[placeholder*="council"]')).first();

  await councilInput.click();
  await councilInput.fill('Westminster');
  await page.waitForTimeout(1000);

  const westminsterOption = page.locator('text=Westminster City Council').first();
  await westminsterOption.click();
  await page.waitForTimeout(1000);
  console.log('✓ Selected Westminster');

  // Step 6: Try to submit
  console.log('Attempting to submit...');
  const submitBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Publish"), button:has-text("Submit")').last();
  await submitBtn.click();
  await page.waitForTimeout(3000);

  // See if we got to success or another step
  const hasSuccess = await page.locator('text=Notice Published').isVisible().catch(() => false);
  const hasError = await page.locator('text=required').isVisible().catch(() => false);

  console.log(`Status: success=${hasSuccess}, hasError=${hasError}`);

  // Take a screenshot for debugging
  await page.screenshot({ path: '/tmp/westminster-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/westminster-test.png');
});
