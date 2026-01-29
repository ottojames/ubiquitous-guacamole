import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testErrorStateVisibility() {
  console.log('🔍 Testing input visibility in error state...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate and select notice type
    console.log('📋 Step 1: Selecting notice type...');
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.locator('button:has-text("Continue")').click();
    await page.waitForLoadState('networkidle');
    console.log('✓ Notice type selected\n');

    // Choose template path
    console.log('📝 Step 2: Choosing template path...');
    const useTemplateBtn = page.locator('button:has-text("Use template")');
    await useTemplateBtn.click();
    await page.waitForTimeout(2000); // Wait for form to load
    console.log('✓ Template path selected\n');

    // Check INITIAL STATE (should have error "Invalid input: expected string, received undefined")
    console.log('🔍 Phase 1: Checking initial error state...');

    const applicantInput = page.locator('input[name="applicantname"]').first();
    const applicantError = page.locator('text=Invalid input: expected string, received undefined').first();

    const inputVisibleInitial = await applicantInput.isVisible({ timeout: 2000 }).catch(() => false);
    const errorVisibleInitial = await applicantError.isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`  Input visible in error state: ${inputVisibleInitial ? '✓' : '✗'}`);
    console.log(`  Error message visible: ${errorVisibleInitial ? '✓' : '✗'}`);

    if (inputVisibleInitial) {
      const bbox = await applicantInput.boundingBox();
      console.log(`  Input bounding box: ${JSON.stringify(bbox)}`);

      // Check computed styles
      const bgColor = await applicantInput.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const borderColor = await applicantInput.evaluate(el => window.getComputedStyle(el).borderColor);
      const width = await applicantInput.evaluate(el => window.getComputedStyle(el).width);

      console.log(`  Background color: ${bgColor}`);
      console.log(`  Border color: ${borderColor}`);
      console.log(`  Width: ${width}`);
    }

    // Try to fill the field
    console.log('\n🔍 Phase 2: Testing interaction with error field...');
    await applicantInput.fill('Test User');
    await page.waitForTimeout(1000);

    const value = await applicantInput.inputValue();
    console.log(`  Input accepts text: ${value === 'Test User' ? '✓' : '✗'} (value: "${value}")`);

    // Summary
    console.log('\n📊 Test Summary:');
    if (inputVisibleInitial && errorVisibleInitial) {
      console.log('  ✅ SUCCESS: Input field is visible even with error message');
    } else if (!inputVisibleInitial && errorVisibleInitial) {
      console.log('  ❌ FAILURE: Error visible but input invisible (BUG REPRODUCED)');
    } else if (inputVisibleInitial && !errorVisibleInitial) {
      console.log('  ⚠️  PARTIAL: Input visible but no error (unexpected state)');
    } else {
      console.log('  ⚠️  UNEXPECTED: Neither input nor error visible');
    }

    // Keep browser open
    console.log('\n⏸️  Keeping browser open for 15 seconds for visual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testErrorStateVisibility();
