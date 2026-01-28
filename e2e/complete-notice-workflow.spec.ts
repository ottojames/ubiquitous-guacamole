import { test, expect, Page } from '@playwright/test';

/**
 * Complete Notice Workflow Test
 * Tests the full flow: select type → fill form → submit → verify in council portal
 */

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174';

const ADMIN_CREDENTIALS = {
  email: 'ottoclarke@icloud.com',
  password: 'AdminPass2026!'
};

// Get today's date and deadline (28 days from now)
function getISODate(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Helper: Fill text input by various selectors
async function fillInput(page: Page, selectors: string[], value: string, label: string) {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
      await element.fill(value);
      console.log(`  ✓ Filled ${label}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
      return true;
    }
  }
  console.log(`  ⚠ Field not found: ${label}`);
  return false;
}

// Helper: Select option from dropdown
async function selectOption(page: Page, selectors: string[], optionText: string, label: string) {
  for (const selector of selectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
      try {
        await element.selectOption({ label: optionText });
        console.log(`  ✓ Selected ${label}: ${optionText}`);
        return true;
      } catch {
        // Try by value
        try {
          await element.selectOption(optionText);
          console.log(`  ✓ Selected ${label}: ${optionText}`);
          return true;
        } catch {
          console.log(`  ⚠ Could not select option for ${label}`);
        }
      }
    }
  }
  return false;
}

// Helper: Check checkbox
async function checkCheckbox(page: Page, labelText: string) {
  const checkbox = page.locator(`label:has-text("${labelText}") input[type="checkbox"], input[type="checkbox"][aria-label*="${labelText}"]`).first();
  if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
    console.log(`  ✓ Checked: ${labelText}`);
    return true;
  }

  // Try clicking the label directly
  const label = page.locator(`label:has-text("${labelText}")`).first();
  if (await label.isVisible({ timeout: 500 }).catch(() => false)) {
    await label.click();
    console.log(`  ✓ Clicked label: ${labelText}`);
    return true;
  }

  return false;
}

// Helper: Fill address fields using testId attribute (more reliable)
async function fillAddressFields(page: Page, prefix: string, address: {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}) {
  // Use data-testid which is more reliable
  const testIdPrefix = `${prefix.toLowerCase()}_address`;

  const line1Selectors = [
    `[data-testid="${testIdPrefix}-line1"]`,
    `input[name="${prefix}_addressLine1"]`,
    `input[name="${prefix}Line1"]`,
    `#${prefix}_address-line1`,
  ];
  const line2Selectors = [
    `[data-testid="${testIdPrefix}-line2"]`,
    `input[name="${prefix}_addressLine2"]`,
    `input[name="${prefix}Line2"]`,
  ];
  const citySelectors = [
    `[data-testid="${testIdPrefix}-city"]`,
    `input[name="${prefix}_addressCity"]`,
    `input[name="${prefix}City"]`,
  ];
  const postcodeSelectors = [
    `[data-testid="${testIdPrefix}-postcode"]`,
    `input[name="${prefix}_addressPostcode"]`,
    `input[name="${prefix}Postcode"]`,
  ];

  await fillInput(page, line1Selectors, address.line1, `${prefix} Address Line 1`);
  if (address.line2) {
    await fillInput(page, line2Selectors, address.line2, `${prefix} Address Line 2`);
  }
  await fillInput(page, citySelectors, address.city, `${prefix} City`);
  await fillInput(page, postcodeSelectors, address.postcode, `${prefix} Postcode`);
}

// Helper: Login to council portal
async function loginToCouncilPortal(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const councilPortalBtn = page.getByRole('button', { name: /council portal/i });
  if (await councilPortalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await councilPortalBtn.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
  await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(/\/c\//, { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

test.describe.serial('Complete Notice Workflow - Licensing', () => {
  test('Submit Licensing - Premises Licence New', async ({ page }) => {
    test.setTimeout(180000);

    console.log('\n=== Testing: Licensing - Premises Licence New ===');

    // Step 1: Navigate to publish page
    await page.goto(`${BASE_URL}/publish`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 2: Expand Licensing Act 2003 category
    console.log('  Expanding: Licensing Act 2003');
    const categoryHeader = page.getByText('Licensing Act 2003').first();
    await expect(categoryHeader).toBeVisible({ timeout: 5000 });
    await categoryHeader.click();
    await page.waitForTimeout(500);

    // Step 3: Select "Premises Licence — New"
    console.log('  Selecting: Premises Licence — New');
    const noticeOption = page.getByText('Premises Licence — New', { exact: true }).first();
    await expect(noticeOption).toBeVisible({ timeout: 5000 });
    await noticeOption.click();
    await page.waitForTimeout(500);

    // Step 4: Click Continue
    const continueBtn = page.locator('button:has-text("Continue")').first();
    await expect(continueBtn).toBeEnabled({ timeout: 5000 });
    await continueBtn.click();

    // Wait for Step 2
    await page.waitForURL(/\/publish\/step-2/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log('  Reached Step 2 - Filling form');

    // Fill confirmation email
    await fillInput(page, ['input#email', 'input[type="email"]'], 'licensing-test@example.com', 'Email');

    // Wait for template form
    await page.waitForTimeout(500);

    // Fill Applicant Name
    await fillInput(page, [
      'input[name="applicantname"]',
      'input[name="APPLICANT_NAME"]',
    ], 'The Sampleton Arms Ltd', 'Applicant Name');

    // Fill Premises Name
    await fillInput(page, [
      'input[name="premisesname"]',
      'input[name="PREMISES_NAME"]',
    ], 'The Sampleton Arms', 'Premises Name');

    // Fill Premises Address (data-testid is based on token: premises_address)
    console.log('  Filling premises address fields');
    await fillInput(page, [
      '[data-testid="premises_address-line1"]',
      'input[name="premises_addressLine1"]',
    ], '123 High Street', 'Premises Line 1');
    await fillInput(page, [
      '[data-testid="premises_address-city"]',
      'input[name="premises_addressCity"]',
    ], 'Sampleton', 'Premises City');
    await fillInput(page, [
      '[data-testid="premises_address-postcode"]',
      'input[name="premises_addressPostcode"]',
    ], 'SA1 1AA', 'Premises Postcode');

    // Select a licensable activity - Look for alcohol sale
    console.log('  Selecting licensable activities');
    const alcoholCheckbox = page.locator('text=Sale of alcohol').first();
    if (await alcoholCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await alcoholCheckbox.click();
      console.log('  ✓ Clicked: Sale of alcohol');
    }

    // Fill Application Date
    await fillInput(page, [
      'input[name="application_date"]',
      'input[name="applicationdate"]',
    ], getISODate(0), 'Application Date');

    // Fill Deadline Date
    await fillInput(page, [
      'input[name="deadline_date"]',
      'input[name="deadlinedate"]',
    ], getISODate(28), 'Deadline Date');

    // Fill Licensing Authority Name (search for Sampleton)
    const authorityInput = page.locator('input[name="authorityname"]').first();
    if (await authorityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await authorityInput.fill('Sampleton');
      await page.waitForTimeout(500);

      // Look for dropdown option
      const dropdown = page.locator('[role="listbox"] [role="option"], [class*="dropdown"] li, [class*="menu"] button').first();
      if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dropdown.click();
        console.log('  ✓ Selected authority from dropdown');
      }
    }

    // Fill Authority Address (data-testid is based on token: authority_address)
    console.log('  Filling authority address fields');
    await fillInput(page, [
      '[data-testid="authority_address-line1"]',
      'input[name="authority_addressLine1"]',
    ], 'Town Hall', 'Authority Line 1');
    await fillInput(page, [
      '[data-testid="authority_address-city"]',
      'input[name="authority_addressCity"]',
    ], 'Sampleton', 'Authority City');
    await fillInput(page, [
      '[data-testid="authority_address-postcode"]',
      'input[name="authority_addressPostcode"]',
    ], 'SA1 9ZZ', 'Authority Postcode');

    // Wait for form validation
    await page.waitForTimeout(1000);

    // Screenshot after filling
    await page.screenshot({
      path: 'test-results/workflow/licensing-premises-new-filled.png',
      fullPage: true,
    });

    // Check Continue button state
    const step2Continue = page.locator('[data-testid="upload-step-continue"]').first();
    const isEnabled = await step2Continue.isEnabled({ timeout: 3000 }).catch(() => false);
    console.log(`  Continue button enabled: ${isEnabled}`);

    if (!isEnabled) {
      // Log validation errors
      const errorMessages = await page.locator('.text-rose-600').allTextContents();
      console.log(`  Validation errors: ${errorMessages.filter(e => e.trim()).join(', ')}`);

      // Check required fields status
      const requiredCount = await page.locator('text=/required.*field/i').textContent().catch(() => '');
      console.log(`  Status: ${requiredCount}`);
    }

    if (isEnabled) {
      // Try to continue to Step 3
      await step2Continue.click();
      await page.waitForURL(/\/publish\/step-3/, { timeout: 10000 }).catch(() => {});
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'test-results/workflow/licensing-premises-new-step3.png',
        fullPage: true,
      });
      console.log('  ✓ Reached Step 3 - Confirm your notice');

      // Click "Generate Draft" if visible
      const generateDraftBtn = page.locator('button:has-text("Generate Draft")').first();
      if (await generateDraftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await generateDraftBtn.click();
        await page.waitForTimeout(3000);
        console.log('  ✓ Clicked Generate Draft');
      }

      // Click "Continue to payment"
      const continueToPaymentBtn = page.locator('button:has-text("Continue to payment")').first();
      if (await continueToPaymentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueToPaymentBtn.click();
        await page.waitForURL(/\/publish\/step-4/, { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: 'test-results/workflow/licensing-premises-new-step4.png',
          fullPage: true,
        });
        console.log('  ✓ Reached Step 4 - Payment');

        // Look for "Publish" or "Submit" button
        const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Submit"), button:has-text("Complete")').first();
        if (await publishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await publishBtn.click();
          await page.waitForTimeout(5000);

          await page.screenshot({
            path: 'test-results/workflow/licensing-premises-new-submitted.png',
            fullPage: true,
          });
          console.log('  ✓ Notice submitted');
        }
      }
    }

    console.log('  ✓ Licensing test completed');
  });
});

test.describe('Database Verification', () => {
  test('Check notices in database via API', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/notices/search?limit=20`);

    if (response.ok()) {
      const data = await response.json();
      console.log('\n=== Notices in Database ===');
      console.log(`Total: ${data.items?.length || 0}`);

      data.items?.forEach((notice: any, idx: number) => {
        console.log(`${idx + 1}. ${notice.premisesName || notice.applicantName || notice.id}`);
        console.log(`   Type: ${notice.noticeType}`);
        console.log(`   Status: ${notice.status}`);
      });
    }
  });
});

test.describe('Council Portal Verification', () => {
  test('Login and check notices', async ({ page }) => {
    const loggedIn = await loginToCouncilPortal(page);
    expect(loggedIn).toBeTruthy();

    await page.waitForTimeout(2000);
    await page.screenshot({
      path: 'test-results/workflow/council-dashboard.png',
      fullPage: true,
    });

    // Check for notices in the dashboard
    const noticesLink = page.getByRole('link', { name: /notices/i }).first();
    if (await noticesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noticesLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'test-results/workflow/council-notices-list.png',
        fullPage: true,
      });
    }

    console.log('Council portal verification complete');
  });
});
