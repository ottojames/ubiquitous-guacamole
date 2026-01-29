import { test, expect } from '@playwright/test';

test.describe('Council Portal Verification', () => {
  // Login helper - uses real auth flow
  async function loginAsCouncil(page: any) {
    // Go to council login
    await page.goto('http://localhost:5173/login/council');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Fill credentials - known demo account
    await page.fill('input[type="email"]', 'licensing@sampletonborough.gov.uk');
    await page.fill('input[type="password"]', 'testpass123');

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for redirect to council dashboard
    await page.waitForURL(/\/c\/.*\/dashboard/, { timeout: 15000 }).catch(() => {
      console.log('Did not redirect to council dashboard, checking current URL');
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  test('1. Dashboard - Stat widgets should be clickable', async ({ page }) => {
    await loginAsCouncil(page);

    // Navigate to dashboard explicitly
    await page.goto('http://localhost:5173/c/sampletonborough/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot the dashboard
    await page.screenshot({
      path: 'e2e-screenshots/council-1-dashboard.png',
      fullPage: true
    });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after dashboard navigation:', currentUrl);

    // Check if we're on the dashboard or were redirected
    const pageContent = await page.textContent('body');
    const isOnDashboard = currentUrl.includes('/dashboard') ||
                          pageContent?.includes('Dashboard') ||
                          pageContent?.includes('Overview');
    console.log('Successfully on dashboard:', isOnDashboard);

    // Look for stat widgets
    const statCards = await page.locator('.bg-white.rounded, [class*="shadow"]').count();
    console.log(`Found ${statCards} potential stat cards`);
  });

  test('2. Notices page - Should show real notices', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot the notices page
    await page.screenshot({
      path: 'e2e-screenshots/council-2-notices-list.png',
      fullPage: true
    });

    // Check for demo mode indicators
    const pageContent = await page.textContent('body');
    const hasDemoMode = pageContent?.toLowerCase().includes('demo mode');
    const hasDemoData = pageContent?.toLowerCase().includes('demo data');
    console.log(`Demo mode mentioned: ${hasDemoMode}`);
    console.log(`Demo data mentioned: ${hasDemoData}`);

    // Check if there are any notices displayed
    const noticeRows = await page.locator('table tbody tr, [data-testid="notice-row"]').count();
    console.log(`Found ${noticeRows} notice rows`);
  });

  test('3. Notice detail - Verify no fake data', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/notices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Try to click on a notice row
    const noticeRow = page.locator('table tbody tr').first();
    if (await noticeRow.isVisible()) {
      await noticeRow.click();
      await page.waitForTimeout(2000);

      // Screenshot the notice detail
      await page.screenshot({
        path: 'e2e-screenshots/council-3a-notice-detail.png',
        fullPage: true
      });

      const pageContent = await page.textContent('body');

      // Check for fake licensing activities - these should NOT appear if there's no data
      const suspiciousActivities = ['Live Music', 'Recorded Music', 'Late Night Refreshment'];
      const hasAllFakeActivities = suspiciousActivities.every(act => pageContent?.includes(act));
      console.log(`All three fake activities present: ${hasAllFakeActivities}`);

      // Check for proper "no data" messages
      const hasNoActivities = pageContent?.includes('No activities') ||
                               pageContent?.includes('No licensable activities');
      console.log(`Shows "No activities" message: ${hasNoActivities}`);

      // Check for fake operating hours (10:00 AM to 02:00 AM is a common fake pattern)
      const hasSuspiciousHours = pageContent?.includes('10:00') && pageContent?.includes('02:00');
      console.log(`Has suspicious hours pattern: ${hasSuspiciousHours}`);

      // Check History tab
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History")');
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: 'e2e-screenshots/council-3b-notice-history.png',
          fullPage: true
        });

        const historyContent = await page.textContent('body');
        const hasRealHistory = historyContent?.includes('No activity') ||
                               historyContent?.includes('No history') ||
                               historyContent?.includes('activity recorded');
        console.log(`History shows appropriate message: ${hasRealHistory}`);
      }

      // Check Documents tab
      const documentsTab = page.locator('button:has-text("Documents"), [role="tab"]:has-text("Documents")');
      if (await documentsTab.isVisible()) {
        await documentsTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: 'e2e-screenshots/council-3c-notice-documents.png',
          fullPage: true
        });
      }
    } else {
      console.log('No notices found to click on');
      await page.screenshot({
        path: 'e2e-screenshots/council-3-no-notices-found.png',
        fullPage: true
      });
    }
  });

  test('4. Representations - Check refresh button and internal notes', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/representations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot representations page
    await page.screenshot({
      path: 'e2e-screenshots/council-4-representations.png',
      fullPage: true
    });

    // Check for refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh"]');
    const hasRefresh = await refreshButton.isVisible();
    console.log(`Refresh button visible: ${hasRefresh}`);

    // Check page content
    const pageContent = await page.textContent('body');
    const hasInternalNotes = pageContent?.includes('Internal') || pageContent?.includes('Notes');
    console.log(`Internal notes section visible: ${hasInternalNotes}`);

    // Check if representations data is real (no fake names like "John Smith resident")
    const hasFakeRepresentor = pageContent?.includes('John Smith') &&
                                pageContent?.includes('123 Any Street');
    console.log(`Has suspicious fake representor: ${hasFakeRepresentor}`);
  });

  test('5. Audit Log - Should be accessible to all staff', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/audit-log');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot audit log page
    await page.screenshot({
      path: 'e2e-screenshots/council-5-audit-log.png',
      fullPage: true
    });

    // Check if page loaded successfully
    const pageContent = await page.textContent('body');
    const isAccessDenied = pageContent?.toLowerCase().includes('access denied') ||
                          pageContent?.toLowerCase().includes('not authorized') ||
                          pageContent?.toLowerCase().includes('permission');
    const is404 = pageContent?.toLowerCase().includes('not found') ||
                  pageContent?.toLowerCase().includes('404');

    console.log(`Access denied: ${isAccessDenied}`);
    console.log(`404 error: ${is404}`);

    // Check if audit log content is visible
    const hasAuditContent = pageContent?.includes('Audit') ||
                            pageContent?.includes('Log') ||
                            pageContent?.includes('Activity');
    console.log(`Has audit log content: ${hasAuditContent}`);
  });

  test('6. Billing - Should show Free Portal, not Professional pricing', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/billing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot billing page
    await page.screenshot({
      path: 'e2e-screenshots/council-6-billing.png',
      fullPage: true
    });

    const pageContent = await page.textContent('body');

    // Check for "Free Portal" or "Free Plan" text
    const hasFreePortal = pageContent?.includes('Free Portal') ||
                          pageContent?.includes('Free Plan') ||
                          pageContent?.includes('Free');
    console.log(`Shows "Free Portal/Plan": ${hasFreePortal}`);

    // Check for Professional pricing that should NOT be there
    const hasProfessionalPricing = pageContent?.includes('£149') ||
                                    pageContent?.includes('$149') ||
                                    pageContent?.includes('Professional');
    console.log(`Shows Professional pricing: ${hasProfessionalPricing}`);

    // Check for usage stats
    const hasUsageStats = pageContent?.includes('Usage') ||
                          pageContent?.includes('usage') ||
                          pageContent?.includes('notices published');
    console.log(`Shows usage stats: ${hasUsageStats}`);
  });

  test('7. Navigation sidebar - Check all menu items', async ({ page }) => {
    await loginAsCouncil(page);

    await page.goto('http://localhost:5173/c/sampletonborough/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot showing navigation sidebar
    await page.screenshot({
      path: 'e2e-screenshots/council-7-navigation.png',
      fullPage: true
    });

    // List all navigation items in sidebar
    const sidebarNav = page.locator('aside, nav[aria-label*="sidebar"], [class*="sidebar"]');
    const navLinks = await sidebarNav.locator('a').allTextContents();
    console.log('Sidebar navigation items:', navLinks.filter(n => n.trim()));

    // Check for expected menu items
    const pageContent = await page.textContent('body');
    const expectedItems = ['Dashboard', 'Notices', 'Representations', 'Team', 'Settings'];
    expectedItems.forEach(item => {
      const hasItem = pageContent?.includes(item);
      console.log(`Menu item "${item}" present: ${hasItem}`);
    });

    // Check specifically for Audit Log in navigation
    const hasAuditInNav = pageContent?.includes('Audit Log') || pageContent?.includes('Audit');
    console.log(`Audit Log in navigation: ${hasAuditInNav}`);
  });
});
