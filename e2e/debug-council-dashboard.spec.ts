import { test, expect } from '@playwright/test';

test.describe('Council Dashboard Debug', () => {
  test('verify dashboard loads real data for authenticated user', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
      }
    });

    // First, login
    await page.goto('http://localhost:5173/auth/council-login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'e2e-screenshots/debug-01-login-page.png' });

    // Fill in login credentials
    await page.fill('input[type="email"]', 'ottoclarke@icloud.com');
    await page.fill('input[type="password"]', 'password123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Wait for navigation - should go to switch-department or dashboard
    await page.waitForURL(/\/(switch-department|c\/)/, { timeout: 15000 });
    await page.screenshot({ path: 'e2e-screenshots/debug-02-after-login.png' });

    console.log('Current URL after login:', page.url());

    // If on switch-department page, select the licensing department
    if (page.url().includes('switch-department')) {
      console.log('On switch department page, selecting licensing department...');
      await page.screenshot({ path: 'e2e-screenshots/debug-03-switch-dept.png' });

      // Look for a link or button to Sampleton Borough Council Licensing
      const licensingLink = page.locator('text=Licensing Department').first();
      if (await licensingLink.isVisible()) {
        await licensingLink.click();
      } else {
        // Try clicking on any department card
        const deptCard = page.locator('[data-testid="department-card"]').first();
        if (await deptCard.isVisible()) {
          await deptCard.click();
        }
      }

      await page.waitForURL(/\/c\//, { timeout: 10000 });
    }

    console.log('Current URL after department selection:', page.url());
    await page.screenshot({ path: 'e2e-screenshots/debug-04-after-dept-select.png' });

    // Now navigate to the dashboard explicitly
    const currentUrl = page.url();
    const dashboardUrl = currentUrl.replace(/\/[^\/]+$/, '/dashboard');
    await page.goto(dashboardUrl);
    await page.waitForLoadState('networkidle');

    console.log('Dashboard URL:', page.url());
    await page.screenshot({ path: 'e2e-screenshots/debug-05-dashboard.png' });

    // Wait for loading to complete
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-screenshots/debug-06-dashboard-loaded.png' });

    // Check for the stats widgets
    const totalApplicationsText = await page.locator('text=Total Applications').first().isVisible();
    console.log('Total Applications widget visible:', totalApplicationsText);

    // Get all text content to see what's displayed
    const bodyText = await page.locator('body').textContent();
    console.log('Body text includes "Total Applications":', bodyText?.includes('Total Applications'));
    console.log('Body text includes "11":', bodyText?.includes('11'));
    console.log('Body text includes "0":', bodyText?.includes('0'));

    // Check network requests for notices
    const noticesRequest = page.waitForResponse(response =>
      response.url().includes('/notices') && response.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    // Reload to capture network traffic
    await page.reload();
    const response = await noticesRequest;
    if (response) {
      const json = await response.json();
      console.log('Notices API response count:', Array.isArray(json) ? json.length : 'not array');
    }

    await page.screenshot({ path: 'e2e-screenshots/debug-07-final.png' });
  });
});
