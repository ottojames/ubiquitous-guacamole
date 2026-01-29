#!/usr/bin/env npx tsx

import { chromium } from 'playwright';

async function testCouncilDropdown() {
  console.log('🔍 Testing FIX-006: Council dropdown single-click fix');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();

    // Navigate to the publish wizard where council dropdown is used
    console.log('📍 Navigating to publish wizard step 3...');
    await page.goto('http://localhost:5173/publish/step-1');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click through to step 3 where council dropdown is
    console.log('📝 Looking for notice type cards...');

    // Try to find the premises licence card
    const card = await page.locator('div:has-text("Premises Licence Application") >> nth=0').first();
    if (await card.isVisible()) {
      await card.click();
    } else {
      // Try alternative selector
      await page.click('text=/Premises.*Licence/i >> nth=0');
    }

    await page.click('button:has-text("Continue")');

    // On step 2, select structured template
    console.log('📋 Selecting structured template...');
    await page.waitForSelector('text=Use structured template', { timeout: 5000 });
    await page.click('text=Use structured template');
    await page.click('text=Continue');

    // On step 3, test the council dropdown
    console.log('🏛️ Testing council dropdown...');
    await page.waitForSelector('input[placeholder*="council"]', { timeout: 5000 });

    // Type to search
    await page.fill('input[placeholder*="council"]', 'Westminster');

    // Wait for dropdown to appear
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

    // Count clicks needed
    console.log('👆 Clicking on Westminster option...');
    const beforeValue = await page.inputValue('input[placeholder*="council"]');

    // Single click on the option
    await page.click('text=Westminster Council >> nth=0');

    // Check if value was selected
    const afterValue = await page.inputValue('input[placeholder*="council"]');

    if (beforeValue !== afterValue && afterValue.includes('Westminster')) {
      console.log('✅ SUCCESS: Council selected with single click!');
      console.log('   Selected value:', afterValue);
    } else {
      console.log('❌ FAILED: Council not selected or required multiple clicks');
      console.log('   Before:', beforeValue);
      console.log('   After:', afterValue);
    }

    // Test again with a different council to be sure
    console.log('\n🏛️ Testing with another council...');
    await page.fill('input[placeholder*="council"]', 'Leeds');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

    const beforeValue2 = await page.inputValue('input[placeholder*="council"]');
    await page.click('text=Leeds City Council >> nth=0');
    const afterValue2 = await page.inputValue('input[placeholder*="council"]');

    if (beforeValue2 !== afterValue2 && afterValue2.includes('Leeds')) {
      console.log('✅ SUCCESS: Second council also selected with single click!');
      console.log('   Selected value:', afterValue2);
    } else {
      console.log('❌ FAILED: Second council not selected properly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n📊 Test complete');
  }
}

testCouncilDropdown().catch(console.error);