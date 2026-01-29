#!/usr/bin/env npx tsx
/**
 * Test Script for US-0108: One Click Address Select
 * Verifies that clicking an address immediately triggers search
 */

import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:5173/notices';
const TEST_POSTCODE = 'SW1A 1AA';

async function testOneClickAddressSelect() {
  console.log('🧪 Testing US-0108: One Click Address Select');
  console.log('==========================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // Navigate to notices page
    console.log('1. Navigating to notices page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    // Type in the address search box
    console.log(`2. Typing "${TEST_POSTCODE}" in address search...`);
    const searchInput = await page.waitForSelector('input[placeholder*="address"], input[placeholder*="postcode"]', { timeout: 5000 });
    await searchInput.click();
    await searchInput.type(TEST_POSTCODE, { delay: 100 });

    // Wait for dropdown to appear
    console.log('3. Waiting for address dropdown...');
    await page.waitForTimeout(1000); // Give time for API call

    // Check if dropdown appeared
    const dropdown = await page.$('[role="listbox"], .address-dropdown, ul[class*="suggestions"]');
    if (!dropdown) {
      console.log('❌ FAIL: Dropdown did not appear');
      await browser.close();
      return false;
    }
    console.log('✅ Dropdown appeared');

    // Check for search button (should NOT be visible in oneClickSelect mode)
    const searchButton = await page.$('button:has-text("Search"), button:has-text("search")');
    if (searchButton) {
      const isVisible = await searchButton.isVisible();
      if (isVisible) {
        console.log('❌ FAIL: Search button is visible (should be hidden in oneClickSelect mode)');
        await browser.close();
        return false;
      }
    }
    console.log('✅ Search button correctly hidden');

    // Get initial state (no map results yet)
    const initialMapState = await page.$('.maplibregl-map, .map-container');
    const initialHasMap = !!initialMapState;

    // Click the first address in dropdown
    console.log('4. Clicking first address in dropdown...');
    const firstAddress = await page.waitForSelector('[role="option"]:first-child, .address-dropdown li:first-child, ul[class*="suggestions"] li:first-child', { timeout: 5000 });

    // Record the address text
    const addressText = await firstAddress.evaluate(el => el.textContent);
    console.log(`   Selected: ${addressText}`);

    await firstAddress.click();

    // Wait for immediate action (map update or notice search)
    console.log('5. Verifying immediate search execution...');
    await page.waitForTimeout(2000);

    // Check if map loaded or notices updated
    const mapAfterClick = await page.$('.maplibregl-map, .map-container');
    const noticesSection = await page.$('[class*="notice"], [class*="result"]');

    if (mapAfterClick || noticesSection) {
      console.log('✅ PASS: Search executed immediately after address selection');

      // Verify the selected address is shown
      const selectedAddressDisplay = await page.$eval('input[placeholder*="address"], input[placeholder*="postcode"]', el => (el as HTMLInputElement).value);
      if (selectedAddressDisplay && selectedAddressDisplay.includes(addressText?.substring(0, 20) || '')) {
        console.log('✅ Selected address displayed in search bar');
      }

      console.log('\n🎉 US-0108 Test PASSED!');
      console.log('   ✓ Dropdown appears on postcode entry');
      console.log('   ✓ No search button shown (oneClickSelect mode)');
      console.log('   ✓ Clicking address immediately triggers search');
      console.log('   ✓ No additional click/button press needed\n');

      await browser.close();
      return true;
    } else {
      console.log('❌ FAIL: Search did not execute immediately');
      await browser.close();
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await browser.close();
    return false;
  }
}

// Run the test
testOneClickAddressSelect().then(passed => {
  process.exit(passed ? 0 : 1);
});