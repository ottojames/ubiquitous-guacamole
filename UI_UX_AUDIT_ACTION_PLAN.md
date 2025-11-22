# UI/UX Audit Action Plan

**Date**: 2025-11-05
**Audit Grade**: B+ (82/100)
**Target Grade**: A (95+/100)
**Timeline**: 2 weeks (10 working days)

---

## Immediate Actions (This Week - P0 Issues)

### Day 1-2: Accessibility Critical Fixes

#### Task 1.1: Fix Color Contrast Ratios (3 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/components/ui/Button.tsx`
- `/tailwind.config.js`

**Steps**:
1. Update disabled button styles from `text-slate-400` to `text-slate-600`
2. Change opacity from `0.6` to `0.8` to maintain visual "disabled" appearance
3. Add `cursor-not-allowed` for UX clarity
4. Run axe-core scan to verify 4.5:1 contrast achieved
5. Update placeholder text colors across form inputs

```tsx
// Before
disabled:pointer-events-none disabled:opacity-60

// After
disabled:pointer-events-none
disabled:bg-slate-100
disabled:text-slate-600
disabled:opacity-80
disabled:cursor-not-allowed
```

**Validation**: Run Playwright test `e2e/accessibility/color-contrast.spec.ts`

---

#### Task 1.2: Implement Mobile Menu Focus Trap (6 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/pages/Home.tsx:261-298`
- `package.json` (add `focus-trap-react`)

**Steps**:
1. Install `focus-trap-react`: `npm install focus-trap-react`
2. Wrap mobile menu in `<FocusTrap>` component
3. Add `useRef` for close button and focus it on open
4. Add `useEffect` to set `aria-hidden="true"` on `<main>` when modal open
5. Test Escape key closes menu and restores focus to hamburger button

```tsx
import FocusTrap from 'focus-trap-react';

{mobileOpen && (
  <FocusTrap>
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  </FocusTrap>
)}
```

**Validation**: Run Playwright test `e2e/accessibility/focus-management.spec.ts`

---

#### Task 1.3: Add aria-describedby to Form Errors (2 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/next/publish/flow/steps/UploadMethodStep.tsx:154-176`
- All form components with validation (grep for `{.*Error &&`)

**Steps**:
1. Add unique `id` to error message elements (e.g., `id="email-error"`)
2. Add `aria-describedby` to inputs when error exists
3. Add `aria-invalid="true"` to inputs when error exists
4. Add `role="alert"` to error message containers
5. Test with NVDA/VoiceOver screen reader

```tsx
<input
  id="email"
  aria-invalid={emailError ? "true" : undefined}
  aria-describedby={emailError ? "email-error" : undefined}
  ...
/>
{emailError && (
  <p id="email-error" role="alert" className="...">
    {emailError}
  </p>
)}
```

**Validation**: Run Playwright test `e2e/accessibility/form-errors.spec.ts`

---

### Day 3: Launch-Blocking Verification

#### Task 3.1: Run Full Accessibility Audit
**Owner**: QA Lead
**Tools**: axe DevTools, WAVE, Lighthouse

**Checklist**:
- [ ] All pages pass axe-core scan (0 violations)
- [ ] WAVE reports 0 errors (warnings acceptable)
- [ ] Lighthouse Accessibility score e 95
- [ ] Manual keyboard navigation test (no Tab traps)
- [ ] Screen reader test (NVDA on Windows, VoiceOver on Mac)

---

## Short-Term Improvements (Week 2 - P1 Issues)

### Day 4-5: Component Standardization

#### Task 4.1: Standardize Button Heights (8 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/components/ui/Button.tsx`
- `/src/pages/Home.tsx`
- `/src/next/publish/flow/steps/*.tsx`

**Steps**:
1. Define semantic size tokens in `Button.tsx`:
   - `sm`: `h-9` (36px) - Compact actions
   - `default`: `h-11` (44px) - Standard buttons
   - `lg`: `h-14` (56px) - Hero CTAs only
2. Replace all inline `h-*` and `py-*` classes with size prop
3. Update Storybook documentation (if exists)

**Migration Pattern**:
```tsx
// Before
<button className="... h-11 py-0 ...">Continue</button>

// After
<Button size="lg">Continue</Button>
```

**Validation**: Run Playwright test `e2e/visual/component-consistency.spec.ts`

---

#### Task 4.2: Fix Wizard Stepper Label Visibility (2 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/wizard/WizardStepper.tsx:48-54`

**Steps**:
1. Remove conditional rendering of step labels
2. Always show labels with opacity variation for inactive states:
   - Current: `text-white` (100% opacity)
   - Completed: `text-white/80` (80% opacity)
   - Upcoming: `text-white/60` (60% opacity)
3. Test on all wizard steps

**Code Change**:
```tsx
// Remove this condition
{(isCurrent || isCompleted) && (
  <span className="text-xs font-semibold">{step.title}</span>
)}

// Replace with
<span className={`text-xs font-semibold ${
  isCurrent ? "text-white" : isCompleted ? "text-white/80" : "text-white/60"
}`}>
  {step.title}
</span>
```

**Validation**: Run Playwright test `e2e/ux/wizard-stepper.spec.ts`

---

### Day 6-7: UX Polish

#### Task 6.1: Add Skip Link (3 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/pages/Home.tsx` (and all other pages)
- `/tailwind.config.js`

**Steps**:
1. Add `.sr-only` utility to Tailwind config
2. Insert skip link before `<header>` on every page
3. Add `id="main-content"` to `<main>` element
4. Style focus state (blue button with shadow)

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-xl focus:bg-blue-600 focus:px-6 focus:py-3 focus:text-white focus:font-semibold"
>
  Skip to main content
</a>
```

**Validation**: Run Playwright test `e2e/accessibility/keyboard-navigation.spec.ts`

---

#### Task 6.2: Consistent Loading States (6 hours)
**Owner**: Frontend Developer
**Files**:
- Create `/src/components/ui/LoadingButton.tsx`
- Update all wizard step Continue buttons

**Steps**:
1. Extract shared `LoadingButton` component with spinner icon
2. Replace all Continue button implementations
3. Ensure spinner shows on all steps (Step 1, 2, 3, 4)

```tsx
// src/components/ui/LoadingButton.tsx
import { Spinner } from '@/components/ui/Spinner';
import { Button, type ButtonProps } from '@/components/ui/Button';

export function LoadingButton({
  loading,
  children,
  ...props
}: ButtonProps & { loading?: boolean }) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <>
          <Spinner className="h-5 w-5" />
          Processing...
        </>
      ) : children}
    </Button>
  );
}
```

**Validation**: Run Playwright test `e2e/ux/loading-states.spec.ts`

---

#### Task 6.3: Fix Search Placeholder Pattern (2 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/next/publish/flow/steps/NoticeTypeStep.tsx:207`

**Steps**:
1. Move "press Esc to clear" hint to persistent hint text below label
2. Change placeholder to example: "e.g., premises licence variation"
3. Style keyboard shortcut with `<kbd>` element

```tsx
<label htmlFor="notice-search" className="block text-sm font-semibold text-slate-900 mb-2">
  Search notice types
</label>
<div className="text-xs text-slate-600 mb-2">
  Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[11px]">Esc</kbd> to clear
</div>
<input
  id="notice-search"
  placeholder="e.g., premises licence variation"
  ...
/>
```

**Validation**: Manual GDS pattern review

---

#### Task 6.4: Increase Touch Target Sizes (4 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/wizard/WizardStepper.tsx:29`
- `/src/pages/Home.tsx:516-519`

**Steps**:
1. Add invisible padding layer to wizard stepper circles
2. Increase testimonial dot sizes (or add padding)
3. Test on physical mobile device (iPhone, Android)

**Validation**: Run Playwright test `e2e/responsive/touch-targets.spec.ts`

---

## Medium-Term Polish (Week 3+ - P2/P3 Issues)

### Task 7.1: Semantic Border Radius Tokens (5 hours)
**Owner**: Frontend Developer
**Files**:
- `/tailwind.config.js`
- All card components

**Steps**:
1. Define tokens: `card` (16px), `card-lg` (24px), `card-xl` (28px)
2. Replace inline `rounded-*` classes
3. Document usage guidelines

---

### Task 7.2: Reduced Motion Support (6 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/pages/Home.tsx:919-1011` (testimonial carousel)
- Create `usePrefersReducedMotion()` hook

**Steps**:
1. Create hook to detect `prefers-reduced-motion` media query
2. Pass reduced duration (10ms) to animation timeouts
3. Test with OS settings enabled (macOS: System Preferences ’ Accessibility ’ Display ’ Reduce motion)

---

### Task 7.3: Horizontal Scroll Fix (2 hours)
**Owner**: Frontend Developer
**Files**:
- `/src/next/publish/flow/steps/NoticeTypeStep.tsx:176-256`

**Steps**:
1. Change padding from `p-8` to `p-4 sm:p-8 md:p-12`
2. Test at 320px viewport

**Validation**: Run Playwright test `e2e/responsive/viewport-constraints.spec.ts`

---

### Task 7.4: Empty State Improvements (3 hours)
**Owner**: UX Designer + Frontend Developer
**Files**:
- `/src/next/publish/flow/steps/NoticeTypeStep.tsx:302-328`

**Steps**:
1. Add suggested search links (premises, planning, traffic)
2. Provide clear CTAs (clear search button)

---

## Testing & QA Timeline

### Week 1 (P0 fixes)
- **Day 3**: Manual accessibility audit (keyboard + screen reader)
- **Day 3**: Run axe DevTools, WAVE, Lighthouse
- **Day 3**: Playwright accessibility test suite

### Week 2 (P1 fixes)
- **Day 8**: Visual regression testing (Percy/Chromatic)
- **Day 8**: Responsive design testing (BrowserStack)
- **Day 8**: Playwright UX test suite

### Week 3 (Final verification)
- **Day 15**: Full regression test
- **Day 15**: User acceptance testing (5 users)
- **Day 15**: Sign-off from accessibility consultant

---

## Success Metrics

### Accessibility Compliance
- [ ] axe-core violations: 0
- [ ] WAVE errors: 0
- [ ] Lighthouse Accessibility score: e95
- [ ] Keyboard navigation: 100% operable
- [ ] Screen reader compatibility: NVDA, JAWS, VoiceOver

### Component Consistency
- [ ] Button heights: 3 sizes only (sm, default, lg)
- [ ] Border radius: 4 tokens only (card, card-lg, card-xl, pill)
- [ ] Loading states: Consistent spinner across all CTAs

### Responsive Design
- [ ] No horizontal scroll at 320px viewport
- [ ] Touch targets: e44x44px on mobile
- [ ] Text readability: e14px on mobile, e16px on desktop

### User Experience
- [ ] Wizard completion rate: e85% (from Step 1 to Step 4)
- [ ] Form error recovery rate: e90%
- [ ] Mobile task completion time: d Desktop +30%

---

## Risk Mitigation

### Risk 1: Breaking Changes to Wizard Flow
**Mitigation**:
- Feature flag all changes behind `ENABLE_UX_IMPROVEMENTS` env var
- Run A/B test with 10% of users before full rollout
- Monitor error rates and bounce rates in analytics

### Risk 2: Timeline Slippage
**Mitigation**:
- Prioritize P0 issues only for Week 1 deadline
- P1 issues can slip to Week 3 if necessary
- P2/P3 issues postponed to next sprint if needed

### Risk 3: Browser Compatibility Issues
**Mitigation**:
- Test focus trap on Safari 14+ (known issues with focus management)
- Test reduced motion hook on Firefox (different media query behavior)
- Use BrowserStack for IE11 compatibility (if required)

---

## Communication Plan

### Stakeholder Updates
- **Daily**: Slack standups in #frontend channel
- **Weekly**: Demo recording sent to product team (Loom video)
- **Bi-weekly**: Accessibility compliance report to legal/compliance team

### Documentation
- **Component Updates**: Update Storybook with new size props
- **Pattern Library**: Document GDS-compliant form patterns
- **ADR**: Architectural Decision Record for focus trap implementation

---

## Definition of Done

### P0 Issues (Launch Blockers)
- [ ] Code reviewed and merged to main
- [ ] Playwright tests passing in CI
- [ ] Manual accessibility audit sign-off
- [ ] QA approval in staging environment
- [ ] Product owner acceptance

### P1 Issues (High Priority)
- [ ] Code reviewed and merged
- [ ] Visual regression tests passing
- [ ] Design system documentation updated
- [ ] QA approval

### P2/P3 Issues (Nice-to-Have)
- [ ] Code reviewed
- [ ] No regressions introduced
- [ ] User testing feedback positive

---

**Plan Owner**: Frontend Tech Lead
**Next Review**: 2025-11-08 (End of Week 1)
**Final Deadline**: 2025-11-19 (End of Week 2)
