const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to notices page...');
  await page.goto('http://localhost:5173/notices');
  await page.waitForLoadState('networkidle');

  console.log('2. Searching for W8 7LN...');
  await page.fill('input[type="text"]', 'w8 7ln');
  await page.click('button:has-text("Search")');
  await page.waitForTimeout(2000);

  console.log('3. Checking initial results...');
  const initialCount = await page.locator('text=/\\d+ notice/').first().textContent();
  console.log('   Initial count:', initialCount);

  console.log('4. Changing radius to 20km...');
  await page.selectOption('select:has-text("5 km")', '20');
  await page.waitForTimeout(3000);

  console.log('5. Checking updated results...');
  const updatedCount = await page.locator('text=/\\d+ notice/').first().textContent();
  console.log('   Updated count:', updatedCount);

  console.log('6. Checking API response...');
  const response = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5174/api/notices/search?postcode=W87LN&radius_km=20000&sort=created_at.desc');
    return await res.json();
  });
  console.log('   API returned:', response.notices?.length || 0, 'notices');

  console.log('7. Checking with smaller radius (5000m = 5km)...');
  const response2 = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5174/api/notices/search?postcode=W87LN&radius_km=5000&sort=created_at.desc');
    return await res.json();
  });
  console.log('   API returned:', response2.notices?.length || 0, 'notices');

  console.log('\n8. Getting list view to see actual results...');
  await page.click('button:has-text("List view")');
  await page.waitForTimeout(1000);

  const listItems = await page.locator('[data-testid*="notice-card"], .notice-card, article').count();
  console.log('   List view shows:', listItems, 'notice cards');

  console.log('\nDone! Keeping browser open for inspection...');
  await page.waitForTimeout(60000);

  await browser.close();
})();
