import puppeteer from 'puppeteer';

async function testActivitiesOrder() {
  console.log('Testing FIX-005: Activities field order in publish wizard');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('\n1. Navigating to publish wizard...');
    await page.goto('http://localhost:5173/publish/step-1', {
      waitUntil: 'networkidle2'
    });

    console.log('2. Selecting Licensing Act 2003...');
    const licensingCard = await page.waitForSelector('text/Licensing Act 2003', { timeout: 5000 });
    await licensingCard.click();
    await new Promise(r => setTimeout(r, 500));

    console.log('3. Selecting Premises licence...');
    const premisesCard = await page.waitForSelector('text/Premises licence');
    await premisesCard.click();
    await new Promise(r => setTimeout(r, 500));

    console.log('4. Selecting New application...');
    const newAppCard = await page.waitForSelector('text/New application');
    await newAppCard.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log('5. Moving to Step 2...');
    await page.waitForSelector('text/Enter details manually');
    const manualEntry = await page.$('text/Enter details manually');
    await manualEntry?.click();
    await new Promise(r => setTimeout(r, 1000));

    console.log('6. Checking Activities section order...');
    // Find all activity checkboxes in order
    const activities = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="activity-"]');
      return Array.from(checkboxes).map(cb => {
        const label = cb.parentElement?.parentElement?.querySelector('label')?.textContent || '';
        return {
          id: cb.id,
          label: label.trim()
        };
      });
    });

    console.log('\n=== ACTIVITIES ORDER ===');
    activities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.label} (${activity.id})`);
    });

    // Check if Sale of Alcohol is at the top
    const alcoholActivities = activities.filter(a => a.label.toLowerCase().includes('alcohol'));
    const firstAlcoholIndex = activities.findIndex(a => a.label.toLowerCase().includes('alcohol'));

    console.log('\n=== VERIFICATION ===');
    if (alcoholActivities.length > 0) {
      console.log(`✓ Found ${alcoholActivities.length} alcohol-related activities`);
      console.log(`Position of first alcohol activity: ${firstAlcoholIndex + 1}`);

      if (firstAlcoholIndex === 0) {
        console.log('✅ SUCCESS: Sale of Alcohol activities are at the TOP of the list');
      } else {
        console.log(`❌ FAILURE: Sale of Alcohol is at position ${firstAlcoholIndex + 1}, not at the top`);
        console.log('Activities before alcohol:');
        activities.slice(0, firstAlcoholIndex).forEach((a, i) => {
          console.log(`  ${i + 1}. ${a.label}`);
        });
      }
    } else {
      console.log('❌ ERROR: No alcohol activities found');
    }

    // Also check if they're below Opening Hours field
    const openingHoursField = await page.$('textarea[id*="OPENING_HOURS"]');
    if (openingHoursField) {
      const openingHoursBox = await openingHoursField.boundingBox();
      const firstActivityBox = await page.$(`#${activities[0]?.id}`)?.then(el => el?.boundingBox());

      if (openingHoursBox && firstActivityBox) {
        if (firstActivityBox.y > openingHoursBox.y) {
          console.log('✅ Activities section is positioned below Opening Hours field');
        } else {
          console.log('❌ Activities section is NOT below Opening Hours field');
        }
      }
    } else {
      console.log('Note: Opening Hours field not found (may be handled differently in this section)');
    }

    console.log('\nTest complete. Browser will close in 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testActivitiesOrder().catch(console.error);