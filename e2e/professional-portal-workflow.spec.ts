import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Professional/Firm Portal Workflow', () => {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'workflow');

  test('complete professional portal flow and council verification', async ({ page, browser }) => {
    // Step 1: Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, '01-login-page.png'),
      fullPage: true
    });

    // Step 2: Check if there's a professional/firm tab or selector
    const professionalTab = page.locator('text=/professional|firm/i').first();
    const tabExists = await professionalTab.count() > 0;

    if (tabExists) {
      await professionalTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotDir, '02-professional-tab-selected.png'),
        fullPage: true
      });
    }

    // Step 3: Login with professional credentials
    await page.fill('input[type="email"], input[name="email"]', 'ottoclarke@icloud.com');
    await page.fill('input[type="password"], input[name="password"]', 'AdminPass2026!');
    await page.screenshot({
      path: path.join(screenshotDir, '03-credentials-entered.png'),
      fullPage: true
    });

    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 4: Verify we're on professional dashboard
    await page.screenshot({
      path: path.join(screenshotDir, '04-professional-dashboard.png'),
      fullPage: true
    });

    // Check for professional/firm specific elements
    const dashboardUrl = page.url();
    console.log('Dashboard URL:', dashboardUrl);

    // Look for indicators this is professional portal
    const professionalIndicators = [
      page.locator('text=/my representations/i'),
      page.locator('text=/my notices/i'),
      page.locator('text=/submit notice/i'),
      page.locator('text=/upload notice/i'),
      page.locator('text=/firm|professional/i')
    ];

    let indicatorFound = false;
    for (const indicator of professionalIndicators) {
      if (await indicator.count() > 0) {
        indicatorFound = true;
        console.log('Found professional indicator:', await indicator.first().textContent());
        break;
      }
    }

    // Step 5: Navigate to publish/upload notice page
    const publishButtons = [
      page.locator('a[href*="/publish"]').first(),
      page.locator('button:has-text("Publish")').first(),
      page.locator('button:has-text("Submit Notice")').first(),
      page.locator('a:has-text("Upload Notice")').first(),
      page.locator('a:has-text("Create Notice")').first()
    ];

    let publishClicked = false;
    for (const button of publishButtons) {
      if (await button.count() > 0) {
        await button.click();
        publishClicked = true;
        console.log('Clicked publish button');
        break;
      }
    }

    if (!publishClicked) {
      // Try navigating directly
      await page.goto('http://localhost:5173/publish');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotDir, '05-publish-page.png'),
      fullPage: true
    });

    // Step 6: Select notice category and type
    // The page shows category groups (Licensing Act 2003, Gambling Act, etc.)
    // Click on Licensing Act 2003 category first
    const licensingCategory = page.locator('text=Licensing Act 2003').first();
    if (await licensingCategory.count() > 0) {
      await licensingCategory.click();
      await page.waitForTimeout(1000);
      console.log('Clicked Licensing Act 2003 category');
      await page.screenshot({
        path: path.join(screenshotDir, '06a-category-selected.png'),
        fullPage: true
      });
    }

    // Now look for a specific notice type within the expanded category
    // Wait for animation to complete
    await page.waitForTimeout(1000);

    // Try to find and click a notice type option
    const noticeTypeButton = page.locator('[data-testid*="notice-option"]').first();
    if (await noticeTypeButton.count() > 0) {
      await noticeTypeButton.waitFor({ state: 'visible', timeout: 5000 });
      await noticeTypeButton.click({ force: true });
      console.log('Selected notice type');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '06b-notice-type-selected.png'),
      fullPage: true
    });

    // Click Continue button to proceed to next step
    const continueButton = page.locator('button:has-text("Continue")').first();
    if (await continueButton.count() > 0 && await continueButton.isEnabled()) {
      await continueButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      console.log('Clicked Continue to next step');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '07-next-step.png'),
      fullPage: true
    });

    // Fill in any visible form fields on the next step
    const applicantName = page.locator('input[name*="applicant"], input[placeholder*="Applicant"]').first();
    if (await applicantName.count() > 0) {
      await applicantName.fill('Test Applicant Ltd');
      console.log('Filled applicant name');
    }

    const premisesName = page.locator('input[name*="premises"], input[placeholder*="Premises"]').first();
    if (await premisesName.count() > 0) {
      await premisesName.fill('The Test Pub');
      console.log('Filled premises name');
    }

    const address = page.locator('input[name*="address"], textarea[name*="address"]').first();
    if (await address.count() > 0) {
      await address.fill('123 Test Street, London, SW1A 1AA');
      console.log('Filled address');
    }

    const postcode = page.locator('input[name*="postcode"]').first();
    if (await postcode.count() > 0) {
      await postcode.fill('SW1A 1AA');
      console.log('Filled postcode');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '08-form-filled.png'),
      fullPage: true
    });

    // Step 7: Look for file upload if present
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      console.log('File upload field found');
      await page.screenshot({
        path: path.join(screenshotDir, '09-upload-field-found.png'),
        fullPage: true
      });
    }

    // Step 8: Try to submit/continue through the form
    const submitButtons = [
      page.locator('button[type="submit"]').first(),
      page.locator('button:has-text("Submit")').first(),
      page.locator('button:has-text("Publish")').first(),
      page.locator('button:has-text("Continue")').last()
    ];

    let submitFound = false;
    for (const button of submitButtons) {
      if (await button.count() > 0 && await button.isVisible()) {
        const buttonText = await button.textContent();
        console.log('Found submit/continue button:', buttonText);
        await page.screenshot({
          path: path.join(screenshotDir, '10-before-submit.png'),
          fullPage: true
        });

        // Take screenshot before submitting
        await button.click();
        submitFound = true;
        await page.waitForTimeout(2000);
        console.log('Clicked submit/continue button');
        break;
      }
    }

    await page.screenshot({
      path: path.join(screenshotDir, '11-after-submit.png'),
      fullPage: true
    });

    // Step 9: Check for success message or redirection
    const successIndicators = [
      page.locator('text=/success|submitted|published/i'),
      page.locator('[role="alert"]'),
      page.locator('.success, .alert-success')
    ];

    for (const indicator of successIndicators) {
      if (await indicator.count() > 0) {
        console.log('Success indicator found:', await indicator.first().textContent());
      }
    }

    const currentUrl = page.url();
    console.log('After submit URL:', currentUrl);

    await page.screenshot({
      path: path.join(screenshotDir, '12-current-page-state.png'),
      fullPage: true
    });

    // Step 10: Logout from professional portal
    const logoutButtons = [
      page.locator('button:has-text("Logout")').first(),
      page.locator('button:has-text("Sign out")').first(),
      page.locator('a:has-text("Logout")').first()
    ];

    for (const button of logoutButtons) {
      if (await button.count() > 0) {
        await button.click();
        await page.waitForTimeout(1000);
        console.log('Logged out from professional portal');
        break;
      }
    }

    // Step 11: Open new context for council portal
    const councilContext = await browser.newContext();
    const councilPage = await councilContext.newPage();

    await councilPage.goto('http://localhost:5173/login');
    await councilPage.waitForLoadState('networkidle');

    // Look for council tab/option
    const councilTab = councilPage.locator('text=/council/i').first();
    if (await councilTab.count() > 0) {
      await councilTab.click();
      await councilPage.waitForTimeout(500);
    }

    await councilPage.screenshot({
      path: path.join(screenshotDir, '13-council-login-page.png'),
      fullPage: true
    });

    // Step 12: Login to council portal (if credentials are different)
    // For now, try the same credentials or navigate to notices page without login
    await councilPage.goto('http://localhost:5173/notices');
    await councilPage.waitForLoadState('networkidle');
    await councilPage.waitForTimeout(2000);

    await councilPage.screenshot({
      path: path.join(screenshotDir, '14-council-notices-page.png'),
      fullPage: true
    });

    // Step 13: Look for the submitted notice
    const noticesList = councilPage.locator('[data-testid*="notice"], .notice-card, article');
    const noticesCount = await noticesList.count();
    console.log('Notices found on council portal:', noticesCount);

    // Search for test notice
    const testNotice = councilPage.locator('text=/Test Applicant|The Test Pub/i').first();
    if (await testNotice.count() > 0) {
      console.log('Test notice found in council portal!');
      await testNotice.scrollIntoViewIfNeeded();
      await councilPage.screenshot({
        path: path.join(screenshotDir, '15-test-notice-found.png'),
        fullPage: true
      });
    } else {
      console.log('Test notice not found in council portal');
    }

    await councilPage.screenshot({
      path: path.join(screenshotDir, '16-council-verification-complete.png'),
      fullPage: true
    });

    await councilContext.close();

    // Final verification screenshot from professional portal perspective
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, '17-final-state.png'),
      fullPage: true
    });
  });
});
