import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testStep3Preview() {
  console.log('🔍 Testing Step 3 Preview Generation...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[NewPublishFlow]') || text.includes('[TemplateBuilderForm]') || text.includes('Template')) {
      console.log(`BROWSER: ${text}`);
    }
  });

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

    // Fill in minimal required fields
    console.log('📝 Step 2: Filling required fields...');

    // Council
    const councilInput = page.locator('input[name="authorityname"]').first();
    await councilInput.fill('Brighton');
    await page.waitForTimeout(1000);
    const councilOption = page.locator('role=option').first();
    await councilOption.click();
    await page.waitForTimeout(500);
    console.log('  ✓ Council selected');

    // Applicant name
    const applicantName = page.locator('input[name="applicant_name"]').first();
    await applicantName.fill('Test Applicant');
    console.log('  ✓ Applicant name filled');

    // Applicant address - just fill manual fields
    const addressLine1 = page.locator('input[name="applicant_addressLine1"]').first();
    await addressLine1.fill('9 Lower Park Road');

    const addressCity = page.locator('input[name="applicant_addressCity"]').first();
    await addressCity.fill('Chesterfield');

    const addressPostcode = page.locator('input[name="applicant_addressPostcode"]').first();
    await addressPostcode.fill('S40 1PB');
    console.log('  ✓ Applicant address filled');

    // Premises address
    const premisesLine1 = page.locator('input[name="premises_addressLine1"]').first();
    await premisesLine1.fill('123 Test Street');

    const premisesCity = page.locator('input[name="premises_addressCity"]').first();
    await premisesCity.fill('Brighton');

    const premisesPostcode = page.locator('input[name="premises_addressPostcode"]').first();
    await premisesPostcode.fill('BN1 1AA');
    console.log('  ✓ Premises address filled');

    // Wait for form to update
    await page.waitForTimeout(1000);

    // Check if Continue button is enabled
    const continueBtn = page.locator('button:has-text("Continue")').last();
    const isEnabled = await continueBtn.isEnabled();
    console.log(`  Continue button enabled: ${isEnabled ? '✓' : '✗'}\n`);

    if (!isEnabled) {
      console.log('❌ Continue button is disabled - cannot proceed to step 3');
      console.log('\nKeeping browser open for 30 seconds for manual inspection...');
      await page.waitForTimeout(30000);
      return;
    }

    // Click Continue to go to Step 3
    console.log('🚀 Step 3: Navigating to confirmation page...');
    await continueBtn.click();
    await page.waitForTimeout(3000);

    // Check if we're on step 3
    const step3Visible = await page.locator('text=/step 3/i').isVisible().catch(() => false);
    console.log(`  Step 3 loaded: ${step3Visible ? '✓' : '✗'}`);

    // Look for preview content
    console.log('\n📄 Checking preview content...');
    const previewContainer = page.locator('.rounded-xl.border.border-slate-200').first();
    const previewExists = await previewContainer.isVisible().catch(() => false);
    console.log(`  Preview container exists: ${previewExists ? '✓' : '✗'}`);

    if (previewExists) {
      const previewText = await previewContainer.textContent();
      console.log(`  Preview text length: ${previewText?.length || 0} chars`);

      if (previewText?.includes('No preview yet') || previewText?.includes('Loading')) {
        console.log('  ❌ PROBLEM: Preview shows placeholder instead of rendered notice');
        console.log(`  Preview content: "${previewText?.slice(0, 200)}..."`);
      } else {
        console.log('  ✓ Preview contains generated notice text');
      }
    }

    // Wait to see console logs
    console.log('\n⏸️  Waiting 5 seconds for console logs to appear...');
    await page.waitForTimeout(5000);

    console.log('\n--- End of console logs ---\n');
    console.log('⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testStep3Preview();
