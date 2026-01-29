#!/usr/bin/env npx tsx
/**
 * Test script for FIX-002: Fix Address Search Double-Click Issue and Default to Map View
 *
 * Acceptance Criteria:
 * 1. Single click on address in dropdown must immediately trigger search
 * 2. After address selection, default to map view (not list view)
 * 3. Dropdown should appear within 500ms of typing valid postcode
 * 4. Remove need for second click on dropdown items
 */

import puppeteer from 'puppeteer';

async function testAddressSearch() {
  console.log('🧪 Testing FIX-002: Address Search Double-Click and Map View Default\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Navigate to notices page
    console.log('1️⃣  Navigating to notices page...');
    await page.goto('http://localhost:5173/notices', { waitUntil: 'networkidle0' });

    // Find the address search input
    const searchInput = await page.waitForSelector('input[placeholder*="postcode"]', { timeout: 5000 });
    console.log('✓ Found address search input');

    // Type a postcode and measure time until dropdown appears
    console.log('\n2️⃣  Testing dropdown appearance speed (should be within 500ms)...');
    const startTime = Date.now();
    await searchInput.type('SW1A 1AA');

    // Wait for dropdown to appear
    await page.waitForSelector('[role="listbox"]', { timeout: 1000 });
    const dropdownTime = Date.now() - startTime;
    console.log(`✓ Dropdown appeared in ${dropdownTime}ms ${dropdownTime <= 500 ? '✅ (within 500ms)' : '⚠️ (exceeds 500ms)'}`);

    // Count initial clicks on page
    console.log('\n3️⃣  Testing single-click selection (no double-click needed)...');

    // Wait a moment for addresses to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all address suggestions
    const addressOptions = await page.$$('[role="option"]');
    console.log(`✓ Found ${addressOptions.length} address suggestions`);

    // Click the first address (single click only)
    if (addressOptions.length > 0) {
      console.log('Clicking first address in dropdown...');
      await addressOptions[0].click();
      console.log('✓ Single click executed on address');

      // Wait for navigation/search to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we're in map view (not list view)
      console.log('\n4️⃣  Verifying default to map view after search...');

      // Check URL parameters
      const currentUrl = page.url();
      const urlParams = new URLSearchParams(new URL(currentUrl).search);
      const viewMode = urlParams.get('view');

      if (viewMode === 'map') {
        console.log('✅ SUCCESS: Default view is MAP after address selection');
        console.log(`   Current URL: ${currentUrl}`);
      } else if (!viewMode || viewMode === 'list') {
        console.log('❌ FAIL: View defaulted to LIST instead of MAP');
        console.log(`   Current URL: ${currentUrl}`);
        console.log(`   View parameter: ${viewMode || 'not set (defaults to list)'}`);
      }

      // Also check for map element presence
      const mapElement = await page.$('#map-container, .maplibregl-map, .mapboxgl-map');
      if (mapElement) {
        console.log('✓ Map element is present on page');
      } else {
        console.log('⚠️ Map element not found on page');
      }

      // Check that dropdown has closed (single click should close it)
      const dropdownStillOpen = await page.$('[role="listbox"]');
      if (!dropdownStillOpen) {
        console.log('✓ Dropdown closed after selection (no second click needed)');
      } else {
        console.log('⚠️ Dropdown still open after click');
      }

    } else {
      console.log('❌ No address suggestions found in dropdown');
    }

    console.log('\n✅ Test Complete!');
    console.log('\nSummary:');
    const finalUrl = page.url();
    const finalUrlParams = new URLSearchParams(new URL(finalUrl).search);
    console.log(`- Dropdown speed: ${dropdownTime}ms ${dropdownTime <= 500 ? '✅' : '❌'}`);
    console.log(`- Single click works: ${!await page.$('[role="listbox"]') ? '✅' : '❌'}`);
    console.log(`- Defaults to map view: ${finalUrlParams.get('view') === 'map' ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAddressSearch().catch(console.error);