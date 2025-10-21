import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testContinueButtonValidation() {
  console.log('🔍 Testing Continue Button Validation Logic...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to template form
    console.log('📋 Step 1: Navigating to template form...');
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.locator('button:has-text("Continue")').click();
    await page.waitForLoadState('networkidle');

    const useTemplateBtn = page.locator('button:has-text("Use template")');
    await useTemplateBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Template form loaded\n');

    // Test 1: Continue button should be DISABLED when form is empty
    console.log('📝 Test 1: Empty form - Continue should be disabled');
    const continueBtn = page.locator('button:has-text("Continue")').last();
    let isEnabled = await continueBtn.isEnabled();
    console.log(`  Continue button enabled: ${isEnabled ? '❌ FAIL (should be disabled)' : '✅ PASS (correctly disabled)'}\n`);

    // Test 2: Fill ONLY applicant name - Continue should still be disabled
    console.log('📝 Test 2: Partial form (1 field) - Continue should be disabled');
    const applicantName = page.locator('input[name="applicant_name"]').first();
    if (await applicantName.isVisible()) {
      await applicantName.fill('Test Applicant');
      await page.waitForTimeout(500);
      isEnabled = await continueBtn.isEnabled();
      console.log(`  Continue button enabled: ${isEnabled ? '❌ FAIL (should be disabled)' : '✅ PASS (correctly disabled)'}\n`);
    } else {
      console.log('  ⚠️  applicant_name field not found\n');
    }

    // Test 3: Fill more fields but not all - Continue should still be disabled
    console.log('📝 Test 3: Partial form (multiple fields) - Continue should be disabled');
    const authorityInput = page.locator('input[name="authorityname"]').first();
    if (await authorityInput.isVisible()) {
      await authorityInput.fill('Brighton');
      await page.waitForTimeout(1000);
      const option = page.locator('role=option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }

    // Fill premises address fields
    const premisesLine1 = page.locator('input[name="premises_addressLine1"]').first();
    if (await premisesLine1.isVisible()) {
      await premisesLine1.fill('123 Test Street');
      await page.waitForTimeout(300);
    }

    const premisesCity = page.locator('input[name="premises_addressCity"]').first();
    if (await premisesCity.isVisible()) {
      await premisesCity.fill('Brighton');
      await page.waitForTimeout(300);
    }

    const premisesPostcode = page.locator('input[name="premises_addressPostcode"]').first();
    if (await premisesPostcode.isVisible()) {
      await premisesPostcode.fill('BN1 1AA');
      await page.waitForTimeout(500);
    }

    isEnabled = await continueBtn.isEnabled();
    console.log(`  Continue button enabled: ${isEnabled ? '❌ FAIL (should be disabled)' : '✅ PASS (correctly disabled)'}\n`);

    // Test 4: Load ALL example data - Continue should be ENABLED
    console.log('📝 Test 4: Complete form (all fields) - Continue should be enabled');
    const loadExampleBtn = page.locator('button:has-text("Load example data")');
    if (await loadExampleBtn.isVisible()) {
      await loadExampleBtn.click();
      await page.waitForTimeout(2000);
      isEnabled = await continueBtn.isEnabled();
      console.log(`  Continue button enabled: ${isEnabled ? '✅ PASS (correctly enabled)' : '❌ FAIL (should be enabled)'}\n`);

      if (isEnabled) {
        // Test 5: Verify we can actually navigate to Step 3
        console.log('📝 Test 5: Navigation to Step 3 with complete form');
        await continueBtn.click();
        await page.waitForTimeout(3000);

        const step3Visible = await page.locator('text="Confirm your notice"').isVisible().catch(() => false);
        console.log(`  Step 3 loaded: ${step3Visible ? '✅ PASS' : '❌ FAIL'}\n`);

        if (step3Visible) {
          // Test 6: Verify preview exists
          console.log('📝 Test 6: Preview generation at Step 3');
          const previewContainer = page.locator('.rounded-xl.border.border-slate-200').first();
          const previewText = await previewContainer.textContent().catch(() => '');

          if (previewText && previewText.length > 100 && !previewText.includes('No preview yet')) {
            console.log(`  Preview generated: ✅ PASS (${previewText.length} characters)`);
          } else {
            console.log(`  Preview generated: ❌ FAIL`);
            console.log(`  Preview content: "${previewText?.slice(0, 200)}..."`);
          }
        }
      }
    } else {
      console.log('  ⚠️  Load example data button not found\n');
    }

    console.log('\n⏸️  Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testContinueButtonValidation();
