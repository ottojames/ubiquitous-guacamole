import { test, expect } from '@playwright/test';

test.describe('Publish Flow - Manual Simple Test', () => {
  test('should fill form and submit', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PaymentStep]') || text.includes('submit')) {
        console.log('[Browser]:', text);
      }
      consoleLogs.push(text);
    });

    // Step 1
    console.log('\n=== STEP 1: Select Notice Type ===');
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    await page.click('text=Licensing Act 2003');
    await page.waitForTimeout(300);
    await page.click('text=Premises Licence — Variation');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Continue")');
    await page.waitForURL(/step-2/);
    console.log('✓ At Step 2');

    // Step 2 - Wait for form to fully load
    console.log('\n=== STEP 2: Fill Form ===');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Let React render everything

    // Take initial screenshot
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step2-start.png', fullPage: true });

    // Scroll down to see the full form
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Fill email
    await page.fill('#email', 'test@example.com');
    console.log('✓ Email filled');

    // Scroll more to see template form
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step2-scrolled.png', fullPage: true });

    // Find the combobox and click it
    const combobox = page.locator('[role="combobox"]').first();
    await combobox.scrollIntoViewIfNeeded();
    await combobox.click();
    await page.waitForTimeout(1000);

    // Type Westminster
    await page.keyboard.type('Westminster', { delay: 100 });
    await page.waitForTimeout(1500);

    // Click Westminster option
    const westminster = page.locator('text=Westminster City Council').first();
    if (await westminster.isVisible()) {
      await westminster.click();
      console.log('✓ Westminster selected');
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
      console.log('⚠ Pressed Enter (Westminster not visible)');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step2-council.png', fullPage: true });

    // Fill all text inputs by scrolling and finding them
    const textInputs = await page.locator('input[type="text"]').all();
    console.log(`Found ${textInputs.length} text inputs`);

    // Fill applicant name (should be first or second text input)
    for (const input of textInputs) {
      const isVisible = await input.isVisible();
      if (isVisible) {
        const value = await input.inputValue();
        if (!value || value.length === 0) {
          await input.scrollIntoViewIfNeeded();
          await input.fill('Test Applicant Ltd');
          console.log('✓ Filled a text input (likely Applicant)');
          break;
        }
      }
    }

    await page.waitForTimeout(500);

    // Fill premises name
    const premisesInput = page.locator('input[type="text"]').nth(1);
    await premisesInput.scrollIntoViewIfNeeded();
    await premisesInput.fill('The Test Pub');
    console.log('✓ Filled Premises name');

    await page.waitForTimeout(500);

    // Fill textarea (address)
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textareas`);

    for (const textarea of textareas) {
      const isVisible = await textarea.isVisible();
      if (isVisible) {
        await textarea.scrollIntoViewIfNeeded();
        const placeholder = await textarea.getAttribute('placeholder');
        console.log('Textarea placeholder:', placeholder);

        // Fill first empty visible textarea
        const value = await textarea.inputValue();
        if (!value) {
          await textarea.fill('123 Test Street, London, SW1A 1AA');
          console.log('✓ Filled textarea (address)');
          break;
        }
      }
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step2-basic.png', fullPage: true });

    // Fill dates
    const today = new Date().toISOString().split('T')[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);
    const deadlineStr = deadline.toISOString().split('T')[0];

    const dateInputs = await page.locator('input[type="date"]').all();
    console.log(`Found ${dateInputs.length} date inputs`);

    if (dateInputs.length >= 1) {
      await dateInputs[0].scrollIntoViewIfNeeded();
      await dateInputs[0].fill(today);
      console.log('✓ Filled date 1');
    }

    if (dateInputs.length >= 2) {
      await dateInputs[1].scrollIntoViewIfNeeded();
      await dateInputs[1].fill(deadlineStr);
      console.log('✓ Filled date 2');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step2-complete.png', fullPage: true });

    // Scroll to Continue button
    const continueBtn = page.locator('[data-testid="upload-step-continue"]');
    await continueBtn.scrollIntoViewIfNeeded();

    const isDisabled = await continueBtn.isDisabled();
    console.log('Continue button disabled?', isDisabled);

    if (!isDisabled) {
      await continueBtn.click();
      await page.waitForURL(/step-3/, { timeout: 10000 });
      console.log('✓ At Step 3');

      // Step 3
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step3.png', fullPage: true });

      await page.click('button:has-text("Continue")');
      await page.waitForURL(/step-4/, { timeout: 10000 });
      console.log('✓ At Step 4');

      // Step 4
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step4-before.png', fullPage: true });

      // Find and click Submit
      const submitBtn = page.locator('button').filter({ hasText: /submit/i }).first();
      await submitBtn.scrollIntoViewIfNeeded();

      console.log('Clicking Submit...');
      await submitBtn.click();

      // Wait for submission to process
      await page.waitForTimeout(5000);

      await page.screenshot({ path: '/Users/ottoclarke/projects/Ralph\'s Civic Notices/e2e/screenshots/manual-step4-after.png', fullPage: true });

      console.log('\n=== FINAL URL ===');
      console.log(page.url());

      // Extract payment logs
      console.log('\n=== Payment/Submit Logs ===');
      const paymentLogs = consoleLogs.filter(log =>
        log.includes('[PaymentStep]') ||
        log.toLowerCase().includes('submit') ||
        log.toLowerCase().includes('payment')
      );

      if (paymentLogs.length > 0) {
        paymentLogs.forEach(log => console.log(log));
      } else {
        console.log('No payment/submit logs found');
      }

      console.log('\n=== Test Complete ===');
    } else {
      console.error('❌ Continue button is disabled, cannot proceed');

      // Debug: show all form values
      const formData = await page.evaluate(() => {
        const result: any = {};
        document.querySelectorAll('input, textarea, select').forEach((el: any) => {
          result[el.id || el.name || el.type] = el.value;
        });
        return result;
      });
      console.log('Form values:', JSON.stringify(formData, null, 2));
    }
  });
});
