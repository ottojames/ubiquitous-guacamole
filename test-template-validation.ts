import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function captureTemplateValidation() {
  console.log('🔍 Capturing Template Validation Errors...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    const text = msg.text();
    console.log(`BROWSER: ${text}`);
  });

  try {
    // Navigate to template form
    console.log('📋 Navigating to template form...');
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.locator('button:has-text("Continue")').click();
    await page.waitForLoadState('networkidle');

    const useTemplateBtn = page.locator('button:has-text("Use template")');
    await useTemplateBtn.click();
    await page.waitForTimeout(3000);
    console.log('✓ Template form loaded\n');

    console.log('\n--- Waiting 10 seconds to capture all console logs ---\n');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

captureTemplateValidation();
