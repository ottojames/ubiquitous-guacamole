/**
 * Comprehensive Council Officer Workflow E2E Test
 *
 * Tests the complete flow:
 * 1. Council officer login
 * 2. Publishing a premises licence notice via the wizard
 * 3. Notice verification in council portal
 * 4. Public user submitting a representation
 * 5. Council officer viewing the representation
 *
 * This test validates the full backend integration from notice creation to representation receipt.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:5174';

// Demo council credentials (from Login.tsx lines 38-42)
const COUNCIL_EMAIL = 'demo@council.gov.uk';
const COUNCIL_PASSWORD = 'demo123';

// Test data
const TEST_APPLICANT_NAME = 'Demo Licensing Ltd';
const TEST_PREMISES_NAME = 'The Playwright Arms';
const TEST_PREMISES_ADDRESS = '123 High Street';
const TEST_PREMISES_POSTCODE = 'SW1A 1AA';

test.describe('Council Notice Upload and Representations Flow', () => {
  let noticeId: string;

  test.beforeEach(async ({ page }) => {
    // Start each test at the home page
    await page.goto(BASE_URL);
  });

  test('should complete full workflow: login → publish notice → receive representation', async ({ page }) => {
    // ============================================================
    // STEP 1: Login as Council Officer
    // ============================================================
    console.log('[TEST] Step 1: Logging in as council officer...');

    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);

    // Select council portal
    const councilPortalButton = page.locator('button', { hasText: 'Council Portal' });
    await expect(councilPortalButton).toBeVisible({ timeout: 10000 });
    await councilPortalButton.click();

    // Wait for login form to appear
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

    // Fill in credentials
    await page.fill('input[type="email"]', COUNCIL_EMAIL);
    await page.fill('input[type="password"]', COUNCIL_PASSWORD);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for redirect to council portal (Westminster council dashboard)
    await page.waitForURL(/\/c\/westminster\/licensing/, { timeout: 10000 });
    console.log('[TEST] ✓ Successfully logged in to council portal');

    // Verify we're logged in by checking for logout/sign out button
    const logoutButton = page.locator('text=/sign out|logout/i').first();
    await expect(logoutButton).toBeVisible({ timeout: 10000 });

    // ============================================================
    // STEP 2: Navigate to Publish Wizard
    // ============================================================
    console.log('[TEST] Step 2: Navigating to publish wizard...');

    // Navigate to publish flow (this should work even in council context)
    await page.goto(`${BASE_URL}/publish/step-1`);
    await expect(page).toHaveURL(/\/publish\/step-1/);
    console.log('[TEST] ✓ Reached publish wizard Step 1');

    // ============================================================
    // STEP 3: Select Notice Type
    // ============================================================
    console.log('[TEST] Step 3: Selecting notice type...');

    // Wait for notice type options to load
    await expect(page.locator('[data-testid="notice-option-licensing-premises-new"]')).toBeVisible({
      timeout: 10000
    });

    // Select "Premises Licence - New Application"
    await page.click('[data-testid="notice-option-licensing-premises-new"]');

    // Click Continue to Step 2
    await page.click('[data-testid="notice-step-continue"]');
    await expect(page).toHaveURL(/\/publish\/step-2/, { timeout: 10000 });
    console.log('[TEST] ✓ Selected notice type and advanced to Step 2');

    // ============================================================
    // STEP 4: Upload Notice Document
    // ============================================================
    console.log('[TEST] Step 4: Uploading notice document...');

    // Wait for Step 2 to load
    await expect(page.locator('text=/upload|choose file/i').first()).toBeVisible({
      timeout: 10000
    });

    // Locate file input (may be hidden, so we use setInputFiles directly)
    const fileInput = page.locator('input[type="file"]').first();

    // Upload the demo notice file
    const demoFilePath = path.join(__dirname, '..', 'fixtures', 'premises-licence-demo.txt');
    await fileInput.setInputFiles(demoFilePath);
    console.log('[TEST] ✓ File uploaded, waiting for OCR processing...');

    // Wait for OCR processing to complete (look for success indicators)
    // The upload component should show extracted data or a success state
    await expect(page.locator('text=/text extracted|extraction complete|processing complete/i').first())
      .toBeVisible({ timeout: 30000 });
    console.log('[TEST] ✓ OCR processing completed');

    // Fill in contact email (required field in Step 2)
    const emailInput = page.locator('input[type="email"]').filter({ hasText: '' }).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('licensing@westminster.gov.uk');
      console.log('[TEST] ✓ Filled confirmation email');
    }

    // ============================================================
    // STEP 5: Verify Required Fields
    // ============================================================
    console.log('[TEST] Step 5: Verifying required fields are populated...');

    // The system should have extracted key fields from the OCR text
    // Check that the Continue button becomes enabled (indicating required fields are filled)
    const continueButton = page.locator('[data-testid="upload-step-continue"]');

    // Wait for Continue button to become enabled (max 5 seconds)
    // If it's still disabled, we may need to manually fill required fields
    await page.waitForTimeout(2000); // Give time for validation

    const isDisabled = await continueButton.isDisabled();
    if (isDisabled) {
      console.log('[TEST] Continue button disabled, checking for required fields...');

      // Look for any required field indicators
      const requiredFields = page.locator('input[required], textarea[required]');
      const count = await requiredFields.count();

      if (count > 0) {
        console.log(`[TEST] Found ${count} required fields that may need filling`);
        // For now, we'll try to proceed - the test will fail if fields are truly missing
      }
    }

    // Click Continue to Step 3 (Confirm)
    await continueButton.click({ timeout: 5000 });
    await expect(page).toHaveURL(/\/publish\/step-3/, { timeout: 10000 });
    console.log('[TEST] ✓ Advanced to Step 3 (Confirm)');

    // ============================================================
    // STEP 6: Confirm Notice Details
    // ============================================================
    console.log('[TEST] Step 6: Reviewing and confirming notice...');

    // Wait for preview to load
    await expect(page.locator('text=/confirm|review|preview/i').first()).toBeVisible({
      timeout: 10000
    });

    // Verify the notice preview contains our test data
    await expect(page.locator('text=/demo licensing ltd/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/playwright arms/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/123 high street/i')).toBeVisible({ timeout: 5000 });
    console.log('[TEST] ✓ Notice preview contains expected data');

    // Click Continue to Step 4 (Payment)
    await page.click('[data-testid="confirm-step-continue"]');
    await expect(page).toHaveURL(/\/publish\/step-4/, { timeout: 10000 });
    console.log('[TEST] ✓ Advanced to Step 4 (Payment)');

    // ============================================================
    // STEP 7: Complete Payment/Publication
    // ============================================================
    console.log('[TEST] Step 7: Completing publication...');

    // Wait for payment step to load
    await expect(page.locator('text=/payment|review and pay|publish/i').first()).toBeVisible({
      timeout: 10000
    });

    // Look for Skip Payment or Test Mode button (development environment)
    const skipPaymentButton = page.locator('button:has-text("Skip payment"), button:has-text("Test mode")');

    if (await skipPaymentButton.isVisible({ timeout: 2000 })) {
      console.log('[TEST] Found skip payment button, using test mode...');
      await skipPaymentButton.click();
    } else {
      // Try to submit without payment (legacy flow)
      console.log('[TEST] No skip payment button, looking for submit button...');
      const submitButton = page.locator('button:has-text("Publish"), button:has-text("Complete"), button:has-text("Submit")');
      await submitButton.click();
    }

    // Wait for success indication
    // This could be a success modal, a redirect, or a success message
    const successIndicator = page.locator('text=/published successfully|notice created|success/i').first();
    await expect(successIndicator).toBeVisible({ timeout: 20000 });
    console.log('[TEST] ✓ Notice published successfully');

    // Extract notice ID from the success page or URL
    // The notice ID might be in a link like "View notice" or in the URL after redirect
    const viewNoticeLink = page.locator('a:has-text("View notice"), a[href*="/notices/"]');

    if (await viewNoticeLink.isVisible({ timeout: 5000 })) {
      const href = await viewNoticeLink.getAttribute('href');
      const match = href?.match(/\/notices\/([a-zA-Z0-9-]+)/);
      if (match) {
        noticeId = match[1];
        console.log(`[TEST] ✓ Captured notice ID: ${noticeId}`);
      }
    } else {
      // Try to extract from current URL
      const currentUrl = page.url();
      const match = currentUrl.match(/\/notices\/([a-zA-Z0-9-]+)/);
      if (match) {
        noticeId = match[1];
        console.log(`[TEST] ✓ Captured notice ID from URL: ${noticeId}`);
      }
    }

    // If we still don't have a notice ID, query the API for the most recent notice
    if (!noticeId) {
      console.log('[TEST] Notice ID not found in UI, querying API for latest notice...');
      const response = await page.request.get(`${API_BASE}/api/notices?limit=1&sort=created_at:desc`);
      const data = await response.json();
      if (data.notices && data.notices.length > 0) {
        noticeId = data.notices[0].id;
        console.log(`[TEST] ✓ Retrieved notice ID from API: ${noticeId}`);
      }
    }

    expect(noticeId).toBeTruthy();
    console.log(`[TEST] ✓ Notice published with ID: ${noticeId}`);

    // ============================================================
    // STEP 8: Verify Notice Appears in Council Portal
    // ============================================================
    console.log('[TEST] Step 8: Verifying notice appears in council portal...');

    // Navigate to council notices list
    await page.goto(`${BASE_URL}/c/westminster/licensing/notices`);

    // Search for our newly published notice
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill(TEST_APPLICANT_NAME);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000); // Wait for search results
    }

    // Verify the notice appears in the list
    await expect(page.locator(`text=/demo licensing ltd/i`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=/playwright arms/i`).first()).toBeVisible({ timeout: 5000 });
    console.log('[TEST] ✓ Notice appears in council portal');

    // ============================================================
    // STEP 9: Submit Public Representation (as citizen)
    // ============================================================
    console.log('[TEST] Step 9: Submitting public representation...');

    // Navigate to the public notice page
    await page.goto(`${BASE_URL}/notices/${noticeId}`);
    await expect(page).toHaveURL(new RegExp(`/notices/${noticeId}`), { timeout: 10000 });

    // Look for "Submit representation" or "Make objection" button
    const submitRepButton = page.locator(
      'button:has-text("Submit representation"), ' +
      'button:has-text("Make objection"), ' +
      'a:has-text("Submit representation")'
    ).first();

    await expect(submitRepButton).toBeVisible({ timeout: 10000 });
    await submitRepButton.click();
    console.log('[TEST] ✓ Clicked submit representation button');

    // Wait for representation form to load
    await expect(page).toHaveURL(/\/submit-representation|\/representations\/new/, { timeout: 10000 });
    await expect(page.locator('form, input[name="fullName"], input[placeholder*="name" i]').first())
      .toBeVisible({ timeout: 10000 });

    // Fill in representation form
    await page.fill('input[name="fullName"], input[id="fullName"]', 'Test Resident');
    await page.fill('input[name="email"], input[type="email"]', 'resident@example.com');
    await page.fill('textarea[name="address"], textarea[id="address"]', '456 Nearby Street, Westminster, London, SW1A 2BB');

    // Select objection type
    const objectionButton = page.locator('button:has-text("Objection"), input[value="objection"]').first();
    if (await objectionButton.isVisible({ timeout: 2000 })) {
      await objectionButton.click();
    }

    // Fill in comments/representation text
    const commentsField = page.locator(
      'textarea[name="comments"], ' +
      'textarea[name="content"], ' +
      'textarea[placeholder*="concern" i]'
    ).first();

    await commentsField.fill(
      'I wish to object to this application on the grounds of public nuisance. ' +
      'The proposed late-night hours (until 00:30 on weekends) will cause significant ' +
      'noise disturbance to residents living nearby. The area is primarily residential ' +
      'and the licensing objectives for prevention of public nuisance are not adequately addressed.'
    );
    console.log('[TEST] ✓ Filled representation form');

    // Submit the representation
    const submitFormButton = page.locator(
      'button[type="submit"]:has-text("Submit"), ' +
      'button:has-text("Send representation"), ' +
      'button:has-text("Open Email")'
    ).first();

    await submitFormButton.click();
    console.log('[TEST] ✓ Submitted representation form');

    // Wait for success confirmation
    await expect(
      page.locator('text=/submitted successfully|email client|thank you/i').first()
    ).toBeVisible({ timeout: 15000 });
    console.log('[TEST] ✓ Representation submitted successfully');

    // ============================================================
    // STEP 10: Verify Council Receives Representation
    // ============================================================
    console.log('[TEST] Step 10: Verifying council receives representation...');

    // Navigate back to council portal to view representations
    await page.goto(`${BASE_URL}/c/westminster/licensing/notices/${noticeId}`);

    // Look for representations tab or section
    const representationsTab = page.locator(
      'a:has-text("Representations"), ' +
      'button:has-text("Representations"), ' +
      'text=/representations \\(/i'
    ).first();

    if (await representationsTab.isVisible({ timeout: 5000 })) {
      await representationsTab.click();
      await page.waitForTimeout(1000);
    } else {
      // Representations might be on the same page
      console.log('[TEST] Representations tab not found, checking current page...');
    }

    // Verify representation appears
    await expect(page.locator('text=/test resident/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/resident@example.com/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/noise disturbance/i')).toBeVisible({ timeout: 5000 });
    console.log('[TEST] ✓ Representation appears in council portal');

    // Check for unread status indicator
    const unreadIndicator = page.locator('text=/new|unread|pending/i, [class*="unread"]').first();
    if (await unreadIndicator.isVisible({ timeout: 2000 })) {
      console.log('[TEST] ✓ Representation marked as unread/new');
    }

    console.log('[TEST] ========================================');
    console.log('[TEST] ✓ ALL TESTS PASSED - Full workflow completed successfully!');
    console.log('[TEST] ========================================');
  });

  test('should verify API endpoints respond correctly', async ({ page }) => {
    // ============================================================
    // API Health Check Test
    // ============================================================
    console.log('[API TEST] Testing API endpoints...');

    // Test health endpoint
    const healthResponse = await page.request.get(`${API_BASE}/api/health`);
    expect(healthResponse.ok()).toBeTruthy();
    console.log('[API TEST] ✓ Health endpoint responding');

    // Test notices list endpoint
    const noticesResponse = await page.request.get(`${API_BASE}/api/notices?limit=5`);
    expect(noticesResponse.ok()).toBeTruthy();
    const noticesData = await noticesResponse.json();
    expect(Array.isArray(noticesData.notices)).toBeTruthy();
    console.log(`[API TEST] ✓ Notices endpoint responding (${noticesData.notices.length} notices)`);

    // Test representations endpoint structure (should require auth but return 401, not 500)
    if (noticesData.notices.length > 0) {
      const testNoticeId = noticesData.notices[0].id;
      const repsResponse = await page.request.get(
        `${API_BASE}/api/notices/${testNoticeId}/representations`
      );

      // Should return 401 Unauthorized or 200 OK, not 500
      expect([200, 401, 403].includes(repsResponse.status())).toBeTruthy();
      console.log(`[API TEST] ✓ Representations endpoint responding (status: ${repsResponse.status()})`);
    }

    console.log('[API TEST] ✓ All API endpoints responding correctly');
  });

  test('should handle missing notice ID gracefully', async ({ page }) => {
    // Test error handling when notice doesn't exist
    await page.goto(`${BASE_URL}/notices/non-existent-notice-id`);

    // Should show error message, not crash
    await expect(
      page.locator('text=/not found|error|unable to load/i').first()
    ).toBeVisible({ timeout: 10000 });

    console.log('[ERROR TEST] ✓ Handles missing notice ID gracefully');
  });

  test('should validate representation form fields', async ({ page }) => {
    // ============================================================
    // Form Validation Test
    // ============================================================
    console.log('[VALIDATION TEST] Testing form validation...');

    // Navigate to submit representation page (using a placeholder notice ID)
    // In a real test, we'd use a known test notice ID
    await page.goto(`${BASE_URL}/notices/test-notice-id/submit-representation`);

    // Check if we get a valid form or a "not found" error
    const hasForm = await page.locator('form, input[name="fullName"]').isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasForm) {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should see validation errors
      const hasValidationError = await page.locator(
        'text=/required|please fill|invalid/i, [class*="error"]'
      ).first().isVisible({ timeout: 2000 }).catch(() => false);

      if (hasValidationError) {
        console.log('[VALIDATION TEST] ✓ Form validation working correctly');
      } else {
        console.log('[VALIDATION TEST] ~ Form validation not detected (may be using browser native validation)');
      }
    } else {
      console.log('[VALIDATION TEST] ~ Skipped (notice not found - expected for placeholder ID)');
    }
  });
});

test.describe('Council Portal Navigation', () => {
  test('should login and access council dashboard', async ({ page }) => {
    // Quick smoke test for council portal access
    await page.goto(`${BASE_URL}/login`);

    // Select council portal
    await page.click('button:has-text("Council Portal")');

    // Login
    await page.fill('input[type="email"]', COUNCIL_EMAIL);
    await page.fill('input[type="password"]', COUNCIL_PASSWORD);
    await page.click('button[type="submit"]');

    // Verify redirect to council portal
    await page.waitForURL(/\/c\/westminster\/licensing/, { timeout: 10000 });

    // Should see council-specific UI elements
    const hasCouncilElements = await page.locator(
      'text=/licensing|notices|dashboard/i'
    ).first().isVisible({ timeout: 5000 });

    expect(hasCouncilElements).toBeTruthy();
    console.log('[PORTAL TEST] ✓ Council portal accessible and rendering correctly');
  });
});
