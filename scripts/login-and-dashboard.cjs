const { chromium } = require('playwright');

(async () => {
  console.log('Opening dashboard...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to dev sign-in
    console.log('1. Signing in...');
    await page.goto('http://localhost:5173/auth/dev');
    await page.waitForLoadState('networkidle');

    // Click sign in button
    await page.click('button:has-text("Sign In as Test User")');
    await page.waitForTimeout(2000);

    // Navigate directly to dashboard
    console.log('2. Navigating to dashboard...');
    await page.goto('http://localhost:5173/c/test-council/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('3. Dashboard URL:', page.url());

    if (page.url().includes('/dashboard')) {
      console.log('\n✅ SUCCESS! You are now on the dashboard!');
      console.log('Keep this browser window open to explore the portal.');

      // Keep browser open indefinitely
      await new Promise(() => {});
    } else {
      console.log('⚠️ Not on dashboard, current page:', page.url());
      await page.screenshot({ path: '/tmp/current-page.png', fullPage: true });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    await browser.close();
  }
})();
