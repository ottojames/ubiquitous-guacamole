# UI/UX Audit Agent - Complete Package

## 📋 Overview

This directory contains a complete, production-ready **UI/UX Audit Agent** specifically designed for the Civic Notices platform. The agent evaluates your site against enterprise-grade standards (Stripe-level polish) and UK government accessibility requirements (WCAG 2.1 AA).

## 📦 What's Included

### 1. **Main Agent Specification** (`civic-ux-audit-agent.md`)
The comprehensive agent prompt that defines:
- Role and expertise (Senior UI/UX Auditor with 10+ years experience)
- Audit methodology (6 phases)
- Evaluation criteria for Visual Design, UX, Accessibility, Responsive Design, Component Consistency, and Performance
- Specific focus areas for Civic Notices (statutory compliance, multi-persona support, complex data display)
- Report structure and deliverables
- Prioritization matrix (P0-P3)
- Scoring rubric and success criteria

**When to use**: When you need Claude to perform a comprehensive automated audit of the platform.

### 2. **Quick Start Guide** (`README-UX-AUDIT.md`)
Practical guide covering:
- When to use the agent (pre-launch, post-redesign, quarterly reviews)
- How to invoke the agent from Claude Code
- Audit depths (Quick, Standard, Comprehensive)
- Expected outputs and how to interpret them
- Grading scale and priority levels
- Common findings with quick fixes
- Integration into your workflow (GitHub issues, project boards, CI/CD)
- Troubleshooting tips

**When to use**: First time running the agent or when onboarding team members.

### 3. **Audit Checklist** (`ux-audit-checklist.md`)
Quick reference checklist with 100+ checkboxes covering:
- Visual Design (Typography, Color, Spacing, Components, Animations)
- User Experience (Navigation, Forms, Search, Loading/Error/Empty States)
- Accessibility (Keyboard, Screen Reader, Visual, Motion)
- Responsive Design (Mobile, Tablet, Desktop, Large Screens)
- Component Consistency (Buttons, Forms, Cards, Icons)
- Performance & Perceived Performance
- Civic Notices-specific items
- Scoring template and priority matrix

**When to use**: Manual audits, spot checks, or as a reference while coding.

### 4. **Playwright Test Templates** (`playwright-test-templates.md`)
Reusable test templates including:
- Helper functions (a11y scanning, contrast checking, keyboard nav testing)
- Template 1: Homepage Visual & UX Audit
- Template 2: Publish Wizard Flow Audit
- Template 3: Map View Interaction Audit
- Template 4: Responsive Design Audit
- Template 5: Component Consistency Audit
- Customization examples (visual regression, performance timing)

**When to use**: Setting up automated Playwright tests, extending test coverage.

---

## 🚀 Quick Start

### Option 1: Full Automated Audit with Claude Code

```bash
# Ensure dev server is running
npm run dev
```

Then in Claude Code:
```
@civic-ux-audit-agent Please run a comprehensive UI/UX audit of the Civic Notices platform. Focus on:
- Homepage hero and search
- Publish wizard (all 4 steps)
- Notice search with map view
- Responsive design at mobile, tablet, desktop

Generate:
1. Executive summary with top 10 issues
2. Detailed findings with screenshots
3. Playwright test suite
4. Prioritized remediation plan
```

### Option 2: Manual Audit with Checklist

```bash
# Open the checklist
open .claude/agents/ux-audit-checklist.md

# Navigate through key pages
open http://localhost:5173/
open http://localhost:5173/notices
open http://localhost:5173/publish/step-1

# Check off items as you review
# Create GitHub issues for P0/P1 findings
```

### Option 3: Automated Playwright Tests

```bash
# Copy test templates to e2e/ux-audit/
mkdir -p e2e/ux-audit
# Copy relevant templates from playwright-test-templates.md

# Run tests
npx playwright test e2e/ux-audit/

# View report
npx playwright show-report
```

---

## 📊 Agent Outputs

When you run the full agent, expect the following deliverables:

### 1. Executive Summary (`audit-report/EXECUTIVE_SUMMARY.md`)
```
Grade: A- (89/100)
Top 3 Strengths: ...
Top 5 Priority Issues: ...
```

### 2. Detailed Report (`audit-report/DETAILED_AUDIT.md`)
- Visual Design Assessment (20-40 pages)
- UX Evaluation
- Accessibility Report
- Responsive Design Analysis
- Component Consistency Findings
- Playwright Test Results

### 3. Playwright Tests (`e2e/ux-audit/*.spec.ts`)
- Homepage tests
- Wizard flow tests
- Map view tests
- Responsive tests
- Accessibility tests

### 4. Screenshots (`audit-report/screenshots/`)
```
screenshots/
├── desktop/
│   ├── homepage-hero.png
│   ├── wizard-step1.png
│   └── map-view.png
├── tablet/
├── mobile/
└── annotated/
    ├── contrast-issue-home.png
    └── layout-overflow-mobile.png
```

### 5. Issue Tracker (`audit-report/ISSUES.csv`)
```csv
Priority,Area,Issue,Location,Effort,Status
P0,Forms,Submit button no loading state,src/pages/publish/step-3.tsx:142,Small,Open
P1,A11y,Insufficient contrast,tailwind.config.js:38,Medium,Open
P2,Polish,Card shadow inconsistent,src/components/NoticeCard.tsx:67,Small,Open
```

---

## 🎯 Audit Scope

The agent will comprehensively evaluate:

### User Journeys
1. **Homepage & Discovery** - Hero, search, filters, testimonials
2. **Notice Search & Browse** - Results grid, map view, pagination
3. **Notice Detail Page** - Full notice, applicant details, map, representation form
4. **Publish Wizard** - All 4 steps (Type → Upload → Details → Review)
5. **Council Dashboard** - Stats, drafts, analytics, team management
6. **Responsive Behavior** - Mobile (375px), Tablet (768px), Desktop (1280px+)

### Evaluation Criteria
- **Visual Design**: Typography, color, spacing, components, polish, animations
- **User Experience**: Navigation, forms, search, loading/error/empty states, wizard flow
- **Accessibility**: WCAG 2.1 AA compliance, keyboard nav, screen readers, contrast
- **Responsive Design**: Mobile-first, touch targets, no overflow, readable text
- **Component Consistency**: Buttons, forms, cards, icons, typography
- **Performance**: Loading indicators, image optimization, smooth interactions

---

## 📈 Grading Scale

| Grade | Score | Description | Action |
|-------|-------|-------------|--------|
| **A+** | 95-100 | Stripe-level, production-ready | Maintain quality, minor tweaks |
| **A** | 90-94 | Excellent, minor polish needed | Address P2/P3 issues for perfection |
| **B** | 80-89 | Good, address P1 issues before launch | Fix P1 issues this sprint |
| **C** | 70-79 | Functional but needs improvements | Plan UX improvements, fix P0/P1 |
| **D** | 60-69 | Significant issues | Major UX overhaul needed |
| **F** | <60 | Not ready for public launch | Redesign required |

---

## 🔧 Priority Levels

### P0 - Critical (Fix Immediately)
- **Blocks users** from completing core tasks
- **WCAG A violations** (accessibility showstoppers)
- **Legal/compliance risk** (statutory notices)
- **Data loss** possible

**Examples**:
- Form submit button doesn't work
- Text contrast below 3:1 (unreadable)
- Keyboard trap prevents navigation
- Missing required legal fields

### P1 - High (Fix Before Next Release)
- **Major UX friction** that frustrates users
- **WCAG AA violations** (accessibility issues)
- **Brand inconsistency** that undermines trust
- **Confusing workflows** that increase support burden

**Examples**:
- Error messages generic ("Error occurred")
- Missing focus indicators on form fields
- Mobile menu doesn't trap focus
- Broken responsive layout at 375px

### P2 - Medium (Plan for Next Sprint)
- **Minor UX friction** that slows users down
- **Inconsistent styling** across components
- **Missing micro-interactions** (hover, transitions)
- **Polish items** that improve perceived quality

**Examples**:
- Button hover state missing
- Card shadows inconsistent
- No empty state illustration
- Loading spinner too small

### P3 - Low (Backlog)
- **Nice-to-have** enhancements
- **Advanced features** for power users
- **Minor polish** items

**Examples**:
- Smoother animation curves
- Additional loading state for edge case
- Decorative illustrations
- Tooltip improvements

---

## 🛠️ Integration Workflow

### 1. Schedule Regular Audits
- **Monthly**: Quick audit of new features (20 min)
- **Quarterly**: Standard audit of entire platform (45 min)
- **Major releases**: Comprehensive audit (90 min)
- **Pre-certification**: External + automated audit

### 2. Create Tracking Issues
```bash
# From audit report CSV
gh issue create \
  --title "P0: Submit button lacks loading state" \
  --body "**Location**: src/pages/publish/step-3.tsx:142\n**Impact**: Users think form isn't working\n**Fix**: Add spinner and disabled state\n\nSee audit-report/DETAILED_AUDIT.md#forms" \
  --label "bug,accessibility,P0" \
  --assignee @me
```

### 3. Update Design System
```typescript
// For consistency issues, create shared constants
// src/styles/design-tokens.ts
export const FOCUS_RING_CLASSES = 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2';
export const CARD_SHADOW_CLASSES = 'shadow-lg hover:shadow-xl transition-shadow';

// Use throughout codebase
<button className={`${btnPrimary} ${FOCUS_RING_CLASSES}`}>
```

### 4. Add to CI/CD
```yaml
# .github/workflows/ux-audit.yml
name: UX Audit
on: [pull_request]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run dev &
      - run: npx playwright test e2e/ux-audit/accessibility.spec.ts
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: a11y-violations
          path: playwright-report/
```

---

## 💡 Pro Tips

### Before Running Audit
1. **Seed test data** - Ensure there are notices, councils, and users in the database
2. **Clear cache** - Start with a fresh browser state
3. **Stable environment** - Dev server running smoothly, no unrelated errors
4. **Test credentials** - Have council and firm test accounts ready if auditing dashboards

### Interpreting Results
- **Start with P0 issues** - These block users or have legal implications
- **Don't overwhelm** - Focus on top 10-20 issues, not every minor finding
- **Context matters** - Some "violations" are intentional (e.g., decorative images)
- **Benchmark progress** - Track grade over time (B → A- → A → A+)

### Improving Your Score
- **Quick wins**: Fix contrast, add focus indicators, improve error messages (P1 → A grade)
- **Medium effort**: Responsive layout fixes, consistent components (P2 → A+ grade)
- **Long-term**: Design system maturity, comprehensive loading states, micro-interactions (A+ sustained)

---

## 📚 Reference Materials

### Standards & Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [GDS Design System](https://design-system.service.gov.uk/)
- [Stripe Design Resources](https://stripe.com/docs/design)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Tools
- **Lighthouse**: Chrome DevTools → Run audit
- **axe DevTools**: [Browser extension](https://www.deque.com/axe/devtools/)
- **WAVE**: [Browser extension](https://wave.webaim.org/extension/)
- **Contrast Checker**: [WebAIM](https://webaim.org/resources/contrastchecker/)
- **Pa11y**: [CLI tool](https://pa11y.org/)

### Testing
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [Testing Library](https://testing-library.com/docs/queries/about)

---

## 🤝 Contributing

### Adding New Test Templates
1. Create new template in `playwright-test-templates.md`
2. Follow existing structure (describe, beforeEach, tests)
3. Use helper functions from `helpers.ts`
4. Add to table of contents

### Improving the Checklist
1. Add new checkboxes to `ux-audit-checklist.md`
2. Keep items specific and actionable
3. Group by category (Visual, UX, A11y, Responsive, etc.)

### Updating the Agent
1. Edit `civic-ux-audit-agent.md`
2. Test changes by running a full audit
3. Verify outputs match expectations
4. Update related docs (README, checklist)

---

## 🐛 Troubleshooting

### Agent Takes Too Long
- Request "quick audit" instead of "comprehensive"
- Limit scope: "Focus only on homepage and wizard"
- Skip screenshots: "Skip screenshot generation"

### Playwright Tests Fail
- Ensure dev server running: `npm run dev`
- Check ports: `lsof -ti tcp:5173` and `lsof -ti tcp:5174`
- Update selectors if UI changed: `[data-testid="..."]`
- Check for console errors: `page.on('console', msg => console.log(msg))`

### False Positives
- Review context: Decorative images correctly have `alt=""`
- Provide feedback: "The empty alt on line 245 is correct, not an issue"
- Adjust axe rules: `withTags(['wcag2aa'])` or `.disableRules(['image-alt'])`

### Missing Coverage
- Agent didn't test authenticated pages by default
- Explicitly request: "Also audit /council/dashboard using test credentials"
- Provide login flow: "Use email: test@council.gov.uk, password: testpass123"

---

## 📞 Support

### Questions?
- Check `README-UX-AUDIT.md` for detailed guidance
- Review `ux-audit-checklist.md` for specific criteria
- Examine `playwright-test-templates.md` for test examples

### Issues?
- File GitHub issue: "UX Audit Agent: [describe problem]"
- Include: What you asked, what you expected, what happened
- Attach: Screenshots, console logs, audit report snippet

### Suggestions?
- File GitHub issue: "UX Audit Enhancement: [describe improvement]"
- Propose: New test templates, checklist items, evaluation criteria

---

## 📄 License

This agent specification is part of the Civic Notices project. Use, modify, and adapt as needed for your platform auditing needs.

---

## ✅ Ready to Start?

Choose your path:

1. **Automated Audit**: Invoke `@civic-ux-audit-agent` in Claude Code
2. **Manual Audit**: Open `ux-audit-checklist.md` and navigate the site
3. **Playwright Tests**: Copy templates from `playwright-test-templates.md` and run

Happy auditing! 🚀
