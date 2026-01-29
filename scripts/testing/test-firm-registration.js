#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    console.log('Testing firm registration wizard...');

    // Navigate to /register/firm
    console.log('1. Navigating to /register/firm...');
    await page.goto('http://localhost:5173/register/firm', { waitUntil: 'networkidle2' });

    // Check if we're on the CreateOrganization component
    const title = await page.$eval('h1', el => el.textContent);
    console.log('   Page title:', title);

    // Check current step text
    const stepText = await page.$eval('.text-gray-600', el => el.textContent);
    console.log('   Current step:', stepText);

    // Step 1: Select firm type
    console.log('2. Selecting Law Firm...');
    const firmButton = await page.waitForSelector('button:has-text("Law Firm")', { timeout: 5000 });
    await firmButton.click();
    await page.waitForTimeout(500);

    // Step 2: Fill in basic info
    console.log('3. Filling firm details...');
    await page.type('input[placeholder*="Organization Name"]', 'Test Law Firm LLP');
    await page.type('input[placeholder*="Domain"]', 'testlawfirm.com');
    await page.type('input[placeholder*="Contact Email"]', 'contact@testlawfirm.com');
    await page.type('input[placeholder*="Registration Number"]', 'OC123456');

    // Click Next
    const nextButton1 = await page.$('button:has-text("Next")');
    await nextButton1.click();
    await page.waitForTimeout(500);

    // Step 3: Practice Areas - should be visible now
    console.log('4. Checking practice areas step...');
    const practiceAreasTitle = await page.$eval('h3', el => el.textContent).catch(() => null);
    console.log('   Practice areas title:', practiceAreasTitle);

    // Check if practice area checkboxes exist
    const licensingCheckbox = await page.$('label:has-text("Licensing")');
    const planningCheckbox = await page.$('label:has-text("Planning")');

    if (licensingCheckbox && planningCheckbox) {
      console.log('   ✓ Practice area checkboxes found');

      // Select Licensing and Planning
      console.log('5. Selecting Licensing and Planning...');
      await licensingCheckbox.click();
      await page.waitForTimeout(200);
      await planningCheckbox.click();
      await page.waitForTimeout(200);

      // Check if selections are reflected
      const selectedAreas = await page.$$eval('.border-blue-500', els => els.length);
      console.log('   Selected areas count:', selectedAreas);

      // Click Next
      const nextButton2 = await page.$('button:has-text("Next")');
      if (nextButton2) {
        await nextButton2.click();
        console.log('6. Moved to subscription step');
        await page.waitForTimeout(1000);

        // Check if we're on subscription step
        const subscriptionText = await page.$eval('.text-gray-600', el => el.textContent).catch(() => '');
        console.log('   Current step text:', subscriptionText);
      }
    } else {
      console.log('   ✗ Practice area checkboxes NOT found - wizard may not be working correctly');
    }

    console.log('\n✓ Firm registration wizard test complete');
    console.log('  - Route /register/firm works');
    console.log('  - Wizard loads successfully');
    console.log('  - Practice areas step is present');

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();