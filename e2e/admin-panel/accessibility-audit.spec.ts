/**
 * Admin Panel Accessibility Audit
 *
 * Uses axe-core to audit all admin pages for WCAG 2.1 AA violations.
 * This test documents failures for Task 17.2a of the PRD.
 *
 * Run with: npx playwright test e2e/admin-panel/accessibility-audit.spec.ts --project=admin
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:5173';

// Admin pages to audit
const ADMIN_PAGES = [
  { name: 'Dashboard', path: '/admin/dashboard' },
  { name: 'Accounts', path: '/admin/accounts' },
  { name: 'Notices', path: '/admin/notices' },
  { name: 'Audit Log', path: '/admin/audit' },
  { name: 'Settings', path: '/admin/settings' },
  { name: 'Login', path: '/admin/login' },
];

// Store violations for final summary
interface ViolationSummary {
  page: string;
  violations: {
    id: string;
    impact: string;
    description: string;
    nodes: number;
    helpUrl: string;
  }[];
}

test.describe('Admin Panel Accessibility Audit (axe-core)', () => {
  const allViolations: ViolationSummary[] = [];

  test.afterAll(async () => {
    // Print summary of all violations
    console.log('\n\n========== ACCESSIBILITY AUDIT SUMMARY ==========\n');

    let totalViolations = 0;
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    for (const pageSummary of allViolations) {
      if (pageSummary.violations.length === 0) {
        console.log(`[PASS] ${pageSummary.page}: No violations`);
        continue;
      }

      console.log(`\n[FAIL] ${pageSummary.page}: ${pageSummary.violations.length} violation types`);
      console.log('-'.repeat(60));

      for (const v of pageSummary.violations) {
        console.log(`  [${v.impact.toUpperCase()}] ${v.id} (${v.nodes} instance(s))`);
        console.log(`    ${v.description}`);
        console.log(`    Help: ${v.helpUrl}`);
        totalViolations += v.nodes;

        if (v.impact === 'critical') criticalCount++;
        else if (v.impact === 'serious') seriousCount++;
        else if (v.impact === 'moderate') moderateCount++;
        else if (v.impact === 'minor') minorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('TOTAL SUMMARY:');
    console.log(`  Pages audited: ${allViolations.length}`);
    console.log(`  Total violation instances: ${totalViolations}`);
    console.log(`  By impact: Critical=${criticalCount}, Serious=${seriousCount}, Moderate=${moderateCount}, Minor=${minorCount}`);
    console.log('='.repeat(60) + '\n');
  });

  for (const page of ADMIN_PAGES) {
    test(`Audit ${page.name} page`, async ({ page: playwrightPage }) => {
      // Navigate to page
      await playwrightPage.goto(`${BASE_URL}${page.path}`);

      // Wait for page to be ready
      await playwrightPage.waitForLoadState('networkidle');
      await playwrightPage.waitForTimeout(1000); // Extra time for React hydration

      // Run axe-core audit
      const accessibilityScanResults = await new AxeBuilder({ page: playwrightPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Store violations for summary
      const pageSummary: ViolationSummary = {
        page: page.name,
        violations: accessibilityScanResults.violations.map(v => ({
          id: v.id,
          impact: v.impact || 'unknown',
          description: v.description,
          nodes: v.nodes.length,
          helpUrl: v.helpUrl,
        })),
      };
      allViolations.push(pageSummary);

      // Log violations for this page
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n[${page.name}] Found ${accessibilityScanResults.violations.length} accessibility violations:`);

        for (const violation of accessibilityScanResults.violations) {
          console.log(`\n  ${violation.id} [${violation.impact}]`);
          console.log(`    ${violation.description}`);
          console.log(`    Affected elements: ${violation.nodes.length}`);

          // Log first 3 affected elements for context
          for (let i = 0; i < Math.min(3, violation.nodes.length); i++) {
            const node = violation.nodes[i];
            console.log(`      - ${node.target.join(' > ')}`);
            console.log(`        Fix: ${node.failureSummary?.split('\n')[0] || 'See help URL'}`);
          }

          if (violation.nodes.length > 3) {
            console.log(`      ... and ${violation.nodes.length - 3} more`);
          }
        }
      }

      // For documentation purposes, we log but don't fail the test
      // This allows us to document all issues across all pages
      // The actual fixes will be done in subsequent tasks (17.2b - 17.2e)
      console.log(`\n[${page.name}] Audit complete - ${accessibilityScanResults.violations.length} violation types found`);
    });
  }
});

// Additional focused tests for specific accessibility concerns
test.describe('Specific Accessibility Checks', () => {
  test('Check color contrast on admin sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    // Focus on sidebar specifically
    const sidebar = page.locator('aside').first();

    if (await sidebar.isVisible()) {
      const results = await new AxeBuilder({ page })
        .include('aside')
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

      if (contrastViolations.length > 0) {
        console.log('\n[CONTRAST] Sidebar color contrast issues:');
        for (const node of contrastViolations[0].nodes) {
          console.log(`  - ${node.target.join(' > ')}`);
          console.log(`    ${node.failureSummary}`);
        }
      } else {
        console.log('\n[CONTRAST] Sidebar passes color contrast requirements');
      }
    }
  });

  test('Check form inputs have labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const labelViolations = results.violations.filter(v =>
      v.id === 'label' || v.id === 'label-title-only' || v.id === 'form-field-multiple-labels'
    );

    if (labelViolations.length > 0) {
      console.log('\n[LABELS] Form label issues:');
      for (const violation of labelViolations) {
        console.log(`  ${violation.id}: ${violation.description}`);
        for (const node of violation.nodes) {
          console.log(`    - ${node.target.join(' > ')}`);
        }
      }
    } else {
      console.log('\n[LABELS] All form inputs have proper labels');
    }
  });

  test('Check focus indicators exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements and check for focus visibility
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex="0"]').all();

    console.log(`\n[FOCUS] Checking ${interactiveElements.length} interactive elements for focus indicators`);

    // Check a sample of elements
    const sampleSize = Math.min(10, interactiveElements.length);
    for (let i = 0; i < sampleSize; i++) {
      const element = interactiveElements[i];
      if (await element.isVisible()) {
        await element.focus();

        // Check if element has outline or ring when focused
        const outlineStyle = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
          };
        });

        const hasFocusIndicator =
          outlineStyle.outline !== 'none' && outlineStyle.outlineWidth !== '0px' ||
          outlineStyle.boxShadow !== 'none';

        if (!hasFocusIndicator) {
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class');
          console.log(`  [WARN] No focus indicator: ${tagName} with class "${className?.substring(0, 50)}..."`);
        }
      }
    }
  });

  test('Check skip link exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for skip link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip to"), [role="navigation"] a:first-child');

    const hasSkipLink = await skipLink.count() > 0;

    if (hasSkipLink) {
      console.log('\n[SKIP] Skip link found');
    } else {
      console.log('\n[SKIP] No skip link found - needs to be added');
    }
  });
});
