import { chromium } from 'playwright';

async function testFirmDashboard() {
  console.log('Testing firm dashboard in detail...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to firm dashboard
    console.log('1. Navigating to firm dashboard...');
    await page.goto('http://localhost:5173/f/wilson-partners/dashboard');
    await page.waitForTimeout(3000); // Give time to load

    console.log('2. Current URL:', page.url());

    // Check page title
    const pageTitle = await page.title();
    console.log('3. Page title:', pageTitle);

    // Look for dashboard-specific content
    console.log('4. Checking dashboard content...');

    // Check for quick action cards
    const quickActions = await page.locator('.rounded-xl, .border-2').count();
    console.log('   Found', quickActions, 'card elements');

    // Look for specific payment-related elements
    const paymentElements = await page.locator('text=/payment|billing|invoice/i').allTextContents();
    console.log('   Payment-related text found:', paymentElements);

    // Check for links with billing in href
    const billingLinks = await page.locator('a[href*="billing"]').count();
    console.log('   Found', billingLinks, 'billing links');

    // Get all visible link hrefs
    const allLinks = await page.locator('a:visible').evaluateAll(links =>
      links.map(link => ({ text: link.textContent?.trim(), href: link.getAttribute('href') }))
    );
    console.log('5. All visible links:', JSON.stringify(allLinks, null, 2));

    // Try the direct billing link from navigation
    console.log('6. Testing direct billing navigation...');
    const billingNavLink = await page.locator('a:has-text("Billing")').first();

    if (await billingNavLink.isVisible()) {
      console.log('   Found Billing link in navigation');
      await billingNavLink.click();
      await page.waitForTimeout(2000);

      const afterClickUrl = page.url();
      console.log('   After clicking Billing nav:', afterClickUrl);

      if (afterClickUrl.includes('/billing')) {
        console.log('   ✓ Successfully navigated to billing page via nav menu');

        // Check billing page content
        const pageContent = await page.locator('body').textContent();
        if (pageContent?.includes('invoice') || pageContent?.includes('payment') || pageContent?.includes('billing')) {
          console.log('   ✓ Billing page contains expected content');
        }
        return true;
      }
    }

    // Check if we're actually authenticated
    const signOutLink = await page.locator('a:has-text("Sign Out")').count();
    if (signOutLink > 0) {
      console.log('7. User is authenticated (Sign Out link present)');
    } else {
      console.log('7. User may not be authenticated');
    }

    return false;
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testFirmDashboard().then(success => {
  if (success) {
    console.log('\n✓ Billing navigation works via menu');
  } else {
    console.log('\n✗ Could not verify billing navigation');
  }
  process.exit(success ? 0 : 1);
});