const { chromium } = require('playwright');

(async () => {
  console.log('Starting automated organization creation...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error));

  try {
    // Navigate to dev sign-in
    console.log('1. Navigating to dev sign-in page...');
    await page.goto('http://localhost:5173/auth/dev');
    await page.waitForLoadState('networkidle');

    // Click sign in button
    console.log('2. Clicking sign in button...');
    await page.click('button:has-text("Sign In as Test User")');

    // Wait for navigation to complete - give more time
    console.log('3. Waiting for redirect...');
    await page.waitForTimeout(3000); // Wait 3 seconds for callback processing

    const currentUrl = page.url();
    console.log('4. Current URL after sign-in:', currentUrl);

    // If stuck on callback, manually navigate
    if (currentUrl.includes('/auth/callback')) {
      console.log('5. Still on callback, manually navigating to create organization...');
      await page.goto('http://localhost:5173/onboarding/create-organization');
      await page.waitForLoadState('networkidle');
    }

    // Now we should be on create organization page
    if (page.url().includes('create-organization')) {
      console.log('4. On organization creation page, filling form...');

      // Step 1: Select Council
      await page.click('button:has-text("Council")');
      await page.waitForTimeout(500);

      // Step 2: Fill basic info
      console.log('6. Filling organization details...');
      await page.fill('input[placeholder*="Sampleton Borough Council"]', 'Test Council');
      await page.fill('input[placeholder*="sampleton.gov.uk"]', 'test.gov.uk');
      await page.fill('input[placeholder*="contact@sampleton.gov.uk"]', 'ottoclarke@icloud.com');
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);

      // Step 3: Add department
      console.log('7. Adding licensing department...');
      await page.fill('input[placeholder*="Licensing Department"]', 'Licensing Department');
      await page.fill('input[type="email"][placeholder*="licensing@sampleton.gov.uk"]', 'ottoclarke@icloud.com');
      await page.click('button:has-text("+ Add Department")');
      await page.waitForTimeout(1000);

      // Go to review
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(500);

      // Step 4: Create organization
      console.log('8. Creating organization...');
      await page.click('button:has-text("Create Organization")');

      // Wait for redirect to dashboard - longer timeout
      console.log('9. Waiting for dashboard redirect...');
      await page.waitForTimeout(5000);

      const finalUrl = page.url();
      console.log('10. Final URL:', finalUrl);

      if (finalUrl.includes('/c/') && finalUrl.includes('/dashboard')) {
        console.log('\n✅ SUCCESS! On dashboard!');
        await page.screenshot({ path: '/tmp/dashboard-success.png', fullPage: true });
        console.log('Screenshot saved to /tmp/dashboard-success.png');
      } else {
        console.log('⚠️  Not on dashboard yet, current page:', finalUrl);
        await page.screenshot({ path: '/tmp/final-page.png', fullPage: true });

        // Check for error messages
        const errorText = await page.locator('text=/Failed|Error/i').first().textContent().catch(() => null);
        if (errorText) {
          console.error('Found error on page:', errorText);
        }
      }

      // Keep browser open for 5 seconds
      await page.waitForTimeout(5000);

    } else if (page.url().includes('/c/')) {
      console.log('Already on dashboard! URL:', page.url());
      await page.screenshot({ path: '/tmp/dashboard-existing.png', fullPage: true });
    } else {
      console.log('Unexpected page:', page.url());
      await page.screenshot({ path: '/tmp/unexpected-page.png', fullPage: true });
    }

    console.log('\n✅ Process complete.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    console.error('Screenshot saved to /tmp/error-screenshot.png');
    console.error('Current URL:', page.url());
    throw error;
  } finally {
    await browser.close();
  }
})();
