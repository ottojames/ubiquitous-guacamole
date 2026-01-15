#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function main() {
  console.log('Testing Quick Publish feature...\n');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to firm dashboard
    console.log('1. Navigating to firm dashboard...');
    await page.goto('http://localhost:5173/f/wilson-partners/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Step 2: Check for Quick Publish widget
    console.log('2. Looking for Quick Publish widget...');
    const widgetExists = await page.$eval('h3', (el) => el.textContent === 'Quick Publish');
    console.log('   ✓ Quick Publish widget found:', widgetExists);

    // Step 3: Check for client dropdown
    console.log('3. Checking for client dropdown...');
    const dropdownExists = await page.$('select');
    if (dropdownExists) {
      const options = await page.$$eval('option', options =>
        options.map(opt => opt.textContent)
      );
      console.log('   ✓ Client dropdown found with options:');
      options.forEach(opt => console.log('     -', opt));

      // Step 4: Select a client
      console.log('\n4. Selecting "The Red Lion Pub" client...');
      await page.select('select', '850e8400-e29b-41d4-c001-446655440001');
      await new Promise(r => setTimeout(r, 1000));

      // Step 5: Click Quick Publish
      console.log('5. Clicking "Start Quick Publish" button...');
      const button = await page.$('button:has-text("Start Quick Publish")');
      if (button) {
        await button.click();
        await new Promise(r => setTimeout(r, 2000));

        // Step 6: Verify navigation to wizard
        console.log('6. Checking navigation to publish wizard...');
        const currentUrl = page.url();
        if (currentUrl.includes('/publish/step-1')) {
          console.log('   ✓ Navigated to publish wizard step 1');

          // Step 7: Move to step 2 to check pre-population
          console.log('\n7. Selecting notice type and moving to step 2...');
          // Click first notice type
          const firstNoticeType = await page.$('[data-testid="notice-type-card"]');
          if (firstNoticeType) {
            await firstNoticeType.click();
            await new Promise(r => setTimeout(r, 1000));

            // Click continue
            const continueBtn = await page.$('button:has-text("Continue")');
            if (continueBtn) {
              await continueBtn.click();
              await new Promise(r => setTimeout(r, 2000));

              // Step 8: Select manual entry on step 2
              console.log('8. Selecting manual entry on step 2...');
              const manualOption = await page.$('input[value="template"]');
              if (manualOption) {
                await manualOption.click();
                await new Promise(r => setTimeout(r, 1000));

                // Check for pre-populated fields
                console.log('\n9. Checking for pre-populated fields...');
                const applicantName = await page.$eval('input[name="applicant.fullName"]', (el: HTMLInputElement) => el.value).catch(() => '');
                const email = await page.$eval('input[name="applicant.contactEmail"]', (el: HTMLInputElement) => el.value).catch(() => '');
                const address = await page.$eval('input[name="premises.address.line1"]', (el: HTMLInputElement) => el.value).catch(() => '');

                console.log('   Applicant Name:', applicantName || '[empty]');
                console.log('   Email:', email || '[empty]');
                console.log('   Address:', address || '[empty]');

                if (applicantName || email || address) {
                  console.log('\n   ✓ CLIENT DETAILS PRE-POPULATED SUCCESSFULLY!');
                } else {
                  console.log('\n   ⚠ No pre-populated fields found');
                }
              }
            }
          }
        } else {
          console.log('   ✗ Did not navigate to wizard');
        }
      } else {
        console.log('   ✗ Quick Publish button not found');
      }
    } else {
      console.log('   ✗ Client dropdown not found');
    }

    console.log('\n✓ Browser test completed');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
  }
}

main().catch(console.error);