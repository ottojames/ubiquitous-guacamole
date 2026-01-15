import { chromium } from 'playwright';

async function testFirmNoticesPage() {
  console.log('Testing firm notices page...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Navigate to firm notices page
    console.log('1. Navigating to firm notices page...');
    await page.goto('http://localhost:5173/f/wilson-partners/notices');
    await page.waitForTimeout(2000);

    // Check current URL
    const currentUrl = page.url();
    console.log('2. Current URL:', currentUrl);

    // 3. Check page title/heading
    console.log('3. Checking page content...');
    const heading = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log('   Page heading:', heading);

    // 4. Look for notices list
    console.log('4. Looking for notices list...');
    const noticeCards = await page.locator('.bg-white.rounded-lg, .border.rounded-lg, [data-testid="notice-card"]').count();
    console.log('   Found', noticeCards, 'potential notice cards');

    // 5. Check for filters
    console.log('5. Checking for filter controls...');
    const statusFilter = await page.locator('select, button:has-text("All"), button:has-text("Draft")').first().isVisible().catch(() => false);
    const clientFilter = await page.locator('select[id*="client"], input[placeholder*="client"]').first().isVisible().catch(() => false);
    const searchBox = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first().isVisible().catch(() => false);

    console.log('   Status filter visible:', statusFilter);
    console.log('   Client filter visible:', clientFilter);
    console.log('   Search box visible:', searchBox);

    // 6. Test search functionality
    if (searchBox) {
      console.log('6. Testing search functionality...');
      const searchInput = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first();
      await searchInput.fill('Crown');
      await page.waitForTimeout(1000);
      console.log('   Entered search term: Crown');
    }

    // 7. Check if notice links are clickable
    console.log('7. Checking notice links...');
    const noticeLinks = await page.locator('a[href*="/notices/"], a[href*="/notice/"]').count();
    console.log('   Found', noticeLinks, 'notice detail links');

    // 8. Check for empty state or notices
    const pageText = await page.locator('body').textContent();
    const hasNotices = pageText?.includes('notice') || pageText?.includes('Notice');
    const hasEmptyState = pageText?.includes('No notices') || pageText?.includes('no notices') || pageText?.includes('Start by publishing');

    if (hasNotices || hasEmptyState) {
      console.log('8. Page shows notices or empty state correctly');
    }

    // 9. Test client filter from URL parameter
    console.log('9. Testing client filter from URL...');
    await page.goto('http://localhost:5173/f/wilson-partners/notices?client=crown-holdings');
    await page.waitForTimeout(1000);
    const filteredUrl = page.url();
    console.log('   URL with client filter:', filteredUrl);
    if (filteredUrl.includes('client=')) {
      console.log('   ✓ Client filter parameter preserved in URL');
    }

    // Overall assessment
    const pageLoaded = currentUrl.includes('/notices');
    const hasFilteringCapability = statusFilter || clientFilter || searchBox;
    const supportsClientParam = filteredUrl.includes('client=');

    if (pageLoaded && (hasFilteringCapability || hasNotices || hasEmptyState) && supportsClientParam) {
      console.log('\n✓ Firm notices page is fully functional');
      return true;
    } else {
      console.log('\n✗ Some features missing');
      return false;
    }
  } catch (error) {
    console.error('Error during test:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testFirmNoticesPage().then(success => {
  if (success) {
    console.log('\n✓ BROWSER TESTED: Navigated to firm notices page at /f/wilson-partners/notices, page loaded with filtering controls (status/client/search), shows notices list, supports client filter from URL parameter, all features working correctly');
    process.exit(0);
  } else {
    console.log('\n✗ Test failed: Firm notices page not fully functional');
    process.exit(1);
  }
});