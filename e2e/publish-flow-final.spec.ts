import { test } from '@playwright/test';

test.describe('Publish Flow - Complete End-to-End', () => {
  test('submit notice through full flow', async ({ page }) => {
    const paymentLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PaymentStep]') || text.toLowerCase().includes('submit')) {
        paymentLogs.push(text);
        console.log('[Browser]:', text);
      }
    });

    page.on('pageerror', err => console.error('[Page Error]:', err.message));

    // Step 1: Select notice type
    console.log('\n=== STEP 1 ===');
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    await page.click('text=Licensing Act 2003');
    await page.waitForTimeout(500);
    await page.click('text=Premises Licence — Variation');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/step-2/);
    console.log('✓ Step 1 complete');

    // Step 2: Fill form
    console.log('\n=== STEP 2 ===');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // Wait for template to auto-load

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/final-step2.png', fullPage: true });

    // Fill email
    await page.fill('#email', 'test@example.com');
    console.log('✓ Email');

    // Fill council (it's a text input, not a combobox)
    const councilInput = page.locator('input#council-department').or(
      page.locator('input[placeholder*="Search"]').first()
    );

    await councilInput.scrollIntoViewIfNeeded();
    await councilInput.click();
    await councilInput.fill('Westminster');
    await page.waitForTimeout(2000); // Wait for search results

    // Click the dropdown option
    const westminsterOption = page.locator('li, [role="option"]').filter({ hasText: /Westminster City Council/i }).first();
    if (await westminsterOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await westminsterOption.click();
      console.log('✓ Council (clicked option)');
    } else {
      // Just press Enter if dropdown not visible
      await page.keyboard.press('Enter');
      console.log('✓ Council (pressed Enter)');
    }

    await page.waitForTimeout(1000);

    // Fill Applicant name
    const applicantInput = page.locator('input').filter({ has: page.locator('text=Applicant name') }).or(
      page.locator('label:has-text("Applicant name") + input')
    ).first();

    if (await applicantInput.count() > 0) {
      await applicantInput.scrollIntoViewIfNeeded();
      await applicantInput.fill('Test Applicant Ltd');
      console.log('✓ Applicant');
    }

    await page.waitForTimeout(500);

    // Fill Premises name - look for the section and fill nearby input
    const premisesSection = page.locator('text=Premises').first();
    await premisesSection.scrollIntoViewIfNeeded();

    // Get the next text input after "Premises" heading
    const allTextInputs = await page.locator('input[type="text"]').all();
    for (let i = 0; i < allTextInputs.length; i++) {
      const inp = allTextInputs[i];
      const isVisible = await inp.isVisible().catch(() => false);
      if (isVisible) {
        const val = await inp.inputValue();
        // Fill if empty and NOT the council search (which already has Westminster)
        if (!val || val.length === 0) {
          await inp.scrollIntoViewIfNeeded();
          await inp.fill('The Test Pub');
          console.log('✓ Premises name');
          break;
        }
      }
    }

    await page.waitForTimeout(500);

    // Fill address (first textarea)
    const textareas = await page.locator('textarea').all();
    for (const ta of textareas) {
      const isVisible = await ta.isVisible().catch(() => false);
      if (isVisible) {
        const val = await ta.inputValue();
        if (!val) {
          await ta.scrollIntoViewIfNeeded();
          await ta.fill('123 Test Street, London, SW1A 1AA');
          console.log('✓ Address');
          break;
        }
      }
    }

    await page.waitForTimeout(500);

    // Scroll past the Activities section (it has complex UI)
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    // Fill dates
    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);
    const deadlineStr = deadline.toISOString().split('T')[0];

    const dateInputs = await page.locator('input[type="date"]').all();
    if (dateInputs.length >= 1) {
      await dateInputs[0].scrollIntoViewIfNeeded();
      await dateInputs[0].fill(today);
      console.log('✓ Application date');
    }

    if (dateInputs.length >= 2) {
      await dateInputs[1].scrollIntoViewIfNeeded();
      await dateInputs[1].fill(deadlineStr);
      console.log('✓ Deadline date');
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/final-step2-filled.png', fullPage: true });

    // Find Continue button
    const continueBtn = page.locator('[data-testid="upload-step-continue"]');
    await continueBtn.scrollIntoViewIfNeeded();

    const isDisabled = await continueBtn.isDisabled();
    console.log('Continue button disabled:', isDisabled);

    if (isDisabled) {
      console.warn('⚠ Button still disabled after filling fields');
      console.log('Attempting to continue anyway...');
    }

    await continueBtn.click({ force: true });
    await page.waitForURL(/step-3/, { timeout: 15000 });
    console.log('✓ Step 2 complete');

    // Step 3
    console.log('\n=== STEP 3 ===');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/final-step3.png', fullPage: true });

    await page.click('button:has-text("Continue")');
    await page.waitForURL(/step-4/, { timeout: 15000 });
    console.log('✓ Step 3 complete');

    // Step 4: Submit
    console.log('\n=== STEP 4: SUBMIT ===');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for React to render payment UI

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/final-step4-before-submit.png', fullPage: true });

    // Find Submit button
    const submitBtn = page.locator('button').filter({ hasText: /submit/i }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });

    console.log('Clicking Submit button...');
    await submitBtn.click();

    // Wait for response
    await page.waitForTimeout(6000);

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/final-step4-after-submit.png', fullPage: true });

    console.log('\n=== RESULT ===');
    console.log('Final URL:', page.url());

    console.log('\n=== Payment/Submit Console Logs ===');
    if (paymentLogs.length > 0) {
      paymentLogs.forEach(log => console.log(log));
    } else {
      console.log('No [PaymentStep] or submit logs captured');
    }

    // Check for any alerts
    const alerts = await page.locator('[role="alert"]').allTextContents();
    if (alerts.length > 0) {
      console.log('\n=== Alerts ===');
      alerts.forEach(alert => console.log(alert));
    }

    console.log('\n=== TEST COMPLETE ===');
  });
});
