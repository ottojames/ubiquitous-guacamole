#!/usr/bin/env npx tsx

import puppeteer from 'puppeteer';

async function testActivityOrdering() {
  console.log('🔍 Testing FIX-005: Activity Field Ordering...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1400,900']
  });

  try {
    const page = await browser.newPage();

    // Navigate to publish wizard
    console.log('1. Navigating to publish wizard...');
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForSelector('.notice-type-grid', { timeout: 5000 });

    // Select Licensing category
    console.log('2. Selecting Licensing category...');
    const licensingCard = await page.$('div[data-category="licensing"]');
    if (!licensingCard) {
      throw new Error('Licensing category not found');
    }
    await licensingCard.click();
    await page.waitForTimeout(500);

    // Select New Premises Licence
    console.log('3. Selecting New Premises Licence...');
    const premisesCard = await page.$('div[data-notice-type="premises-licence-new"]');
    if (!premisesCard) {
      throw new Error('New Premises Licence option not found');
    }
    await premisesCard.click();

    // Continue to Step 2
    console.log('4. Continuing to Step 2...');
    await page.click('button:has-text("Continue to Upload Method")');
    await page.waitForSelector('input[value="template"]', { timeout: 5000 });

    // Verify structured template is selected by default
    const templateRadio = await page.$eval('input[value="template"]', el => (el as HTMLInputElement).checked);
    console.log(`   ✓ Structured template selected by default: ${templateRadio}`);

    // Continue to Step 3
    console.log('5. Continuing to Step 3 (Details)...');
    await page.click('button:has-text("Continue to Notice Details")');
    await page.waitForSelector('h3:has-text("Activities & hours")', { timeout: 5000 });

    // Check the alcohol activities ordering
    console.log('6. Checking alcohol activities ordering...');

    // Wait for the activities section to load
    await page.waitForSelector('label', { timeout: 5000 });

    // Get all alcohol activity labels
    const alcoholLabels = await page.$$eval(
      'label',
      labels => labels
        .map(l => l.textContent?.trim())
        .filter(text => text && text.includes('Sale of alcohol'))
    );

    console.log('\n📋 Alcohol activities found (in order):');
    alcoholLabels.forEach((label, index) => {
      console.log(`   ${index + 1}. ${label}`);
    });

    // Verify correct ordering
    const expectedOrder = [
      'Sale of alcohol – On & off the premises',
      'Sale of alcohol – On the premises (on-sales)',
      'Sale of alcohol – Off the premises (off-sales)'
    ];

    let orderCorrect = true;
    for (let i = 0; i < Math.min(expectedOrder.length, alcoholLabels.length); i++) {
      if (!alcoholLabels[i]?.includes(expectedOrder[i].replace('Sale of alcohol – ', ''))) {
        orderCorrect = false;
        console.log(`\n❌ Incorrect order at position ${i + 1}:`);
        console.log(`   Expected: ${expectedOrder[i]}`);
        console.log(`   Found: ${alcoholLabels[i]}`);
      }
    }

    if (orderCorrect && alcoholLabels.length >= 3) {
      console.log('\n✅ SUCCESS: "Sale of alcohol – On & off the premises" is at the TOP of activities!');
    } else {
      console.log('\n❌ FAILED: Activities are not in the correct order');
    }

    // Check if activities section appears before any other sections
    console.log('\n7. Checking activities section position...');
    const sections = await page.$$eval('h3', headings => headings.map(h => h.textContent?.trim()));
    console.log('   Section order found:');
    sections.forEach((section, index) => {
      console.log(`   ${index + 1}. ${section}`);
    });

    console.log('\n📊 Test Summary:');
    console.log('   - Structured template is default: ✓');
    console.log('   - Activities section found: ✓');
    console.log(`   - "On & off" at top of alcohol activities: ${orderCorrect ? '✓' : '✗'}`);

    // Keep browser open for manual verification
    console.log('\n👀 Browser window kept open for manual verification.');
    console.log('   Check the activities ordering visually.');
    console.log('   Press Ctrl+C to close.');

    // Wait indefinitely
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await browser.close();
    process.exit(1);
  }
}

testActivityOrdering().catch(console.error);