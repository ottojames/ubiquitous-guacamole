import { test, expect } from '@playwright/test';

/**
 * PRD Verification Test Suite
 *
 * This file tests all features from prd.json, organized by priority.
 * Each test corresponds to a PRD requirement with clear pass/fail criteria.
 *
 * Run with: npx playwright test e2e/prd-verification.spec.ts
 */

test.describe('Critical User Feedback (Priority 0)', () => {

  test('fix_public_notice_detail_page: Public notice detail page loads successfully', async ({ page }) => {
    // Navigate to notices search
    await page.goto('/notices');

    // Search for postcode
    await page.fill('[data-testid="postcode-search"]', 'S32 5UY');
    await page.click('[data-testid="search-button"]');

    // Increase radius to 5km
    await page.click('[data-testid="radius-5km"]');

    // Wait for notices to load
    await page.waitForSelector('[data-testid="notice-card"]', { timeout: 10000 });

    // Click on first notice
    await page.click('[data-testid="notice-card"]');

    // Click "View Notice" button
    await page.click('button:has-text("View Notice")');

    // Verify notice details load (NOT "notice not found")
    await expect(page.locator('text=notice not found')).not.toBeVisible();
    await expect(page.locator('[data-testid="notice-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="notice-content"]')).toBeVisible();

    // Verify map is visible
    await expect(page.locator('.maplibregl-map')).toBeVisible();

    // Verify representation form is present
    await expect(page.locator('[data-testid="representation-form"]')).toBeVisible();
  });

  test('fix_council_notice_retrieval: Council portal notice detail opens successfully', async ({ page }) => {
    // Login to council portal (you'll need to implement auth helper)
    await page.goto('/login');
    await page.fill('[name="email"]', 'licensing@westminster.gov.uk');
    await page.click('button:has-text("Send Magic Link")');
    // Note: In real test, you'd need to handle magic link email

    // Navigate to notices
    await page.goto('/c/westminster-council/licensing/notices');

    // Click on first notice
    await page.click('[data-testid="notice-row"]');

    // Verify notice detail loads (NOT "notice could not be retrieved")
    await expect(page.locator('text=notice could not be retrieved')).not.toBeVisible();
    await expect(page.locator('[data-testid="notice-detail-modal"]')).toBeVisible();
  });

  test('fix_council_representations_loading: Council representations page loads', async ({ page }) => {
    // Login to council portal
    await page.goto('/c/westminster-council/licensing/representations');

    // Verify representations list loads (NOT "failed to load representations")
    await expect(page.locator('text=failed to load representations')).not.toBeVisible();
    await expect(page.locator('[data-testid="representations-table"]')).toBeVisible();

    // Verify can view representation details
    await page.click('[data-testid="representation-row"]');
    await expect(page.locator('[data-testid="representation-detail"]')).toBeVisible();
  });

  test('fix_council_analytics_loading: Council analytics page loads data', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/analytics');

    // Verify analytics loads (NOT "failed to load analytics data")
    await expect(page.locator('text=failed to load analytics data')).not.toBeVisible();

    // Verify analytics widgets are visible
    await expect(page.locator('[data-testid="analytics-view-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-representation-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });

  test('fix_firm_payment_button: Professional portal payment button works', async ({ page }) => {
    // Login to firm portal
    await page.goto('/f/wilson-partners/dashboard');

    // Click "Make Payment" button
    await page.click('button:has-text("Make Payment")');

    // Verify payment interface opens (does NOT stay on same page)
    await expect(page).toHaveURL(/\/billing|\/payment/);
    await expect(page.locator('[data-testid="payment-interface"]')).toBeVisible();
  });

  test('fix_firm_view_client_notices: View client notices works correctly', async ({ page }) => {
    await page.goto('/f/wilson-partners/clients');

    // Click "View Notices" on a client
    await page.click('[data-testid="client-view-notices"]');

    // Verify does NOT redirect to homepage
    await expect(page).not.toHaveURL('/');

    // Verify shows client's notices
    await expect(page).toHaveURL(/\/notices/);
    await expect(page.locator('[data-testid="client-notices-list"]')).toBeVisible();
  });

  test('implement_firm_notices_page: Firm notices page works', async ({ page }) => {
    await page.goto('/f/wilson-partners/notices');

    // Verify NOT "coming soon"
    await expect(page.locator('text=coming soon')).not.toBeVisible();

    // Verify shows notices list
    await expect(page.locator('[data-testid="firm-notices-list"]')).toBeVisible();

    // Verify filters work
    await expect(page.locator('[data-testid="notice-filter-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="notice-filter-client"]')).toBeVisible();
  });

  test('implement_firm_billing_page: Firm billing page works', async ({ page }) => {
    await page.goto('/f/wilson-partners/billing');

    // Verify NOT "coming soon"
    await expect(page.locator('text=coming soon')).not.toBeVisible();

    // Verify billing information displays
    await expect(page.locator('[data-testid="subscription-tier"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
  });

  test('fix_firm_team_page_loading: Firm team page loads without hanging', async ({ page }) => {
    await page.goto('/f/wilson-partners/team');

    // Verify page loads (no infinite spinner)
    await expect(page.locator('[data-testid="team-list"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();

    // Verify team members shown
    await expect(page.locator('[data-testid="team-member"]')).toHaveCount({ min: 1 });
  });

  test('fix_firm_settings_notice_filter: Settings notice type filter works', async ({ page }) => {
    await page.goto('/f/wilson-partners/settings');

    // Select only Licensing and Planning
    await page.click('[data-testid="notice-type-licensing"]');
    await page.click('[data-testid="notice-type-planning"]');
    await page.click('button:has-text("Save")');

    // Navigate to publish
    await page.goto('/f/wilson-partners/publish/step-1');

    // Verify ONLY licensing and planning types show
    await expect(page.locator('[data-testid="notice-type-licensing"]')).toBeVisible();
    await expect(page.locator('[data-testid="notice-type-planning"]')).toBeVisible();
    await expect(page.locator('[data-testid="notice-type-environmental"]')).not.toBeVisible();
  });

  test('fix_wizard_step4_upload: Publish wizard actually creates notice', async ({ page }) => {
    // Complete steps 1-3 (you'll need to implement helper functions)
    await page.goto('/publish/step-1');
    // ... complete wizard steps ...

    await page.goto('/publish/step-4');

    // Click submit
    await page.click('button:has-text("Submit")');

    // Verify loading state
    await expect(page.locator('[data-testid="submit-loading"]')).toBeVisible();

    // Verify redirects to confirmation (not stuck on step 4)
    await expect(page).toHaveURL(/\/confirmation|\/success/, { timeout: 30000 });

    // Verify notice was created (check database or API)
    const noticeId = page.url().match(/notice\/(\d+)/)?.[1];
    expect(noticeId).toBeTruthy();
  });

  test('improve_department_switching_ux: Department switching is intuitive', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/dashboard');

    // Verify current department shown clearly
    await expect(page.locator('[data-testid="current-department"]')).toContainText('Westminster Council - Licensing');

    // Click switch department
    await page.click('[data-testid="switch-department-button"]');

    // Verify modal shows department list
    await expect(page.locator('[data-testid="department-switcher-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="department-option"]')).toHaveCount({ min: 2 });

    // Switch to Planning
    await page.click('text=Planning');

    // Verify dashboard updates
    await expect(page).toHaveURL(/\/planning/);
    await expect(page.locator('[data-testid="current-department"]')).toContainText('Planning');
  });

  test('verify_templates_work_with_matching: Template system works end-to-end', async ({ page }) => {
    // Step 1: Council creates template
    await page.goto('/c/westminster-council/licensing/templates');
    await page.click('button:has-text("Create Template")');

    await page.fill('[name="notice_type"]', 'premises-licence-new');
    await page.fill('[name="template_text"]', `
      Application for New Premises Licence

      Applicant: {{applicant_name}}
      Premises: {{premises_address}}
      Licence Type: {{licence_type}}
      Deadline: {{deadline}}
    `);
    await page.click('button:has-text("Save Template")');

    // Step 2: Public user submits notice
    await page.goto('/publish');
    await page.click('text=New Premises Licence');

    // Complete form
    await page.fill('[name="applicant_name"]', 'John Smith');
    await page.fill('[name="premises_address"]', '123 High Street');
    await page.fill('[name="licence_type"]', 'Restaurant & Bar');

    await page.click('button:has-text("Submit")');

    // Step 3: Verify published notice uses template
    const noticeId = page.url().match(/notice\/(\d+)/)?.[1];
    await page.goto(`/notices/${noticeId}`);

    // Verify placeholders are replaced
    await expect(page.locator('[data-testid="notice-content"]')).toContainText('John Smith');
    await expect(page.locator('[data-testid="notice-content"]')).toContainText('123 High Street');

    // Verify no {{placeholder}} syntax visible
    await expect(page.locator('text={{applicant_name}}')).not.toBeVisible();
  });
});

test.describe('Priority 1 Items', () => {

  test('remove_billing_from_council_portal: No billing link in council portal', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/dashboard');

    // Verify no billing link in sidebar
    await expect(page.locator('a:has-text("Billing")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Subscription")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Payment")')).not.toBeVisible();
  });

  test('add_domain_address_to_council_settings: Council settings includes domain field', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/settings');

    // Verify domain field exists
    await expect(page.locator('[name="council_domain"]')).toBeVisible();

    // Fill in domain
    await page.fill('[name="council_domain"]', 'licensing@westminster.gov.uk');
    await page.click('button:has-text("Save")');

    // Create template using {{council_domain}}
    await page.goto('/c/westminster-council/licensing/templates');
    await page.fill('[name="template_text"]', 'Contact: {{council_domain}}');
    await page.click('button:has-text("Save")');

    // Verify template resolves placeholder
    // (Would need to check actual notice creation)
  });

  test('add_contact_address_to_council_settings: Council settings includes contact address', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/settings');

    // Verify contact address field exists
    await expect(page.locator('[name="council_address"]')).toBeVisible();

    // Verify it's multiline
    const addressField = page.locator('[name="council_address"]');
    await expect(addressField).toHaveAttribute('type', /textarea|text/);
  });

  test('remove_law_firm_portal_text: Firm portal shows only company name', async ({ page }) => {
    await page.goto('/f/wilson-partners/dashboard');

    // Verify no "law firm portal" text
    await expect(page.locator('text=law firm portal')).not.toBeVisible();

    // Verify company name is shown
    await expect(page.locator('text=Wilson & Partners')).toBeVisible();
  });

  test('remove_switch_organization_from_firm: No switch organization in firm portal', async ({ page }) => {
    await page.goto('/f/wilson-partners/settings');

    // Verify no "Switch Organization" button
    await expect(page.locator('button:has-text("Switch Organization")')).not.toBeVisible();
  });

  test('verify_pricing_page_accurate: Pricing page shows correct tiers', async ({ page }) => {
    await page.goto('/pricing');

    // Verify three tiers displayed
    await expect(page.locator('[data-testid="tier-starter"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-professional"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-enterprise"]')).toBeVisible();

    // Verify pricing
    await expect(page.locator('text=£99')).toBeVisible(); // Starter
    await expect(page.locator('text=£299')).toBeVisible(); // Professional
    await expect(page.locator('text=£999')).toBeVisible(); // Enterprise

    // Verify allowances
    await expect(page.locator('text=10 notices')).toBeVisible();
    await expect(page.locator('text=50 notices')).toBeVisible();
    await expect(page.locator('text=200 notices')).toBeVisible();

    // Verify trial period
    await expect(page.locator('text=14-day free trial')).toBeVisible();
  });
});

test.describe('Public Applicant Flow (Priority 3)', () => {

  test('notice_type_selection: Notice type selection UI works', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Verify hierarchical categories
    await expect(page.locator('[data-testid="category-licensing"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-planning"]')).toBeVisible();

    // Verify search works
    await page.fill('[data-testid="notice-type-search"]', 'premises');
    await expect(page.locator('text=Premises Licence')).toBeVisible();

    // Verify can select type
    await page.click('text=New Premises Licence');
    await expect(page.locator('[data-testid="selected-notice-type"]')).toContainText('New Premises Licence');
  });

  test('postcode_search: Postcode search works', async ({ page }) => {
    await page.goto('/notices');

    // Enter postcode
    await page.fill('[data-testid="postcode-search"]', 'SW1A 1AA');
    await page.click('[data-testid="search-button"]');

    // Verify results load
    await expect(page.locator('[data-testid="notice-card"]')).toHaveCount({ min: 0 });

    // Verify map updates
    await expect(page.locator('.maplibregl-map')).toBeVisible();
  });

  test('radius_filter: Radius filter has correct options', async ({ page }) => {
    await page.goto('/notices');

    // Verify all radius options exist
    await expect(page.locator('[data-testid="radius-0.5km"]')).toBeVisible();
    await expect(page.locator('[data-testid="radius-1km"]')).toBeVisible();
    await expect(page.locator('[data-testid="radius-2km"]')).toBeVisible();
    await expect(page.locator('[data-testid="radius-5km"]')).toBeVisible();
  });
});

test.describe('Council Portal (Priority 4)', () => {

  test('department_filtered_dashboard: Dashboard is department-filtered', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/dashboard');

    // Verify stats are department-specific
    const statsText = await page.locator('[data-testid="dashboard-stats"]').textContent();

    // Switch department
    await page.goto('/c/westminster-council/planning/dashboard');

    // Verify stats changed (different department data)
    const newStatsText = await page.locator('[data-testid="dashboard-stats"]').textContent();
    expect(statsText).not.toEqual(newStatsText);
  });

  test('template_creation_ui: Template CRUD works', async ({ page }) => {
    await page.goto('/c/westminster-council/licensing/templates');

    // Create template
    await page.click('button:has-text("Create Template")');
    await page.fill('[name="template_text"]', 'Test template');
    await page.click('button:has-text("Save")');

    // Verify template in list
    await expect(page.locator('text=Test template')).toBeVisible();

    // Edit template
    await page.click('[data-testid="template-edit"]');
    await page.fill('[name="template_text"]', 'Updated template');
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('text=Updated template')).toBeVisible();

    // Delete template
    await page.click('[data-testid="template-delete"]');
    await page.click('button:has-text("Confirm")');

    // Verify deleted
    await expect(page.locator('text=Updated template')).not.toBeVisible();
  });
});

test.describe('Firm Portal (Priority 5)', () => {

  test('firm_dashboard: Dashboard shows subscription and usage', async ({ page }) => {
    await page.goto('/f/wilson-partners/dashboard');

    // Verify subscription tier displayed
    await expect(page.locator('[data-testid="subscription-tier"]')).toBeVisible();

    // Verify usage tracking
    await expect(page.locator('[data-testid="notices-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="notices-remaining"]')).toBeVisible();

    // Verify progress bar
    await expect(page.locator('[data-testid="usage-progress-bar"]')).toBeVisible();
  });

  test('skip_payment_for_firms: Firms skip payment when within allowance', async ({ page }) => {
    await page.goto('/f/wilson-partners/publish/step-4');

    // If within allowance, should NOT show Stripe payment
    const hasAllowance = await page.locator('[data-testid="allowance-available"]').isVisible();

    if (hasAllowance) {
      await expect(page.locator('[data-testid="stripe-payment"]')).not.toBeVisible();
      await expect(page.locator('button:has-text("Submit")')).toBeVisible();
    }
  });
});
