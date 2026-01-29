import { test, expect } from '@playwright/test';

test('Bristol Council should appear in dropdown', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });

  // Go directly to step 2 with template selected
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: '/tmp/page-loaded.png', fullPage: true });

  // Find and click the council input field
  const councilInput = page.locator('input[placeholder*="council" i], input[name="authorityname"]').first();

  console.log('Looking for council input...');
  await councilInput.waitFor({ timeout: 5000 }).catch(() => {
    console.log('Council input not found, trying alternative selectors...');
  });

  const inputCount = await councilInput.count();
  console.log(`Found ${inputCount} council input fields`);

  if (inputCount > 0) {
    await councilInput.click();
    await page.waitForTimeout(2000);

    // Type bristol
    await councilInput.fill('bristol');
    await page.waitForTimeout(2000);

    // Screenshot after typing
    await page.screenshot({ path: '/tmp/after-typing-bristol.png', fullPage: true });

    // Check what options are available
    const allText = await page.locator('body').textContent();
    console.log('Bristol in page:', allText?.includes('Bristol'));
    console.log('Sampleton in page:', allText?.includes('Sampleton'));

    // Try to find Bristol Council
    const bristolText = await page.locator('text=/Bristol.*Council/i').count();
    console.log(`Found ${bristolText} elements containing "Bristol Council"`);

    // Get all visible text
    const bodyText = await page.textContent('body');
    if (bodyText?.includes('Bristol')) {
      console.log('Bristol IS in the page!');
    } else {
      console.log('Bristol NOT in the page - showing Sampleton or other static data');
    }
  } else {
    console.log('No council input found on page');
    const pageContent = await page.content();
    console.log('Page includes "authority":', pageContent.includes('authority'));
    console.log('Page includes "council":', pageContent.includes('council'));
  }
});
