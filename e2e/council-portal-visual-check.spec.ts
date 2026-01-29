import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'audit', 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('Council Portal Visual Verification', () => {
  test('check if dashboard route is protected', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'council-dashboard-auth-check.png'),
      fullPage: true
    });

    const content = await page.content();

    // Check if we're on login page or have access denied
    const isLoginPage = content.includes('Sign in') || content.includes('Sign In') ||
                       content.includes('Email Address') || content.includes('Password');

    const hasDashboard = content.toLowerCase().includes('dashboard');

    console.log('Dashboard auth protection:', isLoginPage ? 'PROTECTED (redirected to login)' : 'ACCESSIBLE');
    console.log('Has dashboard content:', hasDashboard);
  });

  test('check audit log route', async ({ page }) => {
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/audit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, 'council-audit-check.png'),
      fullPage: true
    });

    const content = await page.content();
    const isLoginPage = content.includes('Sign in') || content.includes('Sign In');

    console.log('Audit page auth protection:', isLoginPage ? 'PROTECTED' : 'ACCESSIBLE');
  });

  test('check notices list route', async ({ page }) => {
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, 'council-notices-check.png'),
      fullPage: true
    });

    const content = await page.content();
    const isLoginPage = content.includes('Sign in') || content.includes('Sign In');

    console.log('Notices page auth protection:', isLoginPage ? 'PROTECTED' : 'ACCESSIBLE');
  });

  test('analyze login page structure', async ({ page }) => {
    await page.goto('http://localhost:5173/auth/council-login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotDir, 'council-login-page.png'),
      fullPage: true
    });

    // Check for login form elements
    const hasEmailField = await page.locator('input[type="email"], input[name*="email"]').count() > 0;
    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    const hasSignInButton = await page.locator('button:has-text("Sign"), button:has-text("Login")').count() > 0;

    console.log('Login page structure:');
    console.log('  Email field:', hasEmailField ? 'FOUND' : 'MISSING');
    console.log('  Password field:', hasPasswordField ? 'FOUND' : 'MISSING');
    console.log('  Sign in button:', hasSignInButton ? 'FOUND' : 'MISSING');
  });

  test('check public notices page for comparison', async ({ page }) => {
    // Check the public notices page to verify app is working
    await page.goto('http://localhost:5173/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotDir, 'public-notices-page.png'),
      fullPage: true
    });

    const content = await page.content();
    const hasNotices = content.toLowerCase().includes('notice');
    const hasSearch = content.toLowerCase().includes('search');

    console.log('Public notices page:');
    console.log('  Has notices:', hasNotices ? 'YES' : 'NO');
    console.log('  Has search:', hasSearch ? 'YES' : 'NO');
  });
});
