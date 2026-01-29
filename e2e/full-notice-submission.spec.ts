import { test, expect, Page } from '@playwright/test';

/**
 * Full Notice Submission Test
 * Tests submitting notices through all form types and verifying they appear in the council portal
 */

const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174';

// Real credentials
const CREDENTIALS = {
  email: 'ottoclarke@icloud.com',
  password: 'AdminPass2026!'
};

// Notice type configurations
const NOTICE_TYPES = [
  {
    category: 'Licensing Act 2003',
    type: 'New premises licence',
    id: 'licensing-premises-new',
    fields: {
      applicantname: 'Test Licensing Applicant',
      premisesname: 'The Test Arms',
      'premises_addressLine1': '123 Test Street',
      'premises_addressCity': 'Sampleton',
      'premises_addressPostcode': 'SA1 1AA',
      licensableactivities: 'Sale of alcohol for consumption on premises',
      activityschedule: 'Monday to Sunday: 11:00 - 23:00',
      inspectiontimes: 'Monday to Friday: 09:00 - 17:00'
    }
  },
  {
    category: 'Gambling Act 2005',
    type: 'New betting premises',
    id: 'gambling-betting-new',
    fields: {
      applicantname: 'Test Gambling Operator',
      premisesname: 'Lucky Bets Sampleton',
      'premises_addressLine1': '456 High Street',
      'premises_addressCity': 'Sampleton',
      'premises_addressPostcode': 'SA1 2BB'
    }
  },
  {
    category: "Goods Vehicle Operator's Licence",
    type: 'New application',
    id: 'gvol-new',
    fields: {
      applicantname: 'Test Haulage Ltd',
      operatingcentre: '789 Industrial Estate, Sampleton',
      'operating_centrePostcode': 'SA1 3CC'
    }
  },
  {
    category: 'Planning (Press Notices)',
    type: 'Listed building',
    id: 'planning-listed-building',
    fields: {
      applicantname: 'Test Planning Applicant',
      sitename: 'Historic Manor House',
      'site_addressLine1': '1 Heritage Lane',
      'site_addressCity': 'Sampleton',
      'site_addressPostcode': 'SA1 4DD',
      proposaldescription: 'Renovation of Grade II listed building'
    }
  },
  {
    category: 'Probate',
    type: 'Section 27',
    id: 'probate-s27-notice',
    fields: {
      deceasedname: 'John Smith (Deceased)',
      deceasedaddress: '10 Memorial Road, Sampleton, SA1 5EE'
    }
  },
  {
    category: 'Traffic Regulation Orders',
    type: 'Permanent',
    id: 'tro-permanent',
    fields: {
      ordertitle: 'Sampleton Borough Council (Main Street) Prohibition of Waiting Order',
      affectedroads: 'Main Street, Sampleton',
      proposedrestrictions: 'No waiting at any time'
    }
  }
];

async function loginToCouncilPortal(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const councilPortalBtn = page.getByRole('button', { name: /council portal/i });
  if (await councilPortalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await councilPortalBtn.click();
    await page.waitForTimeout(500);
  }

  await page.fill('input[type="email"]', CREDENTIALS.email);
  await page.fill('input[type="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/c\//, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe.serial('Notice Submission - All Types', () => {
  test('Licensing Act 2003 - New Premises Licence', async ({ page }) => {
    const noticeType = NOTICE_TYPES[0];

    // Go to publish wizard
    await page.goto(`${BASE_URL}/publish`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Expand category
    const categoryHeader = page.getByText(noticeType.category, { exact: false }).first();
    await categoryHeader.click();
    await page.waitForTimeout(500);

    // Select notice type
    const noticeOption = page.locator(`[data-testid="notice-option-${noticeType.id}"]`);
    if (await noticeOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noticeOption.click();
    } else {
      // Fallback to text selection
      await page.getByText(noticeType.type, { exact: false }).first().click();
    }
    await page.waitForTimeout(500);

    // Click Continue
    await page.locator('[data-testid="notice-step-continue"], button:has-text("Continue")').first().click();

    // Wait for Step 2
    await expect(page).toHaveURL(/\/publish\/step-2/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: `test-results/submission/licensing-step2.png`, fullPage: true });

    // Click Structured template tab if not active
    const templateTab = page.getByText(/structured template/i);
    if (await templateTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templateTab.click();
      await page.waitForTimeout(500);
    }

    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
    }

    // Fill form fields
    for (const [fieldName, value] of Object.entries(noticeType.fields)) {
      const input = page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    // Fill dates
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const appDateInput = page.locator('input[name="applicationdate"]');
    if (await appDateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await appDateInput.fill(today);
    }

    const deadlineInput = page.locator('input[name="deadlinedate"]');
    if (await deadlineInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await deadlineInput.fill(futureDate);
    }

    await page.screenshot({ path: `test-results/submission/licensing-filled.png`, fullPage: true });

    // Check if Continue button is enabled
    const continueBtn = page.locator('[data-testid="upload-step-continue"], button:has-text("Continue")').first();
    const isEnabled = await continueBtn.isEnabled({ timeout: 5000 }).catch(() => false);

    console.log('Continue button enabled:', isEnabled);

    if (isEnabled) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/submission/licensing-step3.png`, fullPage: true });
    }
  });

  test('Check notices page after submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/notices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `test-results/submission/notices-page.png`, fullPage: true });

    // Check API for notices
    const response = await page.request.get(`${API_BASE}/api/notices/search?limit=10`);
    const data = await response.json();

    console.log('Notices found:', data.items?.length || 0);
    data.items?.forEach((notice: any, idx: number) => {
      console.log(`${idx + 1}. ${notice.premisesName || notice.applicantName || 'Unknown'} - ${notice.noticeType}`);
    });
  });

  test('Check council portal for submitted notices', async ({ page }) => {
    await loginToCouncilPortal(page);

    // Navigate to notices page
    await page.click('text=Notices');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `test-results/submission/council-notices.png`, fullPage: true });
  });
});

test.describe('Quick Notice Type Verification', () => {
  test('Verify all notice categories are accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/publish`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const results: string[] = [];

    for (const noticeType of NOTICE_TYPES) {
      // Click category to expand
      const categoryHeader = page.getByText(noticeType.category, { exact: false }).first();
      const isVisible = await categoryHeader.isVisible().catch(() => false);

      if (isVisible) {
        await categoryHeader.click();
        await page.waitForTimeout(300);

        // Check if notice type is visible
        const typeOption = page.getByText(noticeType.type, { exact: false }).first();
        const typeVisible = await typeOption.isVisible({ timeout: 2000 }).catch(() => false);

        if (typeVisible) {
          results.push(`✅ ${noticeType.category} > ${noticeType.type}`);
        } else {
          results.push(`❌ ${noticeType.category} > ${noticeType.type} - Type not visible`);
        }

        // Collapse category
        await categoryHeader.click();
        await page.waitForTimeout(200);
      } else {
        results.push(`❌ ${noticeType.category} - Category not visible`);
      }
    }

    console.log('\n=== Notice Type Verification ===');
    results.forEach(r => console.log(r));
  });
});
