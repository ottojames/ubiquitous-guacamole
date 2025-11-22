/**
 * Test Helper Functions for Council Workflow E2E Tests
 *
 * This file contains reusable helper functions to keep test code DRY
 * and make tests more maintainable.
 */

import { type Page, expect } from '@playwright/test';

// ============================================================
// CONSTANTS
// ============================================================

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
export const API_BASE = process.env.VITE_API_BASE || 'http://localhost:5174';

export const COUNCIL_CREDENTIALS = {
  WESTMINSTER: {
    email: 'demo@council.gov.uk',
    password: 'demo123',
    redirectPath: '/c/westminster/licensing/dashboard'
  },
  SAMPLE_BOROUGH: {
    email: 'licensing@sample.gov.uk',
    password: 'sample123',
    redirectPath: '/c/sample-borough/licensing/dashboard'
  }
};

export const RBAC_TEST_USERS = {
  VIEWER: {
    email: 'viewer@test.civicnotices.co.uk',
    password: 'TestPassword123!',
    permissions: 4
  },
  OFFICER: {
    email: 'officer@test.civicnotices.co.uk',
    password: 'TestPassword123!',
    permissions: 12
  },
  ADMIN: {
    email: 'admin@test.civicnotices.co.uk',
    password: 'TestPassword123!',
    permissions: 21
  }
};

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

/**
 * Login as a council officer
 */
export async function loginAsCouncil(
  page: Page,
  credentials = COUNCIL_CREDENTIALS.WESTMINSTER
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);

  // Select council portal
  const councilPortalButton = page.locator('button', { hasText: 'Council Portal' });
  await expect(councilPortalButton).toBeVisible({ timeout: 10000 });
  await councilPortalButton.click();

  // Fill credentials
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to complete
  // Demo logins use window.location.href which causes full page reload
  await page.waitForURL(new RegExp(credentials.redirectPath), { timeout: 10000 });

  // Wait for page to be fully loaded (wait for network idle)
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Wait for loading spinner to disappear (CouncilLayout shows spinner while loading department data)
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {
    console.log('No loading spinner found or already hidden');
  });

  // Wait for dashboard/notices navigation to appear (indicates CouncilLayout has rendered)
  const navItem = page.locator('nav a, nav button').filter({ hasText: /dashboard|notices|drafts/i }).first();
  await expect(navItem).toBeVisible({ timeout: 10000 });

  // Verify logged in by checking for Sign Out button in sidebar
  // The button is in the sidebar footer
  const logoutButton = page.locator('button:has-text("Sign Out")');
  await expect(logoutButton).toBeVisible({ timeout: 10000 });
}

/**
 * Login as a professional firm user
 */
export async function loginAsFirm(
  page: Page,
  email = 'solicitor@wilsonpartners.com',
  password = 'SolicitorTest123!'
): Promise<void> {
  await page.goto(`${BASE_URL}/login`);

  // Select professional portal
  const firmPortalButton = page.locator('button', { hasText: 'Professional Portal' });
  await expect(firmPortalButton).toBeVisible({ timeout: 10000 });
  await firmPortalButton.click();

  // Fill credentials
  await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to firm dashboard
  await page.waitForURL(/\/f\/.*\/dashboard/, { timeout: 10000 });

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify logged in by checking for dashboard content
  await page.waitForSelector('text=/dashboard|clients|notices/i', { timeout: 10000 });
}

// ============================================================
// PUBLISH WIZARD HELPERS
// ============================================================

/**
 * Get category label for a notice type ID
 */
function getCategoryForNoticeType(noticeTypeId: string): string {
  // Map notice type IDs to their category labels
  const categoryMap: Record<string, string> = {
    // Licensing Act 2003
    'licensing-premises-new': 'Licensing Act 2003',
    'licensing-premises-variation': 'Licensing Act 2003',
    'licensing-premises-review': 'Licensing Act 2003',
    'licensing-club-new': 'Licensing Act 2003',
    'licensing-club-variation': 'Licensing Act 2003',
    'licensing-club-review': 'Licensing Act 2003',

    // Gambling Act 2005
    'gambling-betting-new': 'Gambling Act 2005',
    'gambling-betting-variation': 'Gambling Act 2005',
    'gambling-bingo-new': 'Gambling Act 2005',
    'gambling-bingo-variation': 'Gambling Act 2005',
    'gambling-casino-new': 'Gambling Act 2005',
    'gambling-casino-variation': 'Gambling Act 2005',
    'gambling-adult-gaming-centre-new': 'Gambling Act 2005',
    'gambling-adult-gaming-centre-variation': 'Gambling Act 2005',
    'gambling-family-entertainment-centre-new': 'Gambling Act 2005',
    'gambling-family-entertainment-centre-variation': 'Gambling Act 2005',

    // GVOL
    'gvol-new': "Goods Vehicle Operator's Licence",
    'gvol-variation': "Goods Vehicle Operator's Licence",
    'gvol-transfer': "Goods Vehicle Operator's Licence",

    // Planning
    'planning-eia-development': 'Planning (Press Notices)',
    'planning-listed-building': 'Planning (Press Notices)',
    'planning-conservation-area': 'Planning (Press Notices)',
    'planning-tpo': 'Planning (Press Notices)',
    'planning-tro': 'Planning (Press Notices)',

    // Probate
    'probate-s27-notice': 'Probate Notices',
  };

  return categoryMap[noticeTypeId] || 'Unknown Category';
}

/**
 * Complete Step 1: Select notice type
 *
 * IMPORTANT: This function handles collapsible categories.
 * Categories are collapsed by default, so we must expand them first.
 */
export async function selectNoticeType(
  page: Page,
  noticeTypeId = 'licensing-premises-new'
): Promise<void> {
  await page.goto(`${BASE_URL}/publish/step-1`);
  await expect(page).toHaveURL(/\/publish\/step-1/);

  // Determine which category this notice type belongs to
  const categoryLabel = getCategoryForNoticeType(noticeTypeId);

  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Look for the category section (details element with summary containing category name)
  const categorySummary = page.locator('summary', { hasText: categoryLabel });

  // Check if category is already expanded (has open attribute on parent details)
  const detailsElement = page.locator('details').filter({ has: categorySummary });
  const isOpen = await detailsElement.evaluate((el) => el.hasAttribute('open'));

  if (!isOpen) {
    // Click summary to expand the category
    await categorySummary.click();

    // Wait for expansion animation
    await page.waitForTimeout(400);
  }

  // Now wait for the notice type button to be visible
  const noticeButton = page.locator(`[data-testid="notice-option-${noticeTypeId}"]`);
  await expect(noticeButton).toBeVisible({ timeout: 10000 });

  // Select notice type
  await noticeButton.click();

  // Continue
  await page.click('[data-testid="notice-step-continue"]');
  await expect(page).toHaveURL(/\/publish\/step-2/, { timeout: 10000 });
}

/**
 * Complete Step 2: Use structured template
 *
 * Fills in a premises licence template with minimal required fields.
 * This is the recommended approach for the new wizard flow.
 */
export async function fillStructuredTemplate(
  page: Page,
  contactEmail = 'licensing@test.gov.uk',
  premisesData = {
    applicant: 'Demo Licensing Ltd',
    premisesName: 'The Playwright Arms',
    address: '123 High Street, Westminster, London',
    postcode: 'SW1A 1AA'
  }
): Promise<void> {
  await expect(page).toHaveURL(/\/publish\/step-2/);

  // Wait for step to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Click "Structured template" tab if not already active
  const structuredTemplateTab = page.locator('button:has-text("Structured template")');
  const isTemplateActive = await structuredTemplateTab.evaluate((el) =>
    el.classList.contains('bg-blue-600')
  ).catch(() => false);

  if (!isTemplateActive) {
    console.log('[TEST HELPER] Switching to Structured template mode...');
    await structuredTemplateTab.click();
    await page.waitForTimeout(500); // Wait for tab switch
  }

  console.log('[TEST HELPER] Filling structured template fields...');

  // Fill contact email (at top of step)
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 2000 })) {
    await emailInput.clear();
    await emailInput.fill(contactEmail);
  }

  // Fill premises template fields
  // Field names are lowercase without underscores (e.g., APPLICANT_NAME -> applicantname)
  await page.fill('input[name="applicantname"]', premisesData.applicant);
  await page.fill('input[name="premisesname"]', premisesData.premisesName);

  // Address field uses AddressFields component - namePrefix is lowercase token with underscores
  // PREMISES_ADDRESS -> premises_address + Line1/Postcode = premises_addressLine1, premises_addressPostcode
  await page.fill('input[name="premises_addressLine1"]', premisesData.address);
  await page.fill('input[name="premises_addressCity"]', 'London');
  await page.fill('input[name="premises_addressPostcode"]', premisesData.postcode);

  // Fill required licensable activities and schedule
  await page.fill('textarea[name="licensableactivities"]', 'Sale of alcohol for consumption on premises\nProvision of regulated entertainment (live music)');
  await page.fill('textarea[name="activityschedule"]', 'Monday to Saturday: 11:00 - 23:00\nSunday: 12:00 - 22:30');

  // Fill inspection times (required)
  await page.fill('textarea[name="inspectiontimes"]', 'Monday to Friday: 09:00 - 17:00');

  // Fill basic dates (required fields)
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await page.fill('input[name="applicationdate"]', today);
  await page.fill('input[name="deadlinedate"]', futureDate);

  console.log('[TEST HELPER] Template fields filled');

  // Wait a bit for validation to process
  await page.waitForTimeout(1000);

  // Wait for Continue button to become enabled
  const continueButton = page.locator('[data-testid="upload-step-continue"]');
  await expect(continueButton).toBeEnabled({ timeout: 10000 });

  // Continue
  await continueButton.click();
  await expect(page).toHaveURL(/\/publish\/step-3/, { timeout: 10000 });
}

/**
 * Complete Step 2: Upload document (OCR mode)
 *
 * DEPRECATED: The new wizard flow prefers structured templates.
 * Use fillStructuredTemplate() instead for better test reliability.
 */
export async function uploadNoticeDocument(
  page: Page,
  filePath: string,
  contactEmail = 'licensing@test.gov.uk'
): Promise<void> {
  await expect(page).toHaveURL(/\/publish\/step-2/);

  // Wait for step to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Click "Upload & OCR" tab
  const uploadOcrTab = page.locator('button:has-text("Upload & OCR")');
  const isUploadActive = await uploadOcrTab.evaluate((el) =>
    el.classList.contains('bg-blue-600')
  ).catch(() => false);

  if (!isUploadActive) {
    console.log('[TEST HELPER] Switching to Upload & OCR mode...');
    await uploadOcrTab.click();
    await page.waitForTimeout(500);
  }

  console.log('[TEST HELPER] Upload & OCR mode is active, uploading file...');

  // Find and use file input
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);

  // Wait for OCR processing to complete
  const ocrSuccess = page.locator('text=/text extraction complete|extraction complete|ocr complete/i').first();
  await expect(ocrSuccess).toBeVisible({ timeout: 30000 });
  console.log('[TEST HELPER] OCR processing completed');

  // Fill contact email (required field on Step 2)
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 2000 })) {
    await emailInput.clear();
    await emailInput.fill(contactEmail);
    console.log('[TEST HELPER] Filled confirmation email');
  }

  // Wait for Continue button to become enabled
  const continueButton = page.locator('[data-testid="upload-step-continue"]');
  await expect(continueButton).toBeEnabled({ timeout: 10000 });

  // Continue
  await continueButton.click();
  await expect(page).toHaveURL(/\/publish\/step-3/, { timeout: 10000 });
}

/**
 * Complete Step 3: Confirm details
 */
export async function confirmNoticeDetails(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/publish\/step-3/);

  // Wait for preview
  await expect(page.locator('text=/confirm|review|preview/i').first())
    .toBeVisible({ timeout: 10000 });

  // Continue
  await page.click('[data-testid="confirm-step-continue"]');
  await expect(page).toHaveURL(/\/publish\/step-4/, { timeout: 10000 });
}

/**
 * Complete Step 4: Payment/Publish
 */
export async function completePaymentAndPublish(page: Page): Promise<string> {
  await expect(page).toHaveURL(/\/publish\/step-4/);

  // Wait for payment step
  await expect(page.locator('text=/payment|review and pay|publish/i').first())
    .toBeVisible({ timeout: 10000 });

  // Try to skip payment (test mode)
  const skipPaymentButton = page.locator(
    'button:has-text("Skip payment"), button:has-text("Test mode")'
  );

  if (await skipPaymentButton.isVisible({ timeout: 2000 })) {
    await skipPaymentButton.click();
  } else {
    // Submit normally
    const submitButton = page.locator(
      'button:has-text("Publish"), button:has-text("Complete"), button:has-text("Submit")'
    );
    await submitButton.click();
  }

  // Wait for success
  await expect(
    page.locator('text=/published successfully|notice created|success/i').first()
  ).toBeVisible({ timeout: 20000 });

  // Extract notice ID
  return await extractNoticeId(page);
}

/**
 * Extract notice ID from page (multiple strategies)
 */
export async function extractNoticeId(page: Page): Promise<string> {
  // Strategy 1: From "View notice" link
  const viewNoticeLink = page.locator('a:has-text("View notice"), a[href*="/notices/"]');
  if (await viewNoticeLink.isVisible({ timeout: 5000 })) {
    const href = await viewNoticeLink.getAttribute('href');
    const match = href?.match(/\/notices\/([a-zA-Z0-9-]+)/);
    if (match) return match[1];
  }

  // Strategy 2: From current URL
  const currentUrl = page.url();
  const urlMatch = currentUrl.match(/\/notices\/([a-zA-Z0-9-]+)/);
  if (urlMatch) return urlMatch[1];

  // Strategy 3: Query API for latest notice
  const response = await page.request.get(`${API_BASE}/api/notices?limit=1&sort=created_at:desc`);
  const data = await response.json();
  if (data.notices && data.notices.length > 0) {
    return data.notices[0].id;
  }

  throw new Error('Unable to extract notice ID from page');
}

/**
 * Complete full publish wizard flow using structured template
 */
export async function publishNotice(
  page: Page,
  filePath: string,
  contactEmail = 'licensing@test.gov.uk'
): Promise<string> {
  await selectNoticeType(page);
  // Use structured template instead of file upload for better reliability
  await fillStructuredTemplate(page, contactEmail);
  await confirmNoticeDetails(page);
  return await completePaymentAndPublish(page);
}

/**
 * Complete full publish wizard flow using OCR upload
 */
export async function publishNoticeWithOCR(
  page: Page,
  filePath: string,
  contactEmail = 'licensing@test.gov.uk'
): Promise<string> {
  await selectNoticeType(page);
  await uploadNoticeDocument(page, filePath, contactEmail);
  await confirmNoticeDetails(page);
  return await completePaymentAndPublish(page);
}

// ============================================================
// REPRESENTATION HELPERS
// ============================================================

/**
 * Submit a representation as a public user
 */
export async function submitRepresentation(
  page: Page,
  noticeId: string,
  representationData: {
    name: string;
    email: string;
    address: string;
    type: 'objection' | 'support' | 'comment';
    comments: string;
  }
): Promise<void> {
  // Navigate to notice
  await page.goto(`${BASE_URL}/notices/${noticeId}`);

  // Click submit representation
  const submitRepButton = page.locator(
    'button:has-text("Submit representation"), ' +
    'button:has-text("Make objection"), ' +
    'a:has-text("Submit representation")'
  ).first();

  await expect(submitRepButton).toBeVisible({ timeout: 10000 });
  await submitRepButton.click();

  // Wait for form
  await expect(page).toHaveURL(/\/submit-representation|\/representations\/new/, { timeout: 10000 });

  // Fill form
  await page.fill('input[name="fullName"], input[id="fullName"]', representationData.name);
  await page.fill('input[name="email"], input[type="email"]', representationData.email);
  await page.fill('textarea[name="address"], textarea[id="address"]', representationData.address);

  // Select type
  const typeButton = page.locator(
    `button:has-text("${representationData.type}"), input[value="${representationData.type}"]`
  ).first();
  if (await typeButton.isVisible({ timeout: 2000 })) {
    await typeButton.click();
  }

  // Fill comments
  const commentsField = page.locator(
    'textarea[name="comments"], textarea[name="content"], textarea[placeholder*="concern" i]'
  ).first();
  await commentsField.fill(representationData.comments);

  // Submit
  const submitButton = page.locator(
    'button[type="submit"]:has-text("Submit"), ' +
    'button:has-text("Send representation"), ' +
    'button:has-text("Open Email")'
  ).first();
  await submitButton.click();

  // Wait for success
  await expect(
    page.locator('text=/submitted successfully|email client|thank you/i').first()
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Verify representation appears in council portal
 */
export async function verifyRepresentationInCouncilPortal(
  page: Page,
  noticeId: string,
  expectedName: string,
  expectedEmail: string
): Promise<void> {
  // Navigate to council notice detail
  await page.goto(`${BASE_URL}/c/westminster/licensing/notices/${noticeId}`);

  // Look for representations tab
  const representationsTab = page.locator(
    'a:has-text("Representations"), button:has-text("Representations"), text=/representations \\(/i'
  ).first();

  if (await representationsTab.isVisible({ timeout: 5000 })) {
    await representationsTab.click();
    await page.waitForTimeout(1000);
  }

  // Verify representation appears
  await expect(page.locator(`text=/${expectedName}/i`)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`text=/${expectedEmail}/i`)).toBeVisible({ timeout: 5000 });
}

// ============================================================
// API HELPERS
// ============================================================

/**
 * Get notice by ID via API
 */
export async function getNoticeById(page: Page, noticeId: string): Promise<any> {
  const response = await page.request.get(`${API_BASE}/api/notices/${noticeId}`);
  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Get representations for a notice via API
 */
export async function getRepresentations(page: Page, noticeId: string): Promise<any[]> {
  const response = await page.request.get(`${API_BASE}/api/notices/${noticeId}/representations`);

  // May require auth (401) or succeed (200)
  if (response.status() === 401 || response.status() === 403) {
    throw new Error('Representations endpoint requires authentication');
  }

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

// ============================================================
// NAVIGATION HELPERS
// ============================================================

/**
 * Navigate to council notices list
 */
export async function navigateToCouncilNotices(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/c/westminster/licensing/notices`);
  await expect(page).toHaveURL(/\/c\/westminster\/licensing\/notices/, { timeout: 10000 });
}

/**
 * Search for a notice in council portal
 */
export async function searchCouncilNotices(page: Page, searchTerm: string): Promise<void> {
  const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
  if (await searchInput.isVisible({ timeout: 5000 })) {
    await searchInput.fill(searchTerm);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
}

// ============================================================
// ASSERTION HELPERS
// ============================================================

/**
 * Assert notice appears in search results
 */
export async function assertNoticeInResults(
  page: Page,
  applicantName: string,
  premisesName: string
): Promise<void> {
  await expect(page.locator(`text=/${applicantName}/i`).first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator(`text=/${premisesName}/i`).first()).toBeVisible({ timeout: 5000 });
}

/**
 * Assert API health
 */
export async function assertApiHealthy(page: Page): Promise<void> {
  const response = await page.request.get(`${API_BASE}/api/health`);
  expect(response.ok()).toBeTruthy();
}
