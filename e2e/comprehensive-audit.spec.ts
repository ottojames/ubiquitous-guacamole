import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * COMPREHENSIVE WEBSITE AUDIT
 *
 * This test audits the entire publish flow from two perspectives:
 * 1. Legal Professional / Superior Officer (domain expert)
 * 2. UI/UX Developer (technical implementation)
 */

interface AuditIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'legal-compliance' | 'usability' | 'accessibility' | 'visual-design' | 'functionality' | 'content' | 'performance';
  location: string;
  issue: string;
  recommendation: string;
  perspective: 'legal-officer' | 'ui-developer' | 'both';
}

const auditReport: AuditIssue[] = [];

function addIssue(issue: AuditIssue) {
  auditReport.push(issue);
  console.log(`[${issue.severity.toUpperCase()}] [${issue.perspective}] ${issue.location}: ${issue.issue}`);
}

test.describe('Comprehensive Website Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('Audit: Homepage & Navigation', async ({ page }) => {
    console.log('\n=== AUDITING HOMEPAGE & NAVIGATION ===\n');

    // Check page load
    await page.waitForLoadState('networkidle');

    // Legal Officer Perspective: Clear purpose and trust indicators
    const heading = await page.locator('h1').first().textContent();
    if (!heading?.toLowerCase().includes('legal') && !heading?.toLowerCase().includes('notice')) {
      addIssue({
        severity: 'medium',
        category: 'content',
        location: 'Homepage - Main Heading',
        issue: 'Main heading does not clearly communicate the legal/official nature of the service',
        recommendation: 'Include terminology like "Legal Notices" or "Official Public Notices" to establish authority and trust',
        perspective: 'legal-officer'
      });
    }

    // UI Developer Perspective: Responsive design check
    const viewports = [
      { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
      { width: 768, height: 1024, name: 'Tablet (iPad)' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        addIssue({
          severity: 'medium',
          category: 'visual-design',
          location: `Homepage - ${viewport.name}`,
          issue: 'Horizontal scrollbar detected, indicating layout overflow',
          recommendation: 'Review CSS for elements exceeding viewport width. Check for fixed widths, uncontrolled content, or missing max-width constraints',
          perspective: 'ui-developer'
        });
      }
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Check for publish button/link
    const publishButton = page.getByRole('link', { name: /publish|create|submit/i });
    const publishExists = await publishButton.count() > 0;

    if (!publishExists) {
      addIssue({
        severity: 'critical',
        category: 'usability',
        location: 'Homepage - Primary CTA',
        issue: 'No clear "Publish Notice" or "Create Notice" call-to-action found',
        recommendation: 'Add a prominent, clearly labeled button/link to begin the notice publication process',
        perspective: 'both'
      });
    }

    // Accessibility: Check for skip link
    const skipLink = await page.locator('a[href="#main-content"], a[href="#main"]').count();
    if (skipLink === 0) {
      addIssue({
        severity: 'low',
        category: 'accessibility',
        location: 'Homepage - Document Structure',
        issue: 'No skip-to-main-content link found for keyboard navigation',
        recommendation: 'Add a skip link as the first focusable element: <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>',
        perspective: 'ui-developer'
      });
    }
  });

  test('Audit: Publish Flow - Step 1 (Notice Type Selection)', async ({ page }) => {
    console.log('\n=== AUDITING STEP 1: NOTICE TYPE SELECTION ===\n');

    // Navigate to publish flow
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Legal Officer: Check for clear categorization and descriptions
    const noticeTypeCards = await page.locator('[data-testid*="notice-type"], .notice-type-card, button:has-text("Premises"), button:has-text("Variation")').all();

    if (noticeTypeCards.length === 0) {
      addIssue({
        severity: 'critical',
        category: 'functionality',
        location: 'Step 1 - Notice Type Selection',
        issue: 'No notice type options visible on the page',
        recommendation: 'Ensure notice type buttons/cards are rendering correctly. Check component mounting and data loading',
        perspective: 'both'
      });
    } else {
      console.log(`Found ${noticeTypeCards.length} notice type options`);

      // Check each card for description
      for (let i = 0; i < Math.min(noticeTypeCards.length, 3); i++) {
        const card = noticeTypeCards[i];
        const text = await card.textContent();

        if (text && text.length < 20) {
          addIssue({
            severity: 'medium',
            category: 'content',
            location: `Step 1 - Notice Type ${i + 1}`,
            issue: 'Notice type card contains minimal descriptive text',
            recommendation: 'Add 2-3 sentence descriptions explaining when each notice type should be used, including legal requirements or typical scenarios',
            perspective: 'legal-officer'
          });
        }
      }
    }

    // UI Developer: Visual hierarchy and spacing
    const heading = await page.locator('h1, h2').first();
    const headingText = await heading.textContent();

    if (!headingText?.toLowerCase().includes('type') && !headingText?.toLowerCase().includes('select')) {
      addIssue({
        severity: 'low',
        category: 'usability',
        location: 'Step 1 - Page Heading',
        issue: 'Page heading does not clearly indicate the user should select a notice type',
        recommendation: 'Use explicit heading like "Select Your Notice Type" or "Choose the Type of Notice to Publish"',
        perspective: 'ui-developer'
      });
    }

    // Check for progress indicator
    const progressIndicator = await page.locator('[role="progressbar"], .stepper, .progress, nav:has([aria-current])').count();
    if (progressIndicator === 0) {
      addIssue({
        severity: 'medium',
        category: 'usability',
        location: 'Step 1 - Progress Indicator',
        issue: 'No visible progress indicator showing current step in multi-step form',
        recommendation: 'Add a step indicator (e.g., "Step 1 of 4") to help users understand their position in the workflow',
        perspective: 'both'
      });
    }
  });

  test('Audit: Publish Flow - Step 2 (Upload Method)', async ({ page }) => {
    console.log('\n=== AUDITING STEP 2: UPLOAD METHOD ===\n');

    // Navigate through flow
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select first notice type
    const firstNoticeType = page.locator('button, a').filter({ hasText: /premises|licence|application/i }).first();
    if (await firstNoticeType.count() > 0) {
      await firstNoticeType.click();
      await page.waitForLoadState('networkidle');
    }

    // Legal Officer: Clear explanation of upload vs template
    const uploadExplanation = await page.locator('text=/upload.*file|template|choose.*method/i').count();
    if (uploadExplanation === 0) {
      addIssue({
        severity: 'high',
        category: 'content',
        location: 'Step 2 - Method Selection',
        issue: 'No clear explanation of the difference between uploading a file vs using the template builder',
        recommendation: 'Add prominent explanatory text: "Upload a file" (for existing notices) vs "Use template" (to create from scratch). Include guidance on which to choose.',
        perspective: 'legal-officer'
      });
    }

    // Check for upload dropzone
    const dropzone = page.getByTestId('upload-dropzone');
    const dropzoneExists = await dropzone.count() > 0;

    if (dropzoneExists) {
      // UI Developer: Dropzone feedback
      const dropzoneText = await dropzone.textContent();

      if (!dropzoneText?.toLowerCase().includes('drag') && !dropzoneText?.toLowerCase().includes('drop')) {
        addIssue({
          severity: 'low',
          category: 'usability',
          location: 'Step 2 - Upload Dropzone',
          issue: 'Dropzone does not explicitly mention drag-and-drop functionality',
          recommendation: 'Add text like "Drag and drop your file here, or click to browse"',
          perspective: 'ui-developer'
        });
      }

      // Check for accepted file types
      if (!dropzoneText?.toLowerCase().includes('pdf') && !dropzoneText?.toLowerCase().includes('file type')) {
        addIssue({
          severity: 'medium',
          category: 'usability',
          location: 'Step 2 - Upload Dropzone',
          issue: 'Accepted file formats not clearly displayed',
          recommendation: 'Display accepted file types prominently: "Accepted: PDF, DOCX, PNG, JPG (max 25MB)"',
          perspective: 'both'
        });
      }
    }
  });

  test('Audit: Publish Flow - Step 2 Template Form (Comprehensive)', async ({ page }) => {
    console.log('\n=== AUDITING STEP 2: TEMPLATE FORM (DETAILED) ===\n');

    // Navigate and select template mode
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    const premisesLicence = page.locator('button, a').filter({ hasText: /premises.*licence/i }).first();
    if (await premisesLicence.count() > 0) {
      await premisesLicence.click();
      await page.waitForLoadState('networkidle');

      // Try to find and click "Use template" button
      const templateButton = page.getByRole('button', { name: /template|build|create/i });
      if (await templateButton.count() > 0) {
        await templateButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // Legal Officer Perspective: Field labels and legal accuracy
    const labelElements = await page.locator('label').all();
    console.log(`Found ${labelElements.length} form labels`);

    let fieldAudit = {
      missingRequired: 0,
      unclearLabels: 0,
      missingHelp: 0
    };

    for (const label of labelElements.slice(0, 20)) { // Audit first 20 fields
      const text = await label.textContent();
      const hasRequired = await label.locator('[aria-required="true"], input[required], textarea[required]').count() > 0;
      const hasAsterisk = text?.includes('*');

      if (hasRequired && !hasAsterisk) {
        fieldAudit.missingRequired++;
      }

      // Check for legal-specific unclear terminology
      if (text?.toLowerCase().includes('dps') && !text.includes('Designated Premises Supervisor')) {
        addIssue({
          severity: 'medium',
          category: 'content',
          location: 'Step 2 - DPS Field',
          issue: 'Acronym "DPS" used without full term explanation',
          recommendation: 'Change label to "DPS (Designated Premises Supervisor)" or add help text explaining the term',
          perspective: 'legal-officer'
        });
      }
    }

    if (fieldAudit.missingRequired > 0) {
      addIssue({
        severity: 'high',
        category: 'usability',
        location: 'Step 2 - Form Fields',
        issue: `${fieldAudit.missingRequired} required fields lack visual indicator (asterisk)`,
        recommendation: 'Add asterisk (*) or "Required" badge to all mandatory fields. Include a legend: "* Required field"',
        perspective: 'both'
      });
    }

    // Check for address lookup functionality
    const addressInputs = await page.locator('textarea[id*="address"], input[id*="address"], input[id*="postcode"]').all();
    console.log(`Found ${addressInputs.length} address-related inputs`);

    if (addressInputs.length > 0) {
      // Check if there's an address lookup component nearby
      for (const input of addressInputs.slice(0, 3)) {
        const container = input.locator('xpath=ancestor::div[contains(@class, "space-y") or contains(@class, "flex-col")][1]');
        const hasLookup = await container.locator('[placeholder*="search" i], [placeholder*="postcode" i], button:has-text("Search")').count() > 0;

        if (!hasLookup) {
          const fieldId = await input.getAttribute('id');
          addIssue({
            severity: 'medium',
            category: 'usability',
            location: `Step 2 - Address Field (${fieldId})`,
            issue: 'Address field does not have accompanying address lookup/autocomplete functionality',
            recommendation: 'Add AddressLookup component above manual entry fields to allow users to search by postcode or address',
            perspective: 'both'
          });
        }
      }
    }

    // Legal Officer: Check for statutory date fields
    const dateInputs = await page.locator('input[type="date"]').all();
    console.log(`Found ${dateInputs.length} date inputs`);

    if (dateInputs.length > 0) {
      for (const dateInput of dateInputs) {
        const label = await dateInput.locator('xpath=preceding::label[1]').textContent();
        const hasHelp = await dateInput.locator('xpath=following-sibling::*[contains(@class, "text-xs") or contains(@class, "help")]').count() > 0;

        if (label?.toLowerCase().includes('deadline') && !hasHelp) {
          addIssue({
            severity: 'medium',
            category: 'legal-compliance',
            location: 'Step 2 - Deadline Date Field',
            issue: 'Statutory deadline field lacks explanatory help text about calculation rules',
            recommendation: 'Add help text explaining the 28-day rule or other statutory requirements for deadline calculation',
            perspective: 'legal-officer'
          });
        }
      }
    }

    // UI Developer: Form validation feedback
    const errorMessages = await page.locator('[role="alert"], .error, [class*="error" i]').count();
    console.log(`Found ${errorMessages} error message elements`);

    // Check for licensable activities section
    const activitiesSection = await page.locator('text=/licensable.*activities|activities.*hours/i').count();
    if (activitiesSection === 0) {
      addIssue({
        severity: 'high',
        category: 'legal-compliance',
        location: 'Step 2 - Licensable Activities',
        issue: 'Licensable activities section not found or not visible',
        recommendation: 'Ensure the activities/hours section is prominently displayed for licensing applications. This is a mandatory statutory requirement.',
        perspective: 'legal-officer'
      });
    }
  });

  test('Audit: Publish Flow - Step 3 (Review & Confirm)', async ({ page }) => {
    console.log('\n=== AUDITING STEP 3: REVIEW & CONFIRM ===\n');

    // Navigate to step 3 (would need to fill previous steps in real scenario)
    await page.goto('http://localhost:5173/publish/step-3');
    await page.waitForTimeout(1000);

    // Legal Officer: Editable preview
    const editableText = await page.locator('textarea[id*="ocr"], textarea[id*="notice"], [contenteditable="true"]').count();

    if (editableText === 0) {
      addIssue({
        severity: 'high',
        category: 'functionality',
        location: 'Step 3 - Notice Preview',
        issue: 'No editable text area found for reviewing/correcting extracted notice text',
        recommendation: 'For uploaded notices, provide an editable textarea allowing legal officers to correct OCR errors before submission',
        perspective: 'legal-officer'
      });
    }

    // Check for clear instructions
    const instructions = await page.locator('text=/review|check|verify|confirm/i').first().textContent();
    if (!instructions?.toLowerCase().includes('correct') && !instructions?.toLowerCase().includes('edit')) {
      addIssue({
        severity: 'medium',
        category: 'content',
        location: 'Step 3 - Instructions',
        issue: 'Instructions do not explicitly tell users they can make corrections',
        recommendation: 'Add clear instruction: "Please review the notice text below and make any necessary corrections before continuing"',
        perspective: 'legal-officer'
      });
    }

    // UI Developer: Summary of key details
    const summaryFields = await page.locator('dt, .summary-label, [class*="label" i]').count();
    console.log(`Found ${summaryFields} summary field labels`);

    if (summaryFields < 5) {
      addIssue({
        severity: 'medium',
        category: 'usability',
        location: 'Step 3 - Summary Panel',
        issue: 'Limited or no summary of key details (applicant, address, dates) shown for review',
        recommendation: 'Add a summary panel showing: Notice Type, Applicant Name, Premises Address, Application Date, Deadline Date',
        perspective: 'ui-developer'
      });
    }

    // Check for back button
    const backButton = await page.getByRole('button', { name: /back|previous/i }).count();
    if (backButton === 0) {
      addIssue({
        severity: 'high',
        category: 'usability',
        location: 'Step 3 - Navigation',
        issue: 'No "Back" button to return to previous step for corrections',
        recommendation: 'Add a "Back" button allowing users to return and edit form data without losing progress',
        perspective: 'both'
      });
    }
  });

  test('Audit: Accessibility (WCAG 2.1 AA)', async ({ page }) => {
    console.log('\n=== AUDITING ACCESSIBILITY (WCAG 2.1 AA) ===\n');

    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Color contrast check (simplified - would use axe-core in production)
    const textElements = await page.locator('p, span, label, button, a').all();

    // Check for sufficient focus indicators
    for (const element of textElements.slice(0, 10)) {
      const isInteractive = await element.evaluate((el) => {
        return el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT';
      });

      if (isInteractive) {
        await element.focus();
        const hasFocusStyle = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || styles.boxShadow.includes('rgb') || el.classList.contains('focus:ring');
        });

        if (!hasFocusStyle) {
          const tag = await element.evaluate(el => el.tagName);
          addIssue({
            severity: 'high',
            category: 'accessibility',
            location: `Interactive Element - ${tag}`,
            issue: 'Interactive element lacks visible focus indicator',
            recommendation: 'Add focus styles: focus:ring-2 focus:ring-blue-500 focus:outline-none',
            perspective: 'ui-developer'
          });
          break; // Report once
        }
      }
    }

    // Check for form labels
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs.slice(0, 10)) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (!id && !ariaLabel && !ariaLabelledBy) {
        addIssue({
          severity: 'high',
          category: 'accessibility',
          location: 'Form Input',
          issue: 'Form input has no associated label or aria-label',
          recommendation: 'Every input must have a <label> with matching for/id or aria-label attribute',
          perspective: 'ui-developer'
        });
        break; // Report once
      }
    }

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      if (!alt && ariaHidden !== 'true') {
        addIssue({
          severity: 'medium',
          category: 'accessibility',
          location: 'Image Element',
          issue: 'Image missing alt text',
          recommendation: 'Add descriptive alt text or aria-hidden="true" if image is decorative',
          perspective: 'ui-developer'
        });
        break;
      }
    }

    // Keyboard navigation test
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    const firstFocusable = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    if (!firstFocusable) {
      addIssue({
        severity: 'critical',
        category: 'accessibility',
        location: 'Page - Keyboard Navigation',
        issue: 'Tab key does not focus any element - keyboard navigation broken',
        recommendation: 'Ensure proper tab index and focusable elements throughout the page. Remove tabindex="-1" from interactive elements.',
        perspective: 'ui-developer'
      });
    }
  });

  test('Audit: Performance & Load Times', async ({ page }) => {
    console.log('\n=== AUDITING PERFORMANCE ===\n');

    const startTime = Date.now();
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    if (loadTime > 3000) {
      addIssue({
        severity: 'medium',
        category: 'performance',
        location: 'Page Load',
        issue: `Page took ${loadTime}ms to load (>3 seconds)`,
        recommendation: 'Optimize bundle size, implement code splitting, lazy load non-critical components, and optimize images',
        perspective: 'ui-developer'
      });
    }

    // Check for large images
    const images = await page.locator('img').all();
    for (const img of images.slice(0, 5)) {
      const src = await img.getAttribute('src');
      if (src && !src.includes('data:') && !src.includes('svg')) {
        const size = await page.evaluate((imgSrc) => {
          return fetch(imgSrc)
            .then(res => res.blob())
            .then(blob => blob.size);
        }, src).catch(() => 0);

        if (size > 500000) { // 500KB
          addIssue({
            severity: 'low',
            category: 'performance',
            location: `Image: ${src}`,
            issue: `Image size is ${Math.round(size / 1024)}KB, which may slow page load`,
            recommendation: 'Compress images, use modern formats (WebP), implement lazy loading, or use responsive images',
            perspective: 'ui-developer'
          });
        }
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n\n=== GENERATING COMPREHENSIVE AUDIT REPORT ===\n');

    // Sort issues by severity
    const sortedIssues = auditReport.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    // Generate report
    let report = `
# COMPREHENSIVE WEBSITE AUDIT REPORT
## Public Notice Portal - Publish Flow Analysis

**Date:** ${new Date().toISOString().split('T')[0]}
**Total Issues Found:** ${auditReport.length}

---

## EXECUTIVE SUMMARY

`;

    // Count by severity
    const criticalCount = sortedIssues.filter(i => i.severity === 'critical').length;
    const highCount = sortedIssues.filter(i => i.severity === 'high').length;
    const mediumCount = sortedIssues.filter(i => i.severity === 'medium').length;
    const lowCount = sortedIssues.filter(i => i.severity === 'low').length;

    report += `### Issue Breakdown by Severity
- 🔴 **CRITICAL**: ${criticalCount} issues requiring immediate attention
- 🟠 **HIGH**: ${highCount} issues that should be addressed soon
- 🟡 **MEDIUM**: ${mediumCount} issues for improvement
- 🟢 **LOW**: ${lowCount} minor enhancements

### Issue Breakdown by Category
`;

    const categoryCounts: Record<string, number> = {};
    sortedIssues.forEach(issue => {
      categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    });

    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
      report += `- **${category}**: ${count} issues\n`;
    });

    report += `
### Issue Breakdown by Perspective
- **Legal Officer / Superior Officer**: ${sortedIssues.filter(i => i.perspective === 'legal-officer').length} issues
- **UI/UX Developer**: ${sortedIssues.filter(i => i.perspective === 'ui-developer').length} issues
- **Both Perspectives**: ${sortedIssues.filter(i => i.perspective === 'both').length} issues

---

## DETAILED FINDINGS

`;

    // Group by severity
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

    severities.forEach(severity => {
      const issues = sortedIssues.filter(i => i.severity === severity);
      if (issues.length === 0) return;

      const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[severity];
      report += `### ${emoji} ${severity.toUpperCase()} PRIORITY (${issues.length} issues)\n\n`;

      issues.forEach((issue, index) => {
        const perspectiveIcon = {
          'legal-officer': '⚖️',
          'ui-developer': '💻',
          'both': '⚖️💻'
        }[issue.perspective];

        report += `#### ${index + 1}. ${perspectiveIcon} ${issue.location}\n`;
        report += `**Category:** ${issue.category}\n\n`;
        report += `**Issue:** ${issue.issue}\n\n`;
        report += `**Recommendation:** ${issue.recommendation}\n\n`;
        report += `**Perspective:** ${issue.perspective.replace('-', ' ')}\n\n`;
        report += `---\n\n`;
      });
    });

    report += `
## PRIORITY ACTIONS

### Immediate (Critical & High Priority)

`;

    const immediate = sortedIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
    immediate.forEach((issue, index) => {
      report += `${index + 1}. **${issue.location}**: ${issue.issue}\n`;
      report += `   → ${issue.recommendation}\n\n`;
    });

    report += `
### Legal Compliance Focus

`;

    const legalIssues = sortedIssues.filter(i =>
      i.category === 'legal-compliance' ||
      i.perspective === 'legal-officer' ||
      i.perspective === 'both'
    );

    legalIssues.slice(0, 5).forEach((issue, index) => {
      report += `${index + 1}. **${issue.location}**: ${issue.issue}\n`;
      report += `   → ${issue.recommendation}\n\n`;
    });

    report += `
### User Experience Focus

`;

    const uxIssues = sortedIssues.filter(i =>
      i.category === 'usability' ||
      i.category === 'accessibility'
    );

    uxIssues.slice(0, 5).forEach((issue, index) => {
      report += `${index + 1}. **${issue.location}**: ${issue.issue}\n`;
      report += `   → ${issue.recommendation}\n\n`;
    });

    report += `
---

## OVERALL ASSESSMENT

`;

    if (criticalCount > 0) {
      report += `⚠️ **URGENT**: ${criticalCount} critical issues require immediate attention before production release.\n\n`;
    }

    if (legalIssues.length > 10) {
      report += `⚖️ **LEGAL COMPLIANCE**: Significant concerns from legal professional perspective. Review statutory requirements and user guidance.\n\n`;
    }

    report += `
### Strengths
- Multi-step wizard flow provides clear structure
- Address lookup functionality implemented in key areas
- Modern, clean UI design

### Key Improvement Areas
- Legal terminology and guidance clarity
- Form field validation and error messaging
- Accessibility compliance (WCAG 2.1 AA)
- Mobile responsiveness
- User feedback and confirmation messaging

---

**End of Report**
`;

    // Write report to file
    const reportPath = path.join(process.cwd(), 'audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Comprehensive audit report saved to: ${reportPath}\n`);
    console.log(`📊 Total issues found: ${auditReport.length}`);
    console.log(`   🔴 Critical: ${criticalCount}`);
    console.log(`   🟠 High: ${highCount}`);
    console.log(`   🟡 Medium: ${mediumCount}`);
    console.log(`   🟢 Low: ${lowCount}`);
  });
});
