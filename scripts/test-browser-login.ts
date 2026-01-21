import { chromium } from '@playwright/test';

async function testLogin() {
  console.log('Launching Chrome browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Login') || text.includes('[UnifiedAuthContext') || text.includes('[FirmLayout')) {
      console.log('BROWSER:', text);
    }
  });

  let professionalPassed = false;
  let councilPassed = false;
  let adminPassed = false;

  try {
    console.log('\n=== TEST 1: PROFESSIONAL PORTAL ===');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    // Click Professional Portal
    console.log('Clicking Professional Portal...');
    await page.click('text=Professional Portal');
    await page.waitForTimeout(500);

    // Fill credentials
    console.log('Filling credentials...');
    await page.fill('#email', 'ottoclarke@icloud.com');
    await page.fill('#password', 'AdminPass2026!');

    // Click Sign in
    console.log('Clicking Sign in...');
    await page.click('button[type="submit"]');

    // Wait for redirect AND dashboard content
    console.log('Waiting for redirect and dashboard to load...');
    try {
      await page.waitForURL('**/f/**', { timeout: 15000 });
      console.log('  URL changed to:', page.url());

      // Wait for actual dashboard content to render
      console.log('  Waiting for dashboard content...');
      await page.waitForSelector('text=Dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000); // Let the page fully render

      // Take screenshot as proof
      await page.screenshot({ path: '/tmp/login-success-professional.png', fullPage: true });
      console.log('✅ PROFESSIONAL SUCCESS! Dashboard loaded at:', page.url());
      console.log('  Screenshot saved to: /tmp/login-success-professional.png');
      professionalPassed = true;
    } catch (e) {
      console.log('❌ PROFESSIONAL FAILED - Current URL:', page.url());
      await page.screenshot({ path: '/tmp/login-fail-professional.png', fullPage: true });
      console.log('  Screenshot saved to: /tmp/login-fail-professional.png');
    }

    // Clear storage for next test
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();

    console.log('\n=== TEST 2: COUNCIL PORTAL ===');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    // Click Council Portal
    console.log('Clicking Council Portal...');
    await page.click('text=Council Portal');
    await page.waitForTimeout(500);

    // Fill credentials
    console.log('Filling credentials...');
    await page.fill('#email', 'ottoclarke@icloud.com');
    await page.fill('#password', 'AdminPass2026!');

    // Click Sign in
    console.log('Clicking Sign in...');
    await page.click('button[type="submit"]');

    // Wait for redirect AND dashboard content
    console.log('Waiting for redirect and dashboard to load...');
    try {
      await page.waitForURL('**/c/**', { timeout: 15000 });
      console.log('  URL changed to:', page.url());

      // Wait for actual dashboard content to render
      console.log('  Waiting for dashboard content...');
      await page.waitForSelector('text=Dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000); // Let the page fully render

      // Take screenshot as proof
      await page.screenshot({ path: '/tmp/login-success-council.png', fullPage: true });
      console.log('✅ COUNCIL SUCCESS! Dashboard loaded at:', page.url());
      console.log('  Screenshot saved to: /tmp/login-success-council.png');
      councilPassed = true;
    } catch (e) {
      console.log('❌ COUNCIL FAILED - Current URL:', page.url());
      await page.screenshot({ path: '/tmp/login-fail-council.png', fullPage: true });
      console.log('  Screenshot saved to: /tmp/login-fail-council.png');
    }

    // Clear storage for next test
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await context.clearCookies();

    console.log('\n=== TEST 3: ADMIN PORTAL ===');
    await page.goto('http://localhost:5173/admin/login');
    await page.waitForTimeout(1000);

    // Fill credentials
    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'ottoclarke@icloud.com');
    await page.fill('input[type="password"]', 'AdminPass2026!');

    // Click Sign in
    console.log('Clicking Sign in...');
    await page.click('button[type="submit"]');

    // Wait for redirect AND dashboard content
    console.log('Waiting for redirect and dashboard to load...');
    try {
      await page.waitForURL('**/admin/dashboard**', { timeout: 15000 });
      console.log('  URL changed to:', page.url());

      // Wait for actual dashboard content to render (admin dashboard has specific elements)
      console.log('  Waiting for dashboard content...');
      await page.waitForSelector('text=Dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000); // Let the page fully render

      // Take screenshot as proof
      await page.screenshot({ path: '/tmp/login-success-admin.png', fullPage: true });
      console.log('✅ ADMIN SUCCESS! Dashboard loaded at:', page.url());
      console.log('  Screenshot saved to: /tmp/login-success-admin.png');
      adminPassed = true;
    } catch (e) {
      console.log('❌ ADMIN FAILED - Current URL:', page.url());
      await page.screenshot({ path: '/tmp/login-fail-admin.png', fullPage: true });
      console.log('  Screenshot saved to: /tmp/login-fail-admin.png');
    }

  } finally {
    console.log('\n=== FINAL RESULTS ===');
    console.log('Professional Portal:', professionalPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('Council Portal:', councilPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('Admin Portal:', adminPassed ? '✅ PASSED' : '❌ FAILED');

    if (professionalPassed && councilPassed && adminPassed) {
      console.log('\n🎉 ALL 3 LOGIN TESTS PASSED!');
      console.log('\nScreenshots saved:');
      console.log('  - /tmp/login-success-professional.png');
      console.log('  - /tmp/login-success-council.png');
      console.log('  - /tmp/login-success-admin.png');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - Check screenshots in /tmp/');
    }

    console.log('\nClosing browser...');
    await browser.close();
  }
}

testLogin().catch(console.error);
