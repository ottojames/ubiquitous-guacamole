import puppeteer from 'puppeteer';

async function testNoticeDetail() {
  console.log('Starting browser test for US-0001: Fix Public Notice Detail Page');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to /notices
    console.log('1. Navigating to /notices...');
    await page.goto('http://localhost:5173/notices', { waitUntil: 'networkidle0' });

    // Step 2: Search postcode S325UY
    console.log('2. Searching for postcode S325UY...');
    const searchInput = await page.waitForSelector('input[placeholder*="postcode" i], input[type="search"]', { timeout: 5000 });
    await searchInput.type('S325UY');

    // Step 3: Click search or wait for auto-search
    const searchButton = await page.$('button[type="submit"], button:has-text("Search")');
    if (searchButton) {
      await searchButton.click();
    }
    await page.waitForTimeout(2000);

    // Step 4: Increase radius to 5km (if radius selector exists)
    console.log('3. Looking for radius selector...');
    const radiusSelector = await page.$('select[name*="radius" i], input[type="range"]');
    if (radiusSelector) {
      await radiusSelector.select('5');
    }
    await page.waitForTimeout(1000);

    // Step 5: Look for The Pilot Inn notice
    console.log('4. Looking for The Pilot Inn notice...');
    const noticeCard = await page.waitForSelector('::-p-text(The Pilot Inn)', { timeout: 5000 });

    // Step 6: Click View Notice button
    console.log('5. Clicking View Notice button...');
    const viewButton = await page.evaluateHandle((card) => {
      const parent = card.closest('article, div[class*="card" i]');
      return parent?.querySelector('button:has-text("View Notice"), a:has-text("View Notice")');
    }, noticeCard);

    if (viewButton) {
      await viewButton.click();
    } else {
      // Try clicking the card itself
      await noticeCard.click();
    }

    // Step 7: Wait for notice detail page
    await page.waitForTimeout(2000);

    // Step 8: Verify notice details loaded
    console.log('6. Verifying notice details loaded...');

    // Check for "notice not found" error
    const errorText = await page.$('::-p-text(notice not found)');
    if (errorText) {
      console.error('❌ FAILED: Notice detail page shows "notice not found" error');
      return false;
    }

    // Check for notice details
    const hasTitle = await page.$('::-p-text(The Pilot Inn)');
    const hasAddress = await page.$('::-p-text(Sheffield)');
    const hasDeadline = await page.$('::-p-text(deadline)');

    if (hasTitle && hasAddress) {
      console.log('✅ Notice details loaded successfully');

      // Step 9: Check for representation form
      const hasRepForm = await page.$('form[class*="representation" i], button:has-text("Submit representation")');
      if (hasRepForm) {
        console.log('✅ Representation form is present');
      } else {
        console.log('⚠️ Representation form not found');
      }

      return true;
    } else {
      console.error('❌ FAILED: Notice details not properly displayed');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  } finally {
    await page.screenshot({ path: 'test-result.png' });
    await browser.close();
  }
}

testNoticeDetail().then(success => {
  if (success) {
    console.log('\n✅ BROWSER TEST PASSED: All acceptance criteria met');
    process.exit(0);
  } else {
    console.log('\n❌ BROWSER TEST FAILED: Not all acceptance criteria met');
    process.exit(1);
  }
});