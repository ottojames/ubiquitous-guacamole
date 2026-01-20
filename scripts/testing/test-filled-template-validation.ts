import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testFilledTemplate() {
  console.log('🔍 Testing Filled Template Validation...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[NewPublishFlow] Template parse')) {
      console.log(`\nBROWSER: ${text}`);
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

    // Fill in all required fields using "Load example data" button
    console.log('📝 Step 2: Loading example data...');
    const loadExampleBtn = page.locator('button:has-text("Load example data")');
    if (await loadExampleBtn.isVisible()) {
      await loadExampleBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Example data loaded\n');
    } else {
      console.log('⚠️  Load example data button not found\n');
    }

    // Wait for validation
    await page.waitForTimeout(2000);

    // Check Continue button
    const continueBtn = page.locator('button:has-text("Continue")').last();
    const isEnabled = await continueBtn.isEnabled();
    console.log(`✓ Continue button enabled: ${isEnabled}\n`);

    if (isEnabled) {
      console.log('🚀 Step 3: Clicking Continue to go to Step 3...');
      await continueBtn.click();
      await page.waitForTimeout(3000);

      // Check if we're on step 3
      const step3Visible = await page.locator('text="Confirm your notice"').isVisible().catch(() => false);
      console.log(`✓ Step 3 loaded: ${step3Visible}\n`);

      if (step3Visible) {
        // Check for preview
        console.log('📄 Checking for preview...');
        const previewContainer = page.locator('.rounded-xl.border.border-slate-200').first();
        const previewText = await previewContainer.textContent().catch(() => '');

        if (previewText?.includes('No preview yet') || previewText?.includes('Loading')) {
          console.log('❌ PROBLEM: Preview shows placeholder');
          console.log(`Preview content: "${previewText?.slice(0, 200)}..."\n`);
        } else if (previewText && previewText.length > 100) {
          console.log(`✅ SUCCESS: Preview contains ${previewText.length} characters`);
          console.log(`Preview start: "${previewText.slice(0, 150)}..."\n`);
        } else {
          console.log(`⚠️  Preview content unclear: "${previewText}"\n`);
        }
      }
    }

    console.log('⏸️  Keeping browser open for 20 seconds...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFilledTemplate();
