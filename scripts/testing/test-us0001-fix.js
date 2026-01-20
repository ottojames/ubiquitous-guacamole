import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Testing US-0001: Fix Public Notice Detail Page');
    console.log('==============================================');

    // Step 1: Navigate to notices page
    console.log('\n1. Navigating to /notices...');
    await page.goto('http://localhost:5173/notices');
    await page.waitForTimeout(2000);

    // Step 2: Search for postcode S325UY
    console.log('2. Searching for postcode S325UY...');
    const searchInput = await page.locator('input[placeholder*="postcode"], input[placeholder*="Postcode"]').first();
    await searchInput.fill('S325UY');
    await page.waitForTimeout(1000);

    // Step 3: Press Enter or click search
    console.log('3. Triggering search...');
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // Step 4: Increase radius to 5km
    console.log('4. Increasing radius to 5km...');
    const radiusButton = await page.locator('button:has-text("5km")').first();
    if (await radiusButton.isVisible()) {
      await radiusButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 5: Look for The Pilot Inn notice
    console.log('5. Looking for The Pilot Inn notice...');
    const pilotInnCard = await page.locator('text=/The Pilot Inn/i').first();
    if (await pilotInnCard.isVisible()) {
      console.log('   ✓ Found The Pilot Inn notice');

      // Step 6: Navigate directly to the notice detail page
      console.log('6. Navigating directly to notice detail page...');
      await page.goto('http://localhost:5173/notices/550e8400-e29b-41d4-a716-446655440001');
      await page.waitForTimeout(3000);

      // Step 7: Check if notice details loaded
      console.log('7. Checking notice details page...');
      const noticeTitle = await page.locator('h1:has-text("The Pilot Inn")').first();
      if (await noticeTitle.isVisible()) {
        console.log('   ✓ Notice details page loaded');

        // Step 8: Check for representation form/button
        console.log('8. Checking for representation form...');

        // Check for "Have Your Say" section
        const haveYourSay = await page.locator('text="Have Your Say"').first();
        const submitButton = await page.locator('button:has-text("Submit Your Representation")').first();

        if (await haveYourSay.isVisible() && await submitButton.isVisible()) {
          console.log('   ✓ SUCCESS: Representation form is present!');
          console.log('   ✓ "Have Your Say" section visible');
          console.log('   ✓ "Submit Your Representation" button visible');

          // Check if deadline or open consultation message is shown
          const deadlineText = await page.locator('text=/days left to respond|Deadline today|Open for Representations/').first();
          if (await deadlineText.isVisible()) {
            const text = await deadlineText.textContent();
            console.log(`   ✓ Status message: "${text}"`);
          }

          console.log('\n✅ TEST PASSED: US-0001 fix verified - representation form always shows');
        } else {
          console.log('   ✗ FAIL: Representation form NOT found');
          console.log('   Have Your Say visible:', await haveYourSay.isVisible());
          console.log('   Submit button visible:', await submitButton.isVisible());
          console.log('\n❌ TEST FAILED: Representation form missing');
        }
      } else {
        console.log('   ✗ Notice details page did not load properly');
        console.log('\n❌ TEST FAILED: Could not access notice details');
      }
    } else {
      console.log('   ✗ The Pilot Inn notice not found in search results');
      console.log('\n❌ TEST FAILED: Notice not found');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();