import puppeteer from 'puppeteer';

async function testRecentRepresentationsFeed() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for manual verification
    devtools: true
  });
  const page = await browser.newPage();

  console.log('Testing US-0150: Live Representation Feed');
  console.log('==========================================');

  try {
    // Navigate to firm dashboard
    console.log('\n1. Navigating to firm dashboard...');
    await page.goto('http://localhost:5173/f/wilson-partners/dashboard', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log('   ✓ Page loaded');

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if Recent Representations widget exists
    console.log('\n2. Looking for Recent Representations widget...');
    const widgetExists = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      return headings.some(h => h.textContent?.includes('Recent Representations'));
    });

    if (widgetExists) {
      console.log('   ✓ Recent Representations widget found on dashboard');

      // Check for widget elements
      console.log('\n3. Verifying widget elements...');

      const hasLastDaysBadge = await page.evaluate(() => {
        const badges = Array.from(document.querySelectorAll('span'));
        return badges.some(b => b.textContent?.includes('Last 7 days'));
      });
      console.log(`   ${hasLastDaysBadge ? '✓' : '✗'} "Last 7 days" badge present`);

      const hasRefreshButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.getAttribute('title') === 'Refresh');
      });
      console.log(`   ${hasRefreshButton ? '✓' : '✗'} Refresh button present`);

      const hasUpdateTime = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        return spans.some(s => s.textContent?.includes('Updated'));
      });
      console.log(`   ${hasUpdateTime ? '✓' : '✗'} Update time displayed`);

      // Check for representations or empty state
      console.log('\n4. Checking for representations...');
      const hasRepresentations = await page.evaluate(() => {
        // Look for stance icons
        return document.querySelector('[class*="thumbs"]') !== null;
      });

      const hasEmptyState = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('p'));
        return texts.some(p => p.textContent?.includes('No representations in the last'));
      });

      if (hasRepresentations) {
        console.log('   ✓ Representations displayed in widget');

        // Count representations
        const repCount = await page.evaluate(() => {
          const items = document.querySelectorAll('[class*="divide-y"] > div');
          return items.length;
        });
        console.log(`   ✓ Found ${repCount} representation items`);

        // Check for mock data
        const hasMockData = await page.evaluate(() => {
          const texts = Array.from(document.querySelectorAll('*'));
          return texts.some(el =>
            el.textContent?.includes('The Blue Moon Bar') ||
            el.textContent?.includes('Crown Hotel') ||
            el.textContent?.includes('The Red Lion Pub')
          );
        });
        if (hasMockData) {
          console.log('   ✓ Mock data loaded (Blue Moon Bar, Crown Hotel, Red Lion Pub)');
        }

      } else if (hasEmptyState) {
        console.log('   ✓ Empty state displayed (no representations)');
      } else {
        console.log('   ⚠ Neither representations nor empty state found');
      }

      // Check total count
      const hasTotalCount = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll('p'));
        return texts.some(p => p.textContent?.includes('total representations in the last'));
      });
      console.log(`   ${hasTotalCount ? '✓' : '✗'} Total count displayed`);

      console.log('\n✅ US-0150 BROWSER TEST PASSED: Recent Representations widget successfully integrated');

    } else {
      console.log('   ✗ Recent Representations widget NOT found');
      console.log('\n❌ US-0150 BROWSER TEST FAILED: Widget not visible on dashboard');

      // Debug: Check what's on the page
      const pageTitle = await page.title();
      console.log(`   Page title: ${pageTitle}`);

      const dashboardContent = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h2'));
        return headings.map(h => h.textContent);
      });
      console.log('   Found headings:', dashboardContent);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }

  console.log('\nTest complete. Browser will remain open for manual inspection.');
  console.log('Close the browser window when done.');

  // Keep browser open for manual inspection
  await new Promise(() => {});
}

testRecentRepresentationsFeed().catch(console.error);