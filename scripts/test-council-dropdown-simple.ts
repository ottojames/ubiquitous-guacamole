#!/usr/bin/env npx tsx

import { chromium } from 'playwright';

async function testCouncilDropdown() {
  console.log('🔍 Testing FIX-006: Council dropdown single-click fix (simplified)');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();

    // Go directly to step 3 with notice type pre-selected
    console.log('📍 Navigating directly to step 3...');
    await page.goto('http://localhost:5173/publish/step-3');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for council dropdown
    console.log('🏛️ Looking for council dropdown...');

    // Find the input field (may have different placeholder text)
    const inputs = await page.$$('input[type="text"]');
    console.log(`   Found ${inputs.length} text inputs`);

    // Find the council input (usually has placeholder about selecting council)
    let councilInput = null;
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      console.log(`   Input placeholder: "${placeholder}"`);
      if (placeholder && placeholder.toLowerCase().includes('council')) {
        councilInput = input;
        break;
      }
    }

    if (!councilInput) {
      // Try finding by label
      councilInput = await page.$('label:has-text("council") + input, label:has-text("Council") + input, label:has-text("authority") + input, label:has-text("Authority") + input');
    }

    if (!councilInput) {
      console.log('❌ Could not find council input field');
      return;
    }

    console.log('✓ Found council input field');

    // Type to search
    await councilInput.fill('Westminster');

    // Wait for dropdown to appear
    console.log('⏳ Waiting for dropdown...');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    console.log('✓ Dropdown appeared');

    // Get initial value
    const beforeValue = await councilInput.inputValue();
    console.log(`   Before click: "${beforeValue}"`);

    // Single click on the option
    console.log('👆 Clicking on Westminster option...');
    const option = await page.$('[role="listbox"] [role="option"]:has-text("Westminster")');
    if (option) {
      await option.click();
    } else {
      await page.click('[role="listbox"] >> text=Westminster >> nth=0');
    }

    // Wait a moment for selection to register
    await page.waitForTimeout(500);

    // Check if value was selected
    const afterValue = await councilInput.inputValue();
    console.log(`   After click: "${afterValue}"`);

    if (beforeValue !== afterValue && afterValue.includes('Westminster')) {
      console.log('✅ SUCCESS: Council selected with single click!');
    } else {
      console.log('⚠️  Value not changed or doesn\'t include Westminster');

      // Check if dropdown is still open
      const dropdownStillOpen = await page.$('[role="listbox"]');
      if (dropdownStillOpen) {
        console.log('❌ FAILED: Dropdown still open - requires second click');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n📊 Test complete');
  }
}

testCouncilDropdown().catch(console.error);