import { chromium, type Page } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testCompleteJourney() {
  console.log('🚀 Starting complete user journey test...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate and select notice type
    console.log('📋 Step 1: Selecting notice type...');
    await page.goto(`${BASE_URL}/publish/step-1`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.locator('button:has-text("Continue")').click();
    await page.waitForLoadState('networkidle');
    console.log('✓ Notice type selected\n');

    // Step 2: Choose template path
    console.log('📝 Step 2: Choosing template path...');
    const useTemplateBtn = page.locator('button:has-text("Use template")');
    await useTemplateBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Template path selected\n');

    // Step 3: Fill out ALL required fields
    console.log('📝 Step 3: Filling out required fields...\n');

    // Check for the heading we added
    const heading = await page.locator('text=Complete the required details').isVisible();
    console.log(`  Heading visible: ${heading ? '✓' : '✗'}`);

    // Fill Applicant name
    console.log('  Filling applicant name...');
    const applicantNameInput = page.locator('input[name="applicantname"]').first();
    await applicantNameInput.fill('John Smith');
    await page.waitForTimeout(500);

    // Fill Applicant address
    console.log('  Filling applicant address...');
    const applicantAddressLookup = page.locator('[data-testid="applicant_address-lookup"]').first();
    await applicantAddressLookup.fill('9 lower park road ches');
    await page.waitForTimeout(1500);

    const dropdown = page.locator('role=listbox');
    if (await dropdown.isVisible()) {
      const firstOption = page.locator('role=option').first();
      await firstOption.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Address selected from autocomplete');
    }

    // Fill Premises name
    console.log('  Filling premises name...');
    const premisesNameInput = page.locator('input[name="premisesname"]').first();
    await premisesNameInput.fill('The Red Lion Pub');
    await page.waitForTimeout(500);

    // Fill Premises address
    console.log('  Filling premises address...');
    const premisesAddressLookup = page.locator('[data-testid="premises_address-lookup"]').first();
    await premisesAddressLookup.fill('10 high street chester');
    await page.waitForTimeout(1500);

    const dropdown2 = page.locator('role=listbox');
    if (await dropdown2.isVisible()) {
      const firstOption = page.locator('role=option').first();
      await firstOption.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Premises address selected');
    }

    // Fill Authority
    console.log('  Filling authority...');
    const authorityInput = page.locator('input[name="authorityname"]').first();
    await authorityInput.fill('Brighton');
    await page.waitForTimeout(500);

    const councilDropdown = page.locator('role=listbox');
    if (await councilDropdown.isVisible()) {
      const firstCouncil = page.locator('role=option').first();
      await firstCouncil.click();
      await page.waitForTimeout(500);
      console.log('  ✓ Council selected');
    }

    // Fill Application date
    console.log('  Filling application date...');
    const appDateInput = page.locator('input[name="application_date"]').first();
    await appDateInput.fill('2025-01-20');
    await page.waitForTimeout(500);

    // Check deadline auto-filled
    const deadlineInput = page.locator('input[name="deadline_date"]').first();
    const deadlineValue = await deadlineInput.inputValue();
    console.log(`  Deadline auto-calculated: ${deadlineValue}`);

    // Select activities - this is critical!
    console.log('  Selecting licensable activities...');

    // Look for the activities section checkbox
    const alcoholCheckbox = page.locator('input[type="checkbox"][id="activity-alcohol_on"]').first();
    if (await alcoholCheckbox.isVisible()) {
      await alcoholCheckbox.click();
      await page.waitForTimeout(1000);
      console.log('  ✓ Alcohol activity checkbox clicked');

      // After clicking, the activity should expand
      // First, uncheck the "None" checkbox for Monday to enable the inputs
      const monNoneCheckbox = page.locator('label:has-text("None")').first().locator('input[type="checkbox"]');
      if (await monNoneCheckbox.isChecked()) {
        await monNoneCheckbox.click();
        await page.waitForTimeout(500);
        console.log('  ✓ Unchecked "None" to enable time inputs');
      }

      // Set Monday hours
      const monStart = page.locator('input[id="Mon-start"]').first();
      const monEnd = page.locator('input[id="Mon-end"]').first();
      if (await monStart.isVisible() && !await monStart.isDisabled()) {
        await monStart.fill('09:00');
        await monEnd.fill('23:00');
        await page.waitForTimeout(500);

        // Click "Copy to all days" button
        const copyToAllBtn = page.locator('button:has-text("Copy to all days")').filter({ hasText: /^Copy to all days$/ }).first();
        if (await copyToAllBtn.isVisible()) {
          await copyToAllBtn.click();
          await page.waitForTimeout(500);
          console.log('  ✓ Activity hours set (09:00-23:00, all days)');
        }
      }

      // Since alcohol was selected, DPS field should now be visible
      await page.waitForTimeout(1000); // Wait for DPS section to appear
      const dpsNameInput = page.locator('input[id="dps-name"]').first();
      if (await dpsNameInput.isVisible()) {
        await dpsNameInput.fill('Jane Doe');
        await page.waitForTimeout(500);
        console.log('  ✓ DPS name filled');
      } else {
        console.log('  ⚠️  DPS name field not visible');
      }
    } else {
      console.log('  ⚠️  Could not find alcohol checkbox - checking what activities are available');

      // Debug: list all checkboxes
      const allCheckboxes = await page.$$eval('input[type="checkbox"]', boxes =>
        boxes.map(b => ({ id: b.id, visible: (b as HTMLElement).offsetParent !== null }))
      );
      console.log('  Available checkboxes:', allCheckboxes.filter(c => c.visible).map(c => c.id));
    }

    // Wait for any auto-save
    await page.waitForTimeout(2000);

    // Check progress indicator
    console.log('\n📊 Checking form status...');
    try {
      const progressText = await page.locator('text=/\\d+ required field/i').textContent({ timeout: 2000 });
      console.log(`  Progress: ${progressText}`);
    } catch (e) {
      console.log('  No progress indicator found');
    }

    // Check Continue button state
    console.log('\n🔍 Checking Continue button...');
    const continueBtn = page.locator('button:has-text("Continue")').last();
    const isDisabled = await continueBtn.isDisabled();
    const btnText = await continueBtn.textContent();

    console.log(`  Button text: "${btnText}"`);
    console.log(`  Button disabled: ${isDisabled}`);

    if (!isDisabled) {
      console.log('\n✓ Continue button is enabled! Clicking...');
      await continueBtn.click();
      await page.waitForTimeout(3000);

      // Check if we progressed
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      if (currentUrl.includes('step-3') || currentUrl.includes('review')) {
        console.log('\n🎉 SUCCESS! Progressed to next step!');
      } else {
        console.log('\n❌ FAILED: Still on same step');
      }
    } else {
      console.log('\n❌ PROBLEM: Continue button is still disabled');
      console.log('   Investigating what might be missing...\n');

      // Debug: Check all input values
      const allInputs = await page.$$eval('input[name], select[name], textarea[name]', els =>
        els.map(el => ({
          name: el.getAttribute('name'),
          value: (el as HTMLInputElement).value,
          type: el.getAttribute('type'),
          required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true'
        }))
      );

      console.log('   All form fields:');
      allInputs.forEach(input => {
        const hasValue = input.value && input.value.length > 0;
        const symbol = hasValue ? '✓' : (input.required ? '✗' : '-');
        console.log(`   ${symbol} ${input.name}: "${input.value}" ${input.required ? '(required)' : ''}`);
      });
    }

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCompleteJourney();
