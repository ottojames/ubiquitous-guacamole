const puppeteer = require('puppeteer');

async function testFirmPaymentButton() {
  console.log('Testing US-0005: Firm Payment Button functionality...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });

    // Click Professional Portal
    console.log('2. Clicking Professional Portal...');
    const firmPortalSelector = 'button:has-text("Professional Portal"), a:has-text("Professional Portal")';
    await page.waitForSelector('[class*="bg-purple"]', { timeout: 5000 });
    await page.click('[class*="bg-purple"]');

    // Wait for sign-in page and enter credentials
    console.log('3. Entering credentials...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'lawyer@testfirm.com');
    await page.type('input[type="password"]', 'testpass123');

    // Click Sign In
    console.log('4. Clicking Sign In...');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    console.log('5. Waiting for dashboard...');
    await page.waitForSelector('[class*="Make Payment"]', { timeout: 10000 })
      .catch(() => page.waitForSelector('text="Make Payment"', { timeout: 5000 }))
      .catch(() => page.waitForSelector('a[href*="/billing"]', { timeout: 5000 }));

    console.log('✅ Dashboard loaded successfully');

    // Look for Make Payment button/link
    console.log('6. Looking for Make Payment button...');
    const makePaymentExists = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => el.textContent?.includes('Make Payment'));
    });

    if (makePaymentExists) {
      console.log('✅ Make Payment button found');

      // Click on Make Payment
      console.log('7. Clicking Make Payment button...');
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button'));
        const makePaymentElement = elements.find(el => el.textContent?.includes('Make Payment'));
        if (makePaymentElement) makePaymentElement.click();
      });

      // Wait for billing page
      await page.waitForTimeout(2000);

      // Check current URL
      const currentUrl = page.url();
      console.log('8. Current URL:', currentUrl);

      if (currentUrl.includes('/billing')) {
        console.log('✅ Successfully navigated to billing page');

        // Check if billing page has content
        const pageContent = await page.evaluate(() => {
          return document.body.textContent || '';
        });

        if (pageContent.includes('Billing') || pageContent.includes('Payment') || pageContent.includes('Invoice')) {
          console.log('✅ Billing page loaded with content');
          console.log('\n✅ US-0005 PASSED: Make Payment button works correctly!');
        } else {
          console.log('⚠️ Billing page loaded but may be empty or have errors');
        }
      } else {
        console.log('❌ Did not navigate to billing page');
        console.log('❌ US-0005 FAILED: Make Payment button does not navigate correctly');
      }
    } else {
      console.log('❌ Make Payment button not found on dashboard');
      console.log('❌ US-0005 FAILED: Make Payment button missing');
    }

  } catch (error) {
    console.error('Error during test:', error.message);
    console.log('❌ US-0005 FAILED: Test encountered an error');
  } finally {
    await browser.close();
  }
}

testFirmPaymentButton();