import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testAddressLookup() {
  console.log('🔍 Testing Address Lookup Functionality...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
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

    // Test APPLICANT ADDRESS lookup
    console.log('🗺️  Testing Applicant Address Lookup...');
    const applicantLookup = page.locator('[data-testid="applicant_address-lookup"]').first();

    const lookupExists = await applicantLookup.count();
    console.log(`  Lookup field exists: ${lookupExists > 0 ? '✓' : '✗'}`);

    if (lookupExists === 0) {
      console.log('  ❌ PROBLEM: Address lookup field not found!');
      return;
    }

    const isVisible = await applicantLookup.isVisible();
    console.log(`  Lookup field visible: ${isVisible ? '✓' : '✗'}`);

    // Fill in the lookup
    console.log('\n  Filling address lookup with "9 lower park road ches"...');
    await applicantLookup.fill('9 lower park road ches');
    await page.waitForTimeout(2000);

    // Check if dropdown appears
    const dropdown = page.locator('role=listbox');
    const dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Dropdown appeared: ${dropdownVisible ? '✓' : '✗'}`);

    if (dropdownVisible) {
      const options = await page.locator('role=option').count();
      console.log(`  Options in dropdown: ${options}`);

      // Select first option
      const firstOption = page.locator('role=option').first();
      const optionText = await firstOption.textContent();
      console.log(`  First option: "${optionText}"`);

      await firstOption.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Option selected');

      // Check if AddressFields populated
      console.log('\n  Checking if address fields populated...');

      const line1 = page.locator('input[name="applicant_addressLine1"]').first();
      const line1Value = await line1.inputValue().catch(() => '');
      console.log(`  Address Line 1: "${line1Value}" ${line1Value ? '✓' : '✗'}`);

      const postcode = page.locator('input[name="applicant_addressPostcode"]').first();
      const postcodeValue = await postcode.inputValue().catch(() => '');
      console.log(`  Postcode: "${postcodeValue}" ${postcodeValue ? '✗ MISSING!' : '✓'}`);

      const city = page.locator('input[name="applicant_addressCity"]').first();
      const cityValue = await city.inputValue().catch(() => '');
      console.log(`  City: "${cityValue}" ${cityValue ? '✓' : '✗'}`);

      // Check if the main APPLICANT_ADDRESS field was updated
      console.log('\n  Checking main APPLICANT_ADDRESS field...');
      const mainAddressValue = await page.evaluate(() => {
        // Try to find any hidden input or check the draft state
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        const addressInput = inputs.find((input: any) =>
          input.name?.toLowerCase().includes('applicant') &&
          input.name?.toLowerCase().includes('address') &&
          !input.name?.toLowerCase().includes('line') &&
          !input.name?.toLowerCase().includes('city') &&
          !input.name?.toLowerCase().includes('postcode')
        );
        return (addressInput as any)?.value || 'not found';
      });
      console.log(`  Main address field value: "${mainAddressValue}"`);

    } else {
      console.log('  ❌ PROBLEM: Dropdown did not appear!');

      // Debug: Check what's in the DOM
      const lookupValue = await applicantLookup.inputValue();
      console.log(`  Lookup input value: "${lookupValue}"`);
    }

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testAddressLookup();
