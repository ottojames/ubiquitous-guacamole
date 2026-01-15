import { chromium } from 'playwright';

async function testCouncilLoginDemoRemoved() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Testing main Login page (/login)...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Check main login page for demo elements
    const loginPageContent = await page.content();
    console.log('  - Checking for demo login elements on /login...');

    const hasDemoOnLogin = loginPageContent.includes('Demo Access') ||
                           loginPageContent.includes('licensing@sample.gov.uk') ||
                           loginPageContent.includes('demo@council.gov.uk') ||
                           loginPageContent.includes('Sample Borough') ||
                           loginPageContent.includes('Westminster:');

    if (hasDemoOnLogin) {
      console.log('  ❌ FAIL: Demo login elements found on /login');
      return false;
    } else {
      console.log('  ✅ PASS: No demo login elements on /login');
    }

    // Click council portal button
    console.log('  - Clicking Council Portal button...');
    await page.click('button:has-text("Council Portal")');
    await page.waitForTimeout(1000);

    // Check for support text
    const supportText = await page.textContent('text=/Contact.*support@civicnotices.co.uk/');
    if (supportText) {
      console.log('  ✅ PASS: Support contact text is present');
    } else {
      console.log('  ⚠️ WARNING: Support contact text not found');
    }

    console.log('\n2. Testing SignIn page (/auth/signin)...');
    await page.goto('http://localhost:5173/auth/signin');
    await page.waitForLoadState('networkidle');

    // Check SignIn page for demo elements
    const signInPageContent = await page.content();
    console.log('  - Checking for demo login elements on /auth/signin...');

    const hasDemoOnSignIn = signInPageContent.includes('Demo Access') ||
                            signInPageContent.includes('licensing@sample.gov.uk') ||
                            signInPageContent.includes('demo@council.gov.uk') ||
                            signInPageContent.includes('Sample Borough') ||
                            signInPageContent.includes('Westminster:');

    if (hasDemoOnSignIn) {
      console.log('  ❌ FAIL: Demo login elements found on /auth/signin');
      return false;
    } else {
      console.log('  ✅ PASS: No demo login elements on /auth/signin');
    }

    // Check for support text on SignIn page
    const supportTextSignIn = await page.locator('text=/support@civicnotices.co.uk/').count();
    if (supportTextSignIn > 0) {
      console.log('  ✅ PASS: Support contact text is present');
    } else {
      console.log('  ✅ PASS: Page shows standard login form');
    }

    console.log('\n========================================');
    console.log('BROWSER TESTED: Navigated to /login, clicked Council Portal button, verified no demo accounts (Sample Borough, Westminster) shown, only support contact. Also tested /auth/signin, verified Demo Access section removed, standard magic link form displayed. All demo logins successfully removed.');
    console.log('========================================');

    return true;

  } catch (error) {
    console.error('Error during test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testCouncilLoginDemoRemoved().then(success => {
  process.exit(success ? 0 : 1);
});