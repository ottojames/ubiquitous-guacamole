import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function visualCheck() {
  console.log('🔍 Visual verification test for input field rendering...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to step-1
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
    await page.waitForTimeout(1000);
    console.log('✓ Template path selected\n');

    // Check if Applicant name input is visible
    console.log('🔍 Checking Applicant name field...');

    const applicantLabel = page.locator('text=Applicant name');
    const labelVisible = await applicantLabel.isVisible();
    console.log(`  Label visible: ${labelVisible ? '✓' : '✗'}`);

    const applicantInput = page.locator('input[name="applicantname"]').first();
    const inputVisible = await applicantInput.isVisible();
    console.log(`  Input visible: ${inputVisible ? '✓' : '✗'}`);

    if (inputVisible) {
      const boundingBox = await applicantInput.boundingBox();
      console.log(`  Input bounding box: ${JSON.stringify(boundingBox)}`);

      // Try to interact with it
      await applicantInput.fill('Test Name');
      const value = await applicantInput.inputValue();
      console.log(`  Input accepts text: ${value === 'Test Name' ? '✓' : '✗'} (value: "${value}")`);
    }

    // Check other text inputs
    console.log('\n🔍 Checking other text input fields...');
    const premisesInput = page.locator('input[name="premisesname"]').first();
    const premisesVisible = await premisesInput.isVisible();
    console.log(`  Premises name input visible: ${premisesVisible ? '✓' : '✗'}`);

    // Summary
    console.log('\n📊 Summary:');
    if (labelVisible && inputVisible) {
      console.log('  ✅ SUCCESS: Input field renders correctly with label');
    } else if (labelVisible && !inputVisible) {
      console.log('  ❌ FAILURE: Label visible but input missing (original bug)');
    } else {
      console.log('  ⚠️  UNEXPECTED: Both label and input missing');
    }

    // Keep browser open for manual inspection
    console.log('\n⏸️  Keeping browser open for 20 seconds for visual inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

visualCheck();
