# UI/UX Audit Agent - Quick Start Guide

## What This Agent Does

The **civic-ux-audit-agent** is a specialized Claude agent that performs comprehensive UI/UX audits of the Civic Notices platform. It evaluates the site against enterprise-grade standards (Stripe-level polish) and UK government accessibility requirements (WCAG 2.1 AA).

## When to Use This Agent

Use this agent when you need to:

- **Pre-launch audit**: Before going live or deploying major features
- **Post-redesign validation**: After updating the design system or key pages
- **Accessibility compliance**: Ensure WCAG 2.1 AA standards are met
- **Competitive benchmarking**: Compare against Stripe, GOV.UK, or other best-in-class platforms
- **Quarterly reviews**: Regular health checks of the platform's UX quality
- **Bug investigation**: User reports of confusing UX or accessibility issues

## Quick Start

### 1. From Claude Code

```bash
# Start the dev server first
npm run dev
```

Then in Claude Code:
```
@civic-ux-audit-agent Please run a comprehensive UI/UX audit of the Civic Notices platform. Focus on the homepage, publish wizard, and map view. Generate a full report with Playwright tests and screenshots.
```

### 2. Direct Invocation (if using Task tool)

```typescript
await claude.task({
  subagent_type: 'civic-ux-reviewer',
  prompt: `
    Run a full UI/UX audit of http://localhost:5173 focusing on:
    - Homepage hero and search
    - Publish wizard (all 4 steps)
    - Notice search with map view
    - Responsive design at 375px, 768px, 1280px

    Generate:
    1. Executive summary with top 10 issues
    2. Detailed findings with screenshots
    3. Playwright test suite
    4. Prioritized remediation plan
  `
});
```

## Audit Depths

### Quick Audit (15-20 minutes)
- Surface-level visual inspection
- Critical accessibility checks
- Mobile responsiveness
- Top 5 issues only

**Use when**: You need a fast sanity check before a demo or minor release.

```
@civic-ux-audit-agent Run a quick audit focusing on critical accessibility issues and mobile responsiveness.
```

### Standard Audit (30-45 minutes)
- All key user journeys
- WCAG 2.1 AA compliance
- Responsive design (3 viewports)
- Component consistency check
- Top 20 issues

**Use when**: Regular quarterly reviews or post-feature launches.

```
@civic-ux-audit-agent Run a standard audit of all key features with full accessibility checks.
```

### Comprehensive Audit (60-90 minutes)
- Every page and feature
- All responsive breakpoints
- Detailed component audit
- Performance metrics
- Full Playwright test coverage
- 50+ issues catalogued

**Use when**: Major redesigns, pre-launch validation, or certification requirements.

```
@civic-ux-audit-agent Run a comprehensive audit covering all pages, features, and accessibility criteria. Include detailed Playwright tests and performance metrics.
```

## Expected Outputs

After the audit completes, you'll receive:

### 1. Executive Summary (`audit-report/EXECUTIVE_SUMMARY.md`)
```markdown
# Civic Notices UI/UX Audit - Executive Summary
**Date**: 2025-11-04
**Grade**: A- (89/100)

## Top Strengths
1. Glassmorphism hero search card is visually stunning and on-brand
2. Wizard stepper provides clear progress indication
3. MapLibre integration is smooth and performant

## Top 5 Priority Issues
1. **P0**: Form submit button on step 3 lacks loading state (blocks users)
2. **P1**: Insufficient color contrast on gray text (4.2:1, needs 4.5:1)
3. **P1**: Mobile menu missing focus trap
4. **P2**: Inconsistent card shadows across components
5. **P2**: Empty state on drafts page lacks helpful CTA
```

### 2. Detailed Report (`audit-report/DETAILED_AUDIT.md`)
- 20-40 page markdown document
- Section per evaluation area
- Screenshots embedded
- Code snippets for fixes
- File paths and line numbers

### 3. Playwright Tests (`e2e/ux-audit/*.spec.ts`)
```typescript
e2e/ux-audit/
├── homepage.spec.ts
├── publish-wizard.spec.ts
├── map-view.spec.ts
├── responsive.spec.ts
└── accessibility.spec.ts
```

### 4. Screenshots (`audit-report/screenshots/`)
```
screenshots/
├── desktop/
│   ├── homepage-hero.png
│   ├── wizard-step1.png
│   └── ...
├── tablet/
├── mobile/
└── annotated/  # Issues marked up
    ├── contrast-issue-home.png
    └── ...
```

### 5. Issue Tracker (`audit-report/ISSUES.csv`)
```csv
Priority,Area,Issue,Location,Effort,Status
P0,Forms,Submit button no loading state,src/pages/publish/step-3.tsx:142,Small,Open
P1,A11y,Insufficient contrast on gray text,tailwind.config.js:38,Medium,Open
...
```

## Interpreting Results

### Grading Scale
- **A+ (95-100)**: Stripe-level, production-ready
- **A (90-94)**: Excellent, minor polish needed
- **B (80-89)**: Good, address P1 issues before major launch
- **C (70-79)**: Functional but needs UX improvements
- **D (60-69)**: Significant issues, not ready for public launch
- **F (<60)**: Major overhaul needed

### Priority Levels
- **P0 (Critical)**: Fix immediately, blocks users or accessibility violation
- **P1 (High)**: Fix before next release, significant UX/accessibility issue
- **P2 (Medium)**: Plan for next sprint, inconsistency or polish
- **P3 (Low)**: Backlog, nice-to-have improvements

## Common Findings & Quick Fixes

### Issue: Insufficient Color Contrast
**Finding**: Gray text (#667085) on white background = 4.2:1 (needs 4.5:1)

**Quick Fix**:
```javascript
// tailwind.config.js
colors: {
  'brand-slate': '#667085', // 4.2:1 ❌
  'brand-slate': '#5F6A7E', // 4.6:1 ✅
}
```

### Issue: Missing Focus Indicators
**Finding**: Buttons lose outline but don't add ring

**Quick Fix**:
```tsx
// src/styles/ui.ts
export const btnPrimary = `
  ...
  focus:outline-none
  focus:ring-2
  focus:ring-blue-600
  focus:ring-offset-2  // ← Add this
`;
```

### Issue: Form Field Lacks Error State
**Finding**: Field validation shows red border but no message

**Quick Fix**:
```tsx
<div>
  <input
    className={cn("...", errors.name && "border-rose-500")}
  />
  {errors.name && (
    <p className="mt-1 text-sm text-rose-600" role="alert">
      {errors.name.message}
    </p>
  )}
</div>
```

### Issue: Mobile Viewport Overflow
**Finding**: Horizontal scroll at 375px width

**Quick Fix**:
```tsx
// Add to parent container
<div className="w-full overflow-x-hidden">
  {/* content */}
</div>
```

## Running Tests Manually

After the agent generates Playwright tests:

```bash
# Run all UX audit tests
npx playwright test e2e/ux-audit/

# Run specific suite
npx playwright test e2e/ux-audit/homepage.spec.ts

# Run with headed browser (see what's happening)
npx playwright test e2e/ux-audit/ --headed

# Run at specific viewport
npx playwright test --config=playwright.config.mobile.ts

# Generate HTML report
npx playwright show-report
```

## Accessibility Testing

The agent uses axe-core, but you can also run manually:

```bash
# Install axe CLI (if not already)
npm install -g @axe-core/cli

# Scan a page
axe http://localhost:5173/ --tags wcag2a,wcag2aa

# Scan with custom rules
axe http://localhost:5173/publish/step-1 --rules color-contrast,label
```

## Integrating Findings into Workflow

### 1. Create GitHub Issues
The agent can output issues in a format that can be bulk-imported:

```bash
# From audit-report/ISSUES.csv
gh issue create --title "P0: Submit button lacks loading state" \
  --body "Location: src/pages/publish/step-3.tsx:142\nSee audit-report/DETAILED_AUDIT.md#forms" \
  --label "bug,accessibility,P0"
```

### 2. Track in Project Board
Add issues to your project board with priority labels:
- `P0` = Sprint 1 column
- `P1` = Sprint 2 column
- `P2` = Backlog (next quarter)
- `P3` = Icebox

### 3. Update Design System
For consistency issues, update your design tokens:

```typescript
// Create a shared const for reused styles
export const BUTTON_FOCUS_CLASSES = 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2';

// Use throughout codebase
<button className={`${btnPrimary} ${BUTTON_FOCUS_CLASSES}`}>
```

### 4. Add to CI/CD
Run accessibility checks on every PR:

```yaml
# .github/workflows/a11y.yml
name: Accessibility Check
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run dev &
      - run: npm run test:a11y
      - uses: actions/upload-artifact@v3
        with:
          name: a11y-report
          path: playwright-report/
```

## Customizing the Agent

To focus the audit on specific areas:

```
@civic-ux-audit-agent Run an audit focusing ONLY on:
- Form validation UX in the publish wizard
- Mobile responsive behavior at 375px
- Color contrast across all pages

Skip map view and dashboard for this audit.
```

To compare against specific benchmarks:

```
@civic-ux-audit-agent Audit the homepage and compare it against:
- Stripe's checkout page (stripe.com/checkout)
- GOV.UK Notify (notifications.service.gov.uk)

Highlight where we exceed or fall short of these standards.
```

## Troubleshooting

### Agent takes too long
- Request a "quick audit" instead
- Limit scope to 1-2 features
- Skip screenshot generation

### Playwright tests fail
- Ensure dev server is running (`npm run dev`)
- Check ports (5173 for Vite, 5174 for API)
- Update selectors if UI changed (`[data-testid="..."]`)

### False positives
- Review context: Some "violations" may be intentional (e.g., decorative images with empty alt)
- Provide feedback: "The empty alt on hero decorative blob is correct, not an issue"

### Missing coverage
- Agent didn't test authenticated pages by default
- Explicitly request: "Also audit council dashboard and firm settings (use test credentials)"

## Best Practices

### Before Running Audit
1. Ensure dev server is stable
2. Seed test data (notices, councils, users)
3. Clear browser cache/cookies
4. Test on fresh branch

### After Receiving Report
1. Review executive summary first
2. Prioritize P0/P1 issues for immediate action
3. Create GitHub issues for trackability
4. Schedule follow-up audit after fixes

### Regular Audits
- **Monthly**: Quick audit of new features
- **Quarterly**: Standard audit of entire platform
- **Annually**: Comprehensive audit with external review

## Examples of Good Findings

### Visual Design
> "Homepage hero gradient is expertly crafted with subtle blur effects and glassmorphism. The search card's `backdrop-blur-xl` combined with `bg-white/90` creates a premium feel. Recommend applying this pattern to other key CTA cards site-wide for consistency."

### UX
> "The wizard stepper (WizardStepper.tsx) provides excellent progress indication. Users can see they're on step 2 of 4, and completed steps show a checkmark. Minor improvement: allow clicking previous steps to navigate back (currently disabled)."

### Accessibility
> "Excellent use of ARIA landmarks (`<main>`, `<nav>`). The skip-to-content link is properly implemented. One issue: the mobile menu modal doesn't trap focus—pressing Tab after the last item escapes the dialog."

## Related Tools

- **Lighthouse**: Chrome DevTools → Run audit
- **WAVE**: Browser extension for visual a11y feedback
- **axe DevTools**: Browser extension with detailed reports
- **Pa11y**: CLI tool for automated accessibility testing
- **Storybook**: Test components in isolation

## Support & Feedback

If the audit agent isn't working as expected:
1. Check that your prompt is specific about what to audit
2. Ensure prerequisites are met (dev server running, test data seeded)
3. Review agent logs for errors
4. File an issue: "UX audit agent: [describe problem]"

## Further Reading

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GDS Design System](https://design-system.service.gov.uk/)
- [Stripe Design Resources](https://stripe.com/docs/design)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
