import { chromium } from 'playwright';

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

  console.log('4. Waiting for map to load...');
  await page.waitForTimeout(2000);

  console.log('5. Changing radius to 20km...');
  const radiusSelect = await page.locator('select').filter({ hasText: 'km' }).first();
  await radiusSelect.selectOption('20');
  await page.waitForTimeout(3000);

  console.log('6. Checking updated results...');
  const updatedCount = await page.locator('text=/\\d+ notice/').first().textContent();
  console.log('   Updated count:', updatedCount);

  console.log('7. Checking API response directly...');
  const apiResponse = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5174/api/notices/search?postcode=W87LN&radius_km=20000&sort=created_at.desc');
    const data = await res.json();
    return { count: data.notices?.length || 0, notices: data.notices };
  });
  console.log('   API returned:', apiResponse.count, 'notices');
  if (apiResponse.count > 0) {
    console.log('   First 3 notices:', apiResponse.notices.slice(0, 3).map(n => ({
      name: n.trading_name || n.premises_address,
      lat: n.latitude,
      lng: n.longitude
    })));
  }

  console.log('\n8. Getting list view to see actual results...');
  try {
    await page.click('button:has-text("List view")');
    await page.waitForTimeout(1000);
    const listItems = await page.locator('article, [class*="notice"]').count();
    console.log('   List view shows:', listItems, 'items');
  } catch (e) {
    console.log('   Could not switch to list view:', e.message);
  }

  console.log('\n9. Checking network requests...');
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/notices/search')) {
      requests.push(request.url());
    }
  });

  await page.reload();
  await page.waitForTimeout(2000);
  console.log('   Search requests made:', requests.length);
  if (requests.length > 0) {
    console.log('   Last request:', requests[requests.length - 1]);
  }

  console.log('\nDone! Keeping browser open for inspection...');
  console.log('Press Ctrl+C to close');
  await page.waitForTimeout(300000);

  await browser.close();
})();
