import { test, expect } from '@playwright/test';

test('Navigate to Review of Premises Licence form', async ({ page }) => {
  // Step 1: Navigate to publish flow
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');

  // Take screenshot of initial state
  await page.screenshot({ path: '/tmp/step1-loaded.png', fullPage: true });

  // Step 2: Expand "Licensing Act 2003" category first
  console.log('Expanding Licensing Act 2003 category...');
  const licensingCategory = page.getByText('Licensing Act 2003');
  await licensingCategory.click();
  await page.waitForTimeout(500);

  // Take screenshot after expanding
  await page.screenshot({ path: '/tmp/step1-licensing-expanded.png', fullPage: true });

  // Step 3: Find and click "Premises Licence — Review" option
  console.log('Looking for Premises Licence — Review option...');
  const reviewOption = page.getByText('Premises Licence — Review');
  await reviewOption.scrollIntoViewIfNeeded();
  await reviewOption.click();
  await page.waitForTimeout(500);

  // Take screenshot after selecting
  await page.screenshot({ path: '/tmp/step1-review-selected.png', fullPage: true });

  // Step 3: Click Continue button
  const continueButton = page.getByRole('button', { name: /continue/i });
  await continueButton.click();
  await page.waitForLoadState('networkidle');

  // Take screenshot of step 2
  await page.screenshot({ path: '/tmp/step2-loaded.png', fullPage: true });

  // Step 4: Select "Structured Template" approach (it's already selected by default)
  console.log('Structured template selected, filling in email...');

  // Fill in the email address field
  const emailInput = page.getByLabel(/email address/i);
  await emailInput.fill('test@example.com');
  await page.waitForTimeout(500);

  // Take screenshot after filling email
  await page.screenshot({ path: '/tmp/step2-email-filled.png', fullPage: true });

  // Click Continue again
  console.log('Clicking Continue to go to form...');
  const continueButton2 = page.getByRole('button', { name: /continue/i });
  await continueButton2.click();
  await page.waitForLoadState('networkidle');

  // Step 5: Take final screenshot of the form
  await page.screenshot({ path: '/tmp/step3-form.png', fullPage: true });

  // Step 6: Verify fields are visible
  const formContent = await page.content();

  // Check for expected fields
  const reviewApplicantField = page.getByLabel(/review applicant/i, { exact: false });
  const reviewGroundsField = page.getByLabel(/review grounds/i, { exact: false });
  const licensingObjectivesField = page.getByLabel(/licensing objectives/i, { exact: false });

  console.log('=== VERIFICATION ===');
  console.log('Review Applicant field visible:', await reviewApplicantField.isVisible().catch(() => false));
  console.log('Review Grounds field visible:', await reviewGroundsField.isVisible().catch(() => false));
  console.log('Licensing Objectives field visible:', await licensingObjectivesField.isVisible().catch(() => false));

  // Get all visible input fields, textareas, and selects
  const inputs = await page.locator('input:visible, textarea:visible, select:visible').all();
  console.log(`\n=== VISIBLE FORM FIELDS (${inputs.length} total) ===`);

  for (const input of inputs) {
    const label = await input.getAttribute('aria-label') ||
                  await input.getAttribute('placeholder') ||
                  await input.getAttribute('name') ||
                  await input.getAttribute('id') ||
                  'unlabeled';
    const type = await input.getAttribute('type') || await input.evaluate(el => el.tagName.toLowerCase());
    console.log(`- ${label} (${type})`);
  }

  // Also check for any conditional rendering
  const allLabels = await page.locator('label:visible').allTextContents();
  console.log('\n=== ALL VISIBLE LABELS ===');
  allLabels.forEach(label => console.log(`- ${label}`));
});
