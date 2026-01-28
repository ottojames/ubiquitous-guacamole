import { test, expect, type Page } from '@playwright/test';

test.describe('Notice Publish Flow End-to-End', () => {
  test('should complete full publish flow with variation application', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[PaymentStep]') || text.includes('[NewPublishFlow]') || text.includes('Error') || text.includes('error')) {
        console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]:', error.message);
    });

    // Step 1: Navigate to publish flow
    console.log('\n=== STEP 1: Navigating to /publish/step-1 ===');
    await page.goto('http://localhost:5173/publish/step-1', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'e2e-screenshots/step-1-initial.png' });

    // Expand Licensing Act 2003 category (disclosure section)
    console.log('Looking for Licensing Act 2003 disclosure...');
    const licensingDisclosure = page.locator('summary:has-text("Licensing Act 2003")');
    await expect(licensingDisclosure).toBeVisible({ timeout: 10000 });
    console.log('Expanding Licensing Act 2003 category...');
    await licensingDisclosure.click();
    await page.waitForTimeout(500);

    // Select Premises Licence - Variation
    console.log('Selecting Premises Licence — Variation...');
    const variationButton = page.locator('button[role="radio"]:has-text("Premises Licence — Variation")');
    await expect(variationButton).toBeVisible({ timeout: 10000 });
    await variationButton.click();
    await page.waitForTimeout(500);

    // Click Continue
    console.log('Clicking Continue to Step 2...');
    const continueBtn1 = page.locator('button:has-text("Continue")');
    await expect(continueBtn1).toBeEnabled({ timeout: 5000 });

    // Wait for navigation to step 2
    const navigationPromise = page.waitForURL('**/publish/step-2*', { timeout: 15000 });
    await continueBtn1.click();
    await navigationPromise;
    await page.screenshot({ path: 'e2e-screenshots/step-1-complete.png' });

    // Step 2: Upload/Template Selection
    console.log('\n=== STEP 2: Upload/Template Selection ===');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-screenshots/step-2-initial.png', fullPage: true });

    // Scroll down to see content
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);

    // "Structured template" should be selected by default
    console.log('Verifying template method is selected...');
    const templateBtn = page.locator('button:has-text("Structured template")');
    await expect(templateBtn).toBeVisible({ timeout: 10000 });

    // Scroll further to see the form
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-screenshots/step-2-form-view.png', fullPage: true });

    // Fill out form fields - use more flexible selectors
    console.log('Filling out form fields...');

    // Look for inputs and fill them based on what's visible
    const inputs = await page.locator('input[type="text"], textarea').all();
    console.log(`Found ${inputs.length} text inputs/textareas`);

    // Just try to fill any visible inputs with reasonable data
    // Authority
    console.log('Filling first input (authority)...');
    try {
      const firstInput = page.locator('input[type="text"]').first();
      await firstInput.fill('Westminster City Council', { timeout: 5000 });
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('Could not fill first input:', e);
    }

    // Application date
    console.log('Filling application date...');
    const today = new Date().toISOString().split('T')[0];
    try {
      await page.locator('input[type="date"]').first().fill(today, { timeout: 5000 });
      await page.waitForTimeout(300);
    } catch (e) {
      console.log('Could not fill application date:', e);
    }

    // Deadline date
    console.log('Filling deadline date...');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 28);
    const deadlineStr = deadline.toISOString().split('T')[0];
    try {
      await page.locator('input[type="date"]').nth(1).fill(deadlineStr, { timeout: 5000 });
      await page.waitForTimeout(300);
    } catch (e) {
      console.log('Could not fill deadline date:', e);
    }

    await page.screenshot({ path: 'e2e-screenshots/step-2-filled.png', fullPage: true });

    // Scroll to continue button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click Continue to Step 3
    console.log('Clicking Continue to Step 3...');
    const continueBtn2 = page.locator('button:has-text("Continue")');
    await expect(continueBtn2).toBeEnabled({ timeout: 5000 });
    const nav2Promise = page.waitForURL('**/publish/step-3*', { timeout: 15000 });
    await continueBtn2.click();
    await nav2Promise;
    await page.screenshot({ path: 'e2e-screenshots/step-2-complete.png' });

    // Step 3: Confirmation
    console.log('\n=== STEP 3: Confirmation ===');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-screenshots/step-3-initial.png' });

    // Scroll to continue button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Click Continue to Step 4
    console.log('Clicking Continue to Step 4...');
    const continueBtn3 = page.locator('button:has-text("Continue")');
    await expect(continueBtn3).toBeVisible({ timeout: 5000 });
    const nav3Promise = page.waitForURL('**/publish/step-4*', { timeout: 15000 });
    await continueBtn3.click();
    await nav3Promise;
    await page.screenshot({ path: 'e2e-screenshots/step-3-complete.png' });

    // Step 4: Payment
    console.log('\n=== STEP 4: Payment ===');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-screenshots/step-4-initial.png' });

    // Find and click Submit button
    console.log('Looking for Submit notice button...');
    const submitBtn = page.locator('button:has-text("Submit notice")');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    console.log('Clicking Submit notice...');
    await submitBtn.click();

    // Wait for any response (success or error)
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-screenshots/step-4-after-submit.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('\n=== RESULTS ===');
    console.log('Current URL after submit:', currentUrl);

    // Check for error messages
    const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }

    // Check for success messages
    const successMessages = await page.locator('.success, .text-green-500, [role="status"]').allTextContents();
    if (successMessages.length > 0) {
      console.log('Success messages found:', successMessages);
    }

    // Final screenshot
    await page.screenshot({ path: 'e2e-screenshots/step-4-final.png', fullPage: true });

    console.log('\n=== TEST COMPLETE ===');
  });
});
