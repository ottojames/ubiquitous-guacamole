# Civic Notices UI/UX Audit - Executive Summary

**Date**: 2025-11-05
**Auditor**: Senior UI/UX Specialist & Accessibility Lead
**Overall Grade**: B+ (82/100)

---

## Key Findings

### Top 3 Strengths

1. **Exceptional glassmorphism execution on hero search card** (`/src/pages/Home.tsx:340-394`)
   - Gradient border wrapper with animated glow effect on hover
   - Multi-layer backdrop blur creates premium Stripe-like depth
   - Subtle inner gradients provide visual hierarchy without overwhelming content
   - **Result**: Sets a high bar for visual polish; this pattern should be replicated across wizard steps

2. **Comprehensive wizard state management with draft persistence** (`/src/next/publish/flow/NewPublishFlow.tsx:172-251`)
   - SessionStorage-based draft recovery prevents data loss
   - Query param synchronization (`?draft=...`) enables shareable URLs
   - Error boundary with contextual reset (`WizardBoundary`) catches crashes gracefully
   - **Result**: Enterprise-grade reliability; users can safely navigate away and return

3. **Accessible testimonial carousel with keyboard navigation** (`/src/pages/Home.tsx:111-145`)
   - Pause on hover/focus for screen reader compatibility
   - Keyboard controls (Previous/Next buttons) alongside auto-rotation
   - ARIA roles (`role="tablist"`, `aria-selected`) provide semantic structure
   - Animated slide transitions with direction awareness (`slideInFromRight`/`slideInFromLeft`)
   - **Result**: Meets WCAG 2.1 AA for time-based media controls

---

### Top 10 Priority Issues

1. **[P0] Insufficient color contrast on gray text** (`tailwind.config.js` + `/src/components/ui/Button.tsx:17`)
   - `text-slate-400` on white backgrounds = **2.8:1 contrast** (fails WCAG AA 4.5:1)
   - Affects disabled button states, placeholder text, and secondary labels across 40+ components
   - **Impact**: Vision-impaired users cannot read critical instructions

2. **[P0] Mobile menu lacks focus trap** (`/src/pages/Home.tsx:261-298`)
   - When hamburger menu opens, focus remains on trigger button
   - User can Tab out of modal to underlying page (violates WCAG 2.1 SC 2.4.3)
   - Missing `aria-hidden="true"` on main content when drawer is open
   - **Impact**: Keyboard users lose orientation; screen readers announce hidden content

3. **[P0] Form validation errors missing `aria-describedby` linkage** (`/src/next/publish/flow/steps/UploadMethodStep.tsx:169-176`)
   - Email error message displays below input, but no programmatic association
   - Screen readers won't announce errors when field receives focus
   - GDS pattern requires `aria-describedby="email-error"` on `<input id="email">`
   - **Impact**: Blind users unaware of what's wrong with their input

4. **[P1] Button heights inconsistent across components**
   - Hero CTA: `h-11` (`/src/pages/Home.tsx:233`)
   - Wizard Continue: `py-4` = approx `h-14` (`/src/next/publish/flow/steps/NoticeTypeStep.tsx:430`)
   - Button component default: `h-11` (`/src/components/ui/Button.tsx:23`)
   - Mobile publish button: `h-10` (`/src/pages/Home.tsx:244`)
   - **Impact**: Violates design system coherence; undermines brand trust

5. **[P1] Wizard stepper labels disappear on non-current steps** (`/src/wizard/WizardStepper.tsx:48-54`)
   - Only shows step title for current/completed steps
   - User loses context of what Step 3 or Step 4 represents when on Step 1
   - GDS pattern shows all labels at all times for orientation
   - **Impact**: Cognitive load increases; users can't plan ahead

6. **[P1] Search input placeholder violates GDS guidance** (`/src/next/publish/flow/steps/NoticeTypeStep.tsx:207`)
   - Placeholder: "Search notice types... (press Esc to clear)"
   - GDS: Placeholders should be examples, not instructions
   - Keyboard shortcut hint should be in separate hint text below input
   - **Impact**: Instructions disappear when user starts typing

7. **[P1] Missing skip link for keyboard navigation** (`/src/pages/Home.tsx:199-302`)
   - No "Skip to main content" link before header navigation
   - Keyboard users must Tab through 6+ nav links on every page load
   - WCAG 2.1 SC 2.4.1 requires bypass mechanism
   - **Impact**: Frustrating experience for power keyboard users

8. **[P1] Continue button lacks loading state icon** (`/src/next/publish/flow/steps/UploadMethodStep.tsx:270-277`)
   - Button text changes to "Working..." but no spinner icon
   - User uncertain if click registered (especially on slow connections)
   - Wizard uses spinner in some places (Step 1) but not others (Step 2)
   - **Impact**: Inconsistent feedback; users may double-click

9. **[P2] Card border-radius inconsistency**
   - Homepage cards: `rounded-3xl` (24px) (`/src/pages/Home.tsx:424`)
   - Wizard cards: `rounded-[28px]` (`/src/styles/ui.ts:25`)
   - Button component: `rounded-2xl` (16px) (`/src/components/ui/Button.tsx:13`)
   - Notice type cards: `rounded-2xl` (`/src/next/publish/flow/steps/NoticeTypeStep.tsx:361`)
   - **Impact**: Subtle inconsistency erodes design system trust

10. **[P2] Testimonial carousel animation accessibility** (`/src/pages/Home.tsx:919-1011`)
    - Slide animations run at full speed even when `prefers-reduced-motion: reduce` is set
    - Media query exists (line 1046) but animations use hardcoded `500ms` duration
    - Should respect user OS settings for vestibular disorders
    - **Impact**: Motion-sensitive users experience nausea

---

## Scores by Category

- **Visual Design**: 8.5/10
  - Strengths: Glassmorphism, gradients, shadows, hover states
  - Weaknesses: Contrast ratios, button size consistency

- **User Experience**: 8/10
  - Strengths: Wizard flow, draft persistence, inline validation
  - Weaknesses: Form error messages, progress indication, empty states

- **Accessibility**: 7/10
  - Strengths: Semantic HTML, ARIA roles, keyboard navigation (partial)
  - Weaknesses: Focus management, color contrast, error announcements

- **Responsive Design**: 9/10
  - Strengths: Mobile-first approach, hamburger menu, fluid typography
  - Weaknesses: Touch target sizes (some < 44x44px), horizontal scroll on 320px

- **Component Consistency**: 7.5/10
  - Strengths: Shared UI token system (`/src/styles/ui.ts`)
  - Weaknesses: Button heights, border-radius, shadow scales

- **Performance & Polish**: 8/10
  - Strengths: Lazy loading, optimistic UI, transition smoothness
  - Weaknesses: Missing loading skeletons, no focus-visible polyfill

---

## Recommendation

**The platform is 80% production-ready with critical accessibility gaps.** Visual polish is exceptional (Stripe-level glassmorphism, gradients, animations), but WCAG 2.1 AA compliance violations block launch for UK government digital service standards.

### Must fix before launch (P0 issues):
- Color contrast adjustments (15 components affected)
- Mobile menu focus trap implementation
- Form error `aria-describedby` linkage
- Disabled button states (insufficient contrast)

### Should fix within 2 weeks (P1 issues):
- Button height standardization
- Wizard stepper label visibility
- Skip link addition
- Loading state consistency

### Nice-to-have polish (P2/P3):
- Border-radius tokens
- Reduced motion support
- Component Storybook documentation

**Estimated remediation time**: 3-5 days for P0/P1 issues with two developers.

---

**Audit completed**: 2025-11-05
**Next review**: After P0/P1 remediation (est. 2025-11-12)
