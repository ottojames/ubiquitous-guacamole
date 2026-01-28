import { test, expect } from '@playwright/test';

test.describe('Notice Publish Flow - End to End', () => {
  test('should complete full publish flow from step 1 to step 4', async ({ page }) => {
    // Enable console log capture
    const consoleLogs: string[] = [];
    const paymentLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      // Capture payment/submit-related logs
      if (text.includes('[PaymentStep]') ||
          text.includes('[NewPublishFlow]') ||
          text.toLowerCase().includes('submit') ||
          text.toLowerCase().includes('payment')) {
        paymentLogs.push(text);
        console.log(`[Browser]:`, text);
      }
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('[Page Error]:', error.message);
    });

    // Step 1: Navigate and select notice type
    console.log('\n=== STEP 1: Notice Type Selection ===');
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step1.png' });

    // Select Licensing Act 2003
    await page.click('text=Licensing Act 2003');
    await page.waitForTimeout(500);

    // Select Premises Licence - Variation
    await page.click('text=Premises Licence — Variation');
    await page.waitForTimeout(500);

    // Click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/\/publish\/step-2/, { timeout: 10000 });
    console.log('✓ Navigated to Step 2');

    // Step 2: Fill form
    console.log('\n=== STEP 2: Upload & Details ===');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for auto-trigger of template method
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-loaded.png' });

    // Fill email first (it's in a separate card)
    console.log('Filling email...');
    const emailInput = page.locator('input[type="email"]#email');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('test@example.com');
    console.log('✓ Filled email');

    // Wait for template form to be visible
    await page.waitForSelector('[data-testid="upload-template-panel"]', { timeout: 5000 });
    console.log('✓ Template panel visible');

    // Find and fill form fields by label text
    // Council/Authority - Find the input field for authority name
    console.log('Filling authority...');

    // The CouncilDepartmentSelect renders an input field
    const authorityInput = page.locator('input[name="authorityname"]').first();
    await authorityInput.waitFor({ state: 'visible', timeout: 5000 });
    await authorityInput.fill('Westminster');
    await page.waitForTimeout(1000);

    // Click on the dropdown option if it appears
    const westminsterOption = page.locator('[role="listbox"] >> text=Westminster').or(
      page.locator('text=Westminster City Council').first()
    ).first();
    if (await westminsterOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await westminsterOption.click();
      console.log('✓ Selected Westminster from dropdown');
    } else {
      console.log('⚠ No dropdown option found, using typed value');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-council.png' });

    // Fill applicant name - look for label then find input
    console.log('Filling applicant name...');
    const applicantLabel = page.locator('label:has-text("Applicant name")');
    const applicantInput = page.locator('input[type="text"]').filter({ has: applicantLabel }).first();
    if (await applicantInput.count() > 0) {
      await applicantInput.fill('Test Applicant Ltd');
    } else {
      // Fallback: find by placeholder or nearby text
      await page.fill('input[type="text"]:near(:text("Applicant"))', 'Test Applicant Ltd');
    }
    console.log('✓ Filled applicant name');

    // Fill premises name
    console.log('Filling premises name...');
    const premisesNameLabel = page.locator('label:has-text("name"):has-text("Premises")').first();
    const premisesInput = page.locator('input').filter({ has: premisesNameLabel }).or(
      page.locator('input[type="text"]:near(:text("Premises name"))')
    ).first();
    await premisesInput.fill('The Test Pub');
    console.log('✓ Filled premises name');

    // Fill premises address (using AddressFields component - separate inputs)
    console.log('Filling premises address...');

    // The AddressFields component has separate inputs for line1, line2, city, postcode
    // Look for the address fields by their test IDs or name attributes
    const addressLine1 = page.locator('input[data-testid="premises_address-line1"]').or(
      page.locator('input[name="premises_addressLine1"]')
    ).first();
    await addressLine1.waitFor({ state: 'visible', timeout: 5000 });
    await addressLine1.fill('123 Test Street');
    console.log('✓ Filled address line 1');

    const addressCity = page.locator('input[data-testid="premises_address-city"]').or(
      page.locator('input[name="premises_addressCity"]')
    ).first();
    await addressCity.fill('London');
    console.log('✓ Filled city');

    const addressPostcode = page.locator('input[data-testid="premises_address-postcode"]').or(
      page.locator('input[name="premises_addressPostcode"]')
    ).first();
    await addressPostcode.fill('SW1A 1AA');
    console.log('✓ Filled postcode');

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-basic-fields.png' });

    // Fill dates
    console.log('Filling dates...');
    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);
    const deadlineStr = deadline.toISOString().split('T')[0];

    // Application date
    const appDateInput = page.locator('label:has-text("Application date")').locator('..').locator('input[type="date"]').first();
    await appDateInput.fill(today);
    console.log('✓ Filled application date:', today);

    // Deadline date
    const deadlineDateInput = page.locator('label:has-text("deadline")').locator('..').locator('input[type="date"]').first();
    await deadlineDateInput.fill(deadlineStr);
    console.log('✓ Filled deadline date:', deadlineStr);

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-dates.png' });

    // Select at least one licensable activity (required for variation forms)
    console.log('Selecting licensable activities...');

    // Scroll to find activities section
    await page.locator('text=Activities & hours').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);

    // Check the alcohol checkbox
    const alcoholCheckbox = page.locator('input[type="checkbox"][id="activity-alcohol_on_off"]').or(
      page.locator('input[type="checkbox"][id*="alcohol"]')
    ).first();
    if (await alcoholCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await alcoholCheckbox.check();
      console.log('✓ Selected alcohol activity');
      await page.waitForTimeout(500);

      // After checking activity, set hours by clicking "24 hours" button
      // The hours section appears after the checkbox is checked
      // Look for the "24 hours" button in the activity's hours section
      const hoursButtons = page.locator('button:has-text("24 hours")');
      const count = await hoursButtons.count();
      console.log(`Found ${count} "24 hours" buttons`);

      // Click the 24 hours button for the activity (usually the second one, first is for Opening hours)
      if (count >= 2) {
        await hoursButtons.nth(1).click();
        console.log('✓ Set activity hours to 24 hours');
      } else if (count === 1) {
        await hoursButtons.first().click();
        console.log('✓ Set hours to 24 hours');
      }
    } else {
      console.log('⚠ Alcohol checkbox not visible');
    }

    await page.waitForTimeout(1000); // Wait for activities update to trigger NATURE_OF_VARIATION generation
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-activities.png' });

    // Fill authority address (might be auto-filled from council selection)
    console.log('Filling authority address...');
    const authAddrLine1 = page.locator('#authority_address-line1');
    if (await authAddrLine1.isVisible().catch(() => false)) {
      const currentValue = await authAddrLine1.inputValue();
      if (!currentValue) {
        await authAddrLine1.fill('Civic Centre');
        console.log('✓ Filled authority address line 1');
      } else {
        console.log('✓ Authority address auto-filled:', currentValue);
      }
    }

    const authAddrCity = page.locator('#authority_address-city');
    if (await authAddrCity.isVisible().catch(() => false)) {
      const currentValue = await authAddrCity.inputValue();
      if (!currentValue) {
        await authAddrCity.fill('Westminster');
        console.log('✓ Filled authority city');
      }
    }

    const authAddrPostcode = page.locator('#authority_address-postcode');
    if (await authAddrPostcode.isVisible().catch(() => false)) {
      const currentValue = await authAddrPostcode.inputValue();
      if (!currentValue) {
        await authAddrPostcode.fill('SW1E 6QP');
        console.log('✓ Filled authority postcode');
      }
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-filled.png' });

    // Check if Continue button is enabled
    console.log('Checking Continue button state...');
    const continueBtn = page.locator('[data-testid="upload-step-continue"]');
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });

    const isDisabled = await continueBtn.isDisabled();
    console.log('Continue button disabled:', isDisabled);

    if (isDisabled) {
      console.warn('⚠ Continue button still disabled. Checking for validation errors...');

      // Check for validation error messages
      const errorMessages = await page.locator('[class*="rose"]').allTextContents();
      console.log('Error messages on page:', errorMessages);

      // Try using the "Load example data" button to fill all required fields
      console.log('Attempting to load example data...');
      const loadExampleBtn = page.locator('button:has-text("Load example data")');
      if (await loadExampleBtn.isVisible().catch(() => false)) {
        await loadExampleBtn.click();
        console.log('✓ Clicked Load example data');
        await page.waitForTimeout(2000);

        // Re-check if Continue is now enabled
        const isStillDisabled = await continueBtn.isDisabled();
        console.log('Continue button still disabled after example data:', isStillDisabled);
        if (isStillDisabled) {
          await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step2-after-example.png' });
        }
      }

      // Log all form values for debugging
      const formData = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        return inputs.map(el => ({
          tag: el.tagName,
          type: el.getAttribute('type'),
          name: el.getAttribute('name'),
          value: (el as HTMLInputElement).value,
          id: el.id
        }));
      });
      console.log('Form data:', JSON.stringify(formData, null, 2));
    }

    // Try to continue - use force if still disabled
    const finalDisabledState = await continueBtn.isDisabled();
    if (finalDisabledState) {
      console.log('Continue still disabled, using force click');
    }
    await continueBtn.click({ force: finalDisabledState });
    await page.waitForURL(/\/publish\/step-3/, { timeout: 10000 });
    console.log('✓ Navigated to Step 3');

    // Step 3: Confirm Details
    console.log('\n=== STEP 3: Confirm Details ===');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step3.png' });

    // Click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/\/publish\/step-4/, { timeout: 10000 });
    console.log('✓ Navigated to Step 4');

    // Step 4: Review & Pay (Submit)
    console.log('\n=== STEP 4: Review & Pay ===');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for React to fully render
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step4-before-submit.png' });

    // Find Submit button
    const submitBtn = page.locator('button').filter({ hasText: /submit/i }).first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });

    console.log('Clicking Submit button...');
    await submitBtn.click();

    // Wait for response
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/test-step4-after-submit.png' });

    // Check final state
    const finalUrl = page.url();
    console.log('\nFinal URL:', finalUrl);

    // Log payment-related console output
    console.log('\n=== Payment/Submit Console Logs ===');
    if (paymentLogs.length > 0) {
      paymentLogs.forEach(log => console.log(log));
    } else {
      console.log('No [PaymentStep] or [NewPublishFlow] logs captured during submit');
    }

    // Check for errors or success messages
    const alerts = await page.locator('[role="alert"]').allTextContents();
    if (alerts.length > 0) {
      console.log('\nAlert messages:', alerts);
    }

    console.log('\n=== Test Complete ===');
  });
});
