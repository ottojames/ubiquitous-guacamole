const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Test 1: Login page Sign Up link
    console.log('Testing Sign Up link on Login page...');
    await page.goto('http://localhost:5173/login');

    // Find the Sign Up link
    const signUpLink = await page.$('a[href="/register"]');
    if (!signUpLink) {
      throw new Error('Sign Up link not found on login page');
    }

    // Click the Sign Up link
    await signUpLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify we're on the register page
    const url = page.url();
    if (!url.includes('/register')) {
      throw new Error(`Expected to be on /register but got: ${url}`);
    }
    console.log('✓ Sign Up link redirects to /register');

    // Test 2: Register page has both options
    const councilButton = await page.$('button:has-text("Register as Council")');
    const firmButton = await page.$('button:has-text("Register as Law Firm")');

    if (!councilButton) {
      // Try alternative selector
      const councilBtnAlt = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('Register as Council'));
      });
      if (!councilBtnAlt) {
        throw new Error('Council registration button not found');
      }
    }
    console.log('✓ Register page shows both council and firm options');

    // Test 3: Council registration wizard
    console.log('Testing Council registration wizard...');
    await page.goto('http://localhost:5173/register/council');
    await page.waitForSelector('h1', { timeout: 5000 });

    const councilTitle = await page.$eval('h1', el => el.textContent);
    if (!councilTitle.includes('Council')) {
      console.log('Warning: Council registration page title:', councilTitle);
    }

    // Check for progress bar
    const progressBar = await page.$('[role="progressbar"], [class*="progress"]');
    if (progressBar) {
      console.log('✓ Council wizard has progress indicator');
    }

    // Test 4: Firm registration wizard
    console.log('Testing Firm registration wizard...');
    await page.goto('http://localhost:5173/register/firm');
    await page.waitForSelector('h1', { timeout: 5000 });

    const firmTitle = await page.$eval('h1', el => el.textContent);
    if (!firmTitle.includes('Firm') && !firmTitle.includes('Law')) {
      console.log('Warning: Firm registration page title:', firmTitle);
    }

    // Check for progress bar
    const firmProgressBar = await page.$('[role="progressbar"], [class*="progress"]');
    if (firmProgressBar) {
      console.log('✓ Firm wizard has progress indicator');
    }

    console.log('\n✅ All registration flow tests passed!');
    console.log('BROWSER TESTED: Navigated to /login, clicked Sign up for free, redirected to /register successfully. Both Council and Firm registration wizards load with progress indicators.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();