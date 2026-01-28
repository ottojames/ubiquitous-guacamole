import { test, expect } from '@playwright/test';

test('Verify Variation form - manual navigation', async ({ page }) => {
  // Navigate to step 1
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/step-1-loaded.png', fullPage: true });

  // Try to find any button or card with "variation" in it (case insensitive)
  const variationElements = await page.locator('text=/variation/i').all();
  console.log('Found variation elements:', variationElements.length);

  // Try to find notice type cards/buttons
  const noticeCards = await page.locator('[data-notice-type], button:has-text("Premises"), [role="button"]').all();
  console.log('Found potential notice type elements:', noticeCards.length);

  // List all visible text on the page for debugging
  const bodyText = await page.locator('body').textContent();
  console.log('Page text sample:', bodyText?.substring(0, 500));

  // Try clicking by partial text match
  const variationButton = page.getByRole('button', { name: /variation/i }).or(
    page.locator('button', { hasText: /variation/i })
  ).or(
    page.locator('[role="button"]', { hasText: /variation/i })
  ).first();

  const isVariationVisible = await variationButton.isVisible().catch(() => false);
  console.log('Variation button visible:', isVariationVisible);

  if (isVariationVisible) {
    await variationButton.click();
    await page.waitForTimeout(1000);

    // Look for template approach buttons
    const structuredButton = page.getByRole('button', { name: /structured/i }).or(
      page.locator('button:has-text("Structured")')
    ).first();

    if (await structuredButton.isVisible().catch(() => false)) {
      await structuredButton.click();
      await page.waitForURL('**/publish/step-2**', { timeout: 5000 });
    }
  }

  // Take final screenshot wherever we ended up
  await page.screenshot({ path: '/tmp/current-page-state.png', fullPage: true });
});
