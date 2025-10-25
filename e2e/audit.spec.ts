/**
 * COMPREHENSIVE CIVICNOTICES PLATFORM AUDIT
 *
 * This test suite performs a complete functional, UX, and architectural audit
 * covering all public and council routes, interactions, and edge cases.
 */

import { test, expect, type Page } from '@playwright/test';

// Base URLs
const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5174/api';

// Test data
const TEST_POSTCODE = 'SW1A 1AA';
const TEST_ORG_SLUG = 'sample-borough-council';
const TEST_DEPT_SLUG = 'licensing';

interface AuditIssue {
  page: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  proposedFix: string;
}

const auditIssues: AuditIssue[] = [];

function recordIssue(issue: AuditIssue) {
  auditIssues.push(issue);
  console.log(`[${issue.severity.toUpperCase()}] ${issue.page}: ${issue.issue}`);
}

async function checkConsoleErrors(page: Page, pageName: string) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    recordIssue({
      page: pageName,
      issue: `JavaScript error: ${error.message}`,
      severity: 'high',
      rootCause: 'Unhandled runtime error',
      proposedFix: 'Add error boundary and proper error handling'
    });
  });
}

async function checkNetworkErrors(page: Page, pageName: string) {
  page.on('response', response => {
    if (response.status() >= 400) {
      recordIssue({
        page: pageName,
        issue: `Failed API call: ${response.url()} (${response.status()})`,
        severity: response.status() >= 500 ? 'critical' : 'high',
        rootCause: `API endpoint error: ${response.statusText()}`,
        proposedFix: 'Add error handling, retry logic, and user-friendly error messages'
      });
    }
  });
}

test.describe('Phase 1: Headless Playwright Crawl', () => {

  test.beforeEach(async ({ page }) => {
    // Setup error listeners for every test
    checkConsoleErrors(page, 'unknown');
    checkNetworkErrors(page, 'unknown');
  });

  test.describe('Public Routes', () => {

    test('/ - Homepage & Navigation', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check page loads
      await expect(page).toHaveTitle(/CivicNotices|Public Notice/i);

      // Check hero section exists
      const hero = page.locator('h1, [role="heading"]').first();
      await expect(hero).toBeVisible({ timeout: 5000 });

      // Check primary CTAs
      const publishButton = page.getByRole('link', { name: /publish|upload/i });
      const findButton = page.getByRole('link', { name: /find|search/i });

      if (await publishButton.count() === 0) {
        recordIssue({
          page: '/',
          issue: 'No "Publish" CTA found on homepage',
          severity: 'high',
          rootCause: 'Missing primary user journey entry point',
          proposedFix: 'Add prominent "Publish a Notice" button linking to /publish'
        });
      }

      if (await findButton.count() === 0) {
        recordIssue({
          page: '/',
          issue: 'No "Find Notices" CTA found on homepage',
          severity: 'high',
          rootCause: 'Missing public transparency entry point',
          proposedFix: 'Add prominent "Find Notices" button linking to /find-notices'
        });
      }

      // Check navigation
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() === 0) {
        recordIssue({
          page: '/',
          issue: 'No navigation element found',
          severity: 'medium',
          rootCause: 'Missing semantic navigation structure',
          proposedFix: 'Add <nav> element with links to key pages'
        });
      }

      // Check footer
      const footer = page.locator('footer, [role="contentinfo"]');
      if (await footer.count() === 0) {
        recordIssue({
          page: '/',
          issue: 'No footer found',
          severity: 'low',
          rootCause: 'Missing footer with legal/privacy links',
          proposedFix: 'Add footer with privacy policy, terms, accessibility statement'
        });
      }
    });

    test('/publish - Applicant Upload Flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/publish`);

      // Check page loads
      await page.waitForLoadState('networkidle');

      // Look for upload area or form
      const uploadZone = page.locator('[data-testid="upload-zone"], input[type="file"], .dropzone');
      const formFields = page.locator('input, textarea, select');

      if (await uploadZone.count() === 0 && await formFields.count() === 0) {
        recordIssue({
          page: '/publish',
          issue: 'No upload zone or form fields visible',
          severity: 'critical',
          rootCause: 'Core applicant submission flow not rendering',
          proposedFix: 'Debug React rendering, check for routing issues or missing components'
        });
      }

      // Check for progress indicator if multi-step
      const stepper = page.locator('[role="progressbar"], .stepper, .wizard');
      if (await stepper.count() === 0) {
        recordIssue({
          page: '/publish',
          issue: 'No progress indicator for multi-step flow',
          severity: 'medium',
          rootCause: 'Users cannot see where they are in the process',
          proposedFix: 'Add wizard stepper component showing current step and total steps'
        });
      }

      // Check for help text
      const helpText = page.locator('text=/What is a notice|Upload a PDF|Required fields/i');
      if (await helpText.count() === 0) {
        recordIssue({
          page: '/publish',
          issue: 'No guidance or help text for applicants',
          severity: 'medium',
          rootCause: 'Users may not understand what to do',
          proposedFix: 'Add inline help text explaining requirements and process'
        });
      }
    });

    test('/find-notices - Public Search Map', async ({ page }) => {
      await page.goto(`${BASE_URL}/find-notices`);
      await page.waitForLoadState('networkidle');

      // Check map loads
      const map = page.locator('.maplibregl-map, .mapboxgl-map, canvas');
      await expect(map.first()).toBeVisible({ timeout: 10000 });

      // Check search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="postcode" i]');
      if (await searchInput.count() === 0) {
        recordIssue({
          page: '/find-notices',
          issue: 'No search input found',
          severity: 'high',
          rootCause: 'Users cannot search by location',
          proposedFix: 'Add search input with postcode/address autocomplete'
        });
      } else {
        // Test search functionality
        await searchInput.first().fill(TEST_POSTCODE);
        await page.waitForTimeout(1000); // Wait for autocomplete

        const suggestions = page.locator('[role="option"], .autocomplete-item, .suggestion');
        if (await suggestions.count() === 0) {
          recordIssue({
            page: '/find-notices',
            issue: 'Address search not showing suggestions',
            severity: 'critical',
            rootCause: 'Autocomplete API not working or not wired up',
            proposedFix: 'Check address API endpoint and ensure dropdown renders'
          });
        }
      }

      // Check filters
      const filters = page.locator('[role="checkbox"], [role="radio"], select, .filter');
      if (await filters.count() === 0) {
        recordIssue({
          page: '/find-notices',
          issue: 'No filter controls visible',
          severity: 'medium',
          rootCause: 'Users cannot filter notices by type, date, etc.',
          proposedFix: 'Add filter chips for notice types and date range picker'
        });
      }

      // Check map/list toggle
      const viewToggle = page.locator('button:has-text("Map"), button:has-text("List")');
      if (await viewToggle.count() < 2) {
        recordIssue({
          page: '/find-notices',
          issue: 'No map/list view toggle',
          severity: 'medium',
          rootCause: 'Users cannot switch between map and list views',
          proposedFix: 'Add toggle buttons to switch between map and list display'
        });
      }

      // Test cluster interaction
      const clusters = page.locator('.maplibregl-marker, .marker');
      if (await clusters.count() > 0) {
        try {
          await clusters.first().click({ timeout: 3000 });
          await page.waitForTimeout(1000);
          // Check if map zoomed or cluster expanded
          // This is hard to test without checking map state directly
        } catch (e) {
          recordIssue({
            page: '/find-notices',
            issue: 'Cluster click not working or map not responding',
            severity: 'medium',
            rootCause: 'Cluster click handler missing or map interaction broken',
            proposedFix: 'Implement cluster click to auto-zoom and expand'
          });
        }
      }
    });
  });

  test.describe('Council Routes', () => {

    test('/c/:orgSlug/:deptSlug/dashboard - Council Dashboard', async ({ page }) => {
      const dashboardUrl = `${BASE_URL}/c/${TEST_ORG_SLUG}/${TEST_DEPT_SLUG}/dashboard`;

      // Try to access dashboard (may require auth)
      const response = await page.goto(dashboardUrl);

      if (response?.status() === 404) {
        recordIssue({
          page: 'Council Dashboard',
          issue: `Dashboard route returns 404: ${dashboardUrl}`,
          severity: 'critical',
          rootCause: 'Route not implemented or dynamic routing broken',
          proposedFix: 'Implement dashboard route with department-specific views'
        });
        return;
      }

      // Check for auth redirect
      if (page.url().includes('/login') || page.url().includes('/sign-in')) {
        console.log('✓ Dashboard properly requires authentication');

        // Check if demo login exists
        const demoLogin = page.locator('text=/demo|sample|test account/i');
        if (await demoLogin.count() === 0) {
          recordIssue({
            page: 'Council Dashboard',
            issue: 'No demo login option visible',
            severity: 'medium',
            rootCause: 'Cannot test dashboard features without auth bypass',
            proposedFix: 'Add demo credentials banner or test account login'
          });
        }
        return;
      }

      await page.waitForLoadState('networkidle');

      // Check dashboard cards
      const cards = page.locator('[class*="card"], section, article');
      if (await cards.count() === 0) {
        recordIssue({
          page: 'Council Dashboard',
          issue: 'No dashboard cards or sections visible',
          severity: 'high',
          rootCause: 'Dashboard layout not rendering',
          proposedFix: 'Implement dashboard cards for Recent Notices, Analytics, Drafts'
        });
      }

      // Check for analytics/stats
      const stats = page.locator('[class*="stat"], .metric, .count');
      if (await stats.count() === 0) {
        recordIssue({
          page: 'Council Dashboard',
          issue: 'No analytics or statistics visible',
          severity: 'medium',
          rootCause: 'Missing operational indicators',
          proposedFix: 'Add KPI cards showing active notices, closing soon, expired, etc.'
        });
      }

      // Check for recent notices list
      const noticesList = page.locator('[role="list"], table, .notice-item');
      if (await noticesList.count() === 0) {
        recordIssue({
          page: 'Council Dashboard',
          issue: 'No recent notices list',
          severity: 'high',
          rootCause: 'Officers cannot see latest activity',
          proposedFix: 'Add "Recent Notices" section with latest published/updated notices'
        });
      }
    });

    test('/c/:orgSlug/:deptSlug/notices - Notices Index', async ({ page }) => {
      const noticesUrl = `${BASE_URL}/c/${TEST_ORG_SLUG}/${TEST_DEPT_SLUG}/notices`;

      const response = await page.goto(noticesUrl);

      if (response?.status() === 404) {
        recordIssue({
          page: 'Council Notices Index',
          issue: `Notices index returns 404: ${noticesUrl}`,
          severity: 'critical',
          rootCause: 'Route not implemented',
          proposedFix: 'Implement notices index page with filtering and search'
        });
        return;
      }

      if (page.url().includes('/login') || page.url().includes('/sign-in')) {
        console.log('✓ Notices index properly requires authentication');
        return;
      }

      await page.waitForLoadState('networkidle');

      // Check for filters
      const statusFilter = page.locator('select, [role="combobox"], button:has-text("Status")');
      const typeFilter = page.locator('select, [role="combobox"], button:has-text("Type")');
      const dateFilter = page.locator('input[type="date"], button:has-text("Date")');

      if (await statusFilter.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No status filter (Published, Draft, Expired)',
          severity: 'high',
          rootCause: 'Officers cannot filter by notice status',
          proposedFix: 'Add status dropdown with Published, Draft, Expired options'
        });
      }

      if (await typeFilter.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No notice type filter',
          severity: 'medium',
          rootCause: 'Officers cannot filter by notice type',
          proposedFix: 'Add notice type multi-select filter'
        });
      }

      if (await dateFilter.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No date range filter',
          severity: 'medium',
          rootCause: 'Officers cannot filter by date range',
          proposedFix: 'Add date range picker for deadline/published date'
        });
      }

      // Check for search
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No search input',
          severity: 'medium',
          rootCause: 'Officers cannot search notices by address/applicant',
          proposedFix: 'Add search input with full-text search'
        });
      }

      // Check for table or list
      const table = page.locator('table, [role="table"]');
      const list = page.locator('[role="list"], .notice-list');

      if (await table.count() === 0 && await list.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No table or list of notices',
          severity: 'critical',
          rootCause: 'Main content not rendering',
          proposedFix: 'Implement notices table/list with sortable columns'
        });
      }

      // Check for pagination
      const pagination = page.locator('[role="navigation"][aria-label*="pagination" i], .pagination');
      if (await pagination.count() === 0) {
        recordIssue({
          page: 'Council Notices Index',
          issue: 'No pagination controls',
          severity: 'low',
          rootCause: 'May not handle large datasets well',
          proposedFix: 'Add pagination or infinite scroll for large result sets'
        });
      }
    });

    test('/settings - Settings Page', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/settings`);

      if (response?.status() === 404) {
        recordIssue({
          page: 'Settings',
          issue: 'Settings page returns 404',
          severity: 'high',
          rootCause: 'Route not implemented',
          proposedFix: 'Implement settings page for council configuration'
        });
      }
    });

    test('/team - Team Management', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/team`);

      if (response?.status() === 404) {
        recordIssue({
          page: 'Team Management',
          issue: 'Team page returns 404',
          severity: 'high',
          rootCause: 'Route not implemented',
          proposedFix: 'Implement team management page for adding/removing officers'
        });
      }
    });
  });

  test.describe('API Health Checks', () => {

    test('GET /api/health', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('ok', true);
    });

    test('GET /api/addresses - Address autocomplete', async ({ request }) => {
      const response = await request.get(`${API_BASE}/addresses?q=${TEST_POSTCODE}`);

      if (response.status() !== 200) {
        recordIssue({
          page: 'API: Address Lookup',
          issue: `Address API returns ${response.status()}`,
          severity: 'critical',
          rootCause: 'Address autocomplete not working',
          proposedFix: 'Fix address API endpoint and ensure provider is configured'
        });
      }
    });

    test('GET /api/notices - Notices search', async ({ request }) => {
      const response = await request.get(`${API_BASE}/notices?limit=10`);

      if (response.status() !== 200) {
        recordIssue({
          page: 'API: Notices Search',
          issue: `Notices API returns ${response.status()}`,
          severity: 'critical',
          rootCause: 'Cannot fetch notices from database',
          proposedFix: 'Check database connection and RLS policies'
        });
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        recordIssue({
          page: 'API: Notices Search',
          issue: 'Notices API does not return array',
          severity: 'high',
          rootCause: 'Invalid API response format',
          proposedFix: 'Ensure API returns array of notice objects'
        });
      }
    });
  });

  test.describe('Accessibility Checks', () => {

    test('Homepage - Basic WCAG checks', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for skip link
      const skipLink = page.locator('a[href="#main"], a:has-text("Skip to content")');
      if (await skipLink.count() === 0) {
        recordIssue({
          page: 'Accessibility',
          issue: 'No skip to main content link',
          severity: 'medium',
          rootCause: 'WCAG 2.4.1 Bypass Blocks failure',
          proposedFix: 'Add skip link as first focusable element'
        });
      }

      // Check for language attribute
      const html = await page.locator('html').getAttribute('lang');
      if (!html) {
        recordIssue({
          page: 'Accessibility',
          issue: 'No lang attribute on <html>',
          severity: 'high',
          rootCause: 'WCAG 3.1.1 Language of Page failure',
          proposedFix: 'Add lang="en" to <html> tag'
        });
      }

      // Check for proper heading hierarchy
      const h1Count = await page.locator('h1').count();
      if (h1Count === 0) {
        recordIssue({
          page: 'Accessibility',
          issue: 'No <h1> heading found',
          severity: 'medium',
          rootCause: 'Poor document structure for screen readers',
          proposedFix: 'Add single <h1> heading as page title'
        });
      } else if (h1Count > 1) {
        recordIssue({
          page: 'Accessibility',
          issue: 'Multiple <h1> headings found',
          severity: 'low',
          rootCause: 'May confuse screen reader users',
          proposedFix: 'Use only one <h1> per page'
        });
      }
    });

    test('Map - Keyboard accessibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/find-notices`);
      await page.waitForLoadState('networkidle');

      // Check if map markers are keyboard accessible
      const markers = page.locator('.maplibregl-marker button, .marker button');
      if (await markers.count() > 0) {
        const firstMarker = markers.first();
        if (!(await firstMarker.getAttribute('tabindex'))) {
          recordIssue({
            page: 'Accessibility: Map',
            issue: 'Map markers not keyboard accessible',
            severity: 'high',
            rootCause: 'WCAG 2.1.1 Keyboard failure',
            proposedFix: 'Ensure markers are focusable and activatable with keyboard'
          });
        }
      }
    });
  });

  test.afterAll(async () => {
    // Output audit results
    console.log('\n\n=== AUDIT RESULTS ===\n');
    console.log(`Total Issues Found: ${auditIssues.length}\n`);

    const bySeverity = {
      critical: auditIssues.filter(i => i.severity === 'critical'),
      high: auditIssues.filter(i => i.severity === 'high'),
      medium: auditIssues.filter(i => i.severity === 'medium'),
      low: auditIssues.filter(i => i.severity === 'low'),
    };

    console.log(`Critical: ${bySeverity.critical.length}`);
    console.log(`High: ${bySeverity.high.length}`);
    console.log(`Medium: ${bySeverity.medium.length}`);
    console.log(`Low: ${bySeverity.low.length}`);

    // Write to JSON file for further processing
    const fs = require('fs');
    fs.writeFileSync(
      'audit-results.json',
      JSON.stringify({ issues: auditIssues, summary: bySeverity }, null, 2)
    );

    console.log('\n✓ Full results written to audit-results.json\n');
  });
});
