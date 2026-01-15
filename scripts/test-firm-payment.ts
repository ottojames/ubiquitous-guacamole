import { chromium } from 'playwright';

async function testFirmPayment() {
  console.log('Testing firm payment button...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Navigate to firm login
    console.log('1. Navigating to firm portal...');
    await page.goto('http://localhost:5173/f/wilson-partners/dashboard');

    // Check if redirected to login
    if (page.url().includes('/sign-in') || page.url().includes('/login')) {
      console.log('2. Redirected to login page, signing in...');

      // Try to login
      await page.fill('input[type="email"], input[name="email"], #email', 'solicitor@wilsonpartners.com');
      await page.fill('input[type="password"], input[name="password"], #password', 'testpass123');

      // Click sign in button
      await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Sign In"), button:has-text("Login")');

      // Wait for navigation
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
        console.log('Note: Login may have failed, continuing...');
      });
    }

    // 3. Check if on dashboard
    console.log('3. Checking dashboard page...');
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // 4. Look for the payment button
    console.log('4. Looking for Make Payment button...');
    const paymentButton = await page.locator('a:has-text("Make Payment"), button:has-text("Make Payment")').first();

    if (await paymentButton.isVisible()) {
      console.log('   ✓ Make Payment button found');

      // Get the href attribute if it's a link
      const href = await paymentButton.getAttribute('href').catch(() => null);
      console.log('   Button href:', href);

      // 5. Click the payment button
      console.log('5. Clicking Make Payment button...');
      await paymentButton.click();

      // Wait for navigation
      await page.waitForTimeout(2000);

      // 6. Check if navigated to billing page
      const newUrl = page.url();
      console.log('6. After click URL:', newUrl);

      if (newUrl.includes('/billing')) {
        console.log('   ✓ Successfully navigated to billing page');

        // Check for billing page content
        const billingTitle = await page.locator('h1, h2').filter({ hasText: /billing|payment|invoice/i }).first();
        if (await billingTitle.isVisible()) {
          const titleText = await billingTitle.textContent();
          console.log('   ✓ Billing page loaded with title:', titleText);
        }

        // Check for invoice content
        const invoiceElements = await page.locator('text=/invoice|amount|payment/i').count();
        console.log('   Found', invoiceElements, 'billing-related elements on page');

        return true;
      } else {
        console.log('   ✗ Did not navigate to billing page');
        console.log('   Expected URL to contain /billing');
        return false;
      }
    } else {
      console.log('   ✗ Make Payment button not found');

      // Try to find any buttons or links on the page
      const allButtons = await page.locator('button, a').allTextContents();
      console.log('   Available buttons/links:', allButtons.slice(0, 10));
      return false;
    }
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testFirmPayment().then(success => {
  if (success) {
    console.log('\n✓ BROWSER TESTED: Navigated to firm dashboard, clicked Make Payment button, successfully opened billing page');
    process.exit(0);
  } else {
    console.log('\n✗ Test failed: Payment button did not work as expected');
    process.exit(1);
  }
});