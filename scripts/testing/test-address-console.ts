import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testAddressWithConsole() {
  console.log('🔍 Testing Address with Console Logging...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[AddressAutocomplete]') || text.includes('[TemplateBuilderForm]')) {
      console.log(`BROWSER: ${text}`);
    }
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
    await page.waitForTimeout(2000);
    console.log('✓ Template form loaded\n');

    // Test address lookup
    console.log('🗺️  Filling address lookup...');
    const applicantLookup = page.locator('[data-testid="applicant_address-lookup"]').first();
    await applicantLookup.fill('9 lower park road ches');
    await page.waitForTimeout(2000);

    // Select first option
    const firstOption = page.locator('role=option').first();
    console.log('Clicking first option...\n');
    await firstOption.click();
    await page.waitForTimeout(3000);

    console.log('\n--- End of console logs ---\n');

    // Check postcode field
    const postcode = page.locator('input[name="applicant_addressPostcode"]').first();
    const postcodeValue = await postcode.inputValue();
    console.log(`\n📮 Final postcode value: "${postcodeValue}"`);

    // Keep browser open
    console.log('\n⏸️  Keeping browser open for 20 seconds...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAddressWithConsole();
