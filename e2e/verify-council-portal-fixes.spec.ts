import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotDir = path.join(process.cwd(), 'audit', 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('Council Portal Fixes Verification', () => {
  test('verify dashboard widgets show real data', async ({ page }) => {
    // Navigate to council dashboard
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for widgets to render
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'council-dashboard.png'),
      fullPage: true
    });

    // Check if stat widgets exist
    const statWidgets = await page.locator('[class*="stat"]').count();
    console.log(`Found ${statWidgets} stat widgets on dashboard`);

    // Try to find specific stat values
    const pageContent = await page.content();

    // Check for "all zeros" pattern (would indicate broken widgets)
    const hasAllZeros = pageContent.includes('>0<') &&
                       !pageContent.match(/>[1-9]\d*</);

    console.log('Dashboard widgets check:', hasAllZeros ? 'FAIL (all zeros)' : 'PASS (has data)');
  });

  test('verify audit log page', async ({ page }) => {
    // Navigate to audit log
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/audit');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, 'council-audit-log.png'),
      fullPage: true
    });

    // Check for audit entries
    const pageContent = await page.content();
    const hasEntries = pageContent.includes('audit') || pageContent.includes('log');

    // Check for empty state
    const isEmpty = pageContent.includes('No audit entries') ||
                   pageContent.includes('no entries') ||
                   pageContent.toLowerCase().includes('empty');

    console.log('Audit log check:', isEmpty ? 'EMPTY (no entries)' : 'HAS ENTRIES');
  });

  test('verify representation with internal comment', async ({ page }) => {
    // Navigate to notices page
    await page.goto('http://localhost:5173/c/sampleton-borough-council/licensing/notices');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of notices list
    await page.screenshot({
      path: path.join(screenshotDir, 'council-notices-list.png'),
      fullPage: true
    });

    // Look for a notice card
    const noticeCards = await page.locator('[class*="notice"], [class*="card"]').count();
    console.log(`Found ${noticeCards} potential notice elements`);

    // Try to find and click on first notice
    const firstNotice = page.locator('a[href*="/notice/"], a[href*="/notices/"]').first();
    const noticeExists = await firstNotice.count() > 0;

    if (noticeExists) {
      await firstNotice.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot of notice detail
      await page.screenshot({
        path: path.join(screenshotDir, 'council-notice-detail.png'),
        fullPage: true
      });

      // Look for representations section
      const pageContent = await page.content();
      const hasRepresentations = pageContent.toLowerCase().includes('representation');

      console.log('Representations check:', hasRepresentations ? 'FOUND' : 'NOT FOUND');

      // Look for internal comment field/button
      const commentButton = page.locator('button:has-text("comment"), button:has-text("Comment"), button:has-text("Add")').first();
      const hasCommentFeature = await commentButton.count() > 0;

      console.log('Internal comment feature:', hasCommentFeature ? 'FOUND' : 'NOT FOUND');

      if (hasCommentFeature) {
        await commentButton.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: path.join(screenshotDir, 'council-add-comment-modal.png'),
          fullPage: true
        });
      }
    } else {
      console.log('No notices found on page');
    }
  });
});
