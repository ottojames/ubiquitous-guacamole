# UI/UX Audit Checklist

Quick reference checklist for auditing the Civic Notices platform. Use this when running manual reviews or as a guide for the automated agent.

---

## ✅ Visual Design

### Typography
- [ ] Consistent font family (Inter) across all pages
- [ ] Clear heading hierarchy (h1 > h2 > h3...)
- [ ] Base body text is minimum 16px
- [ ] Line height appropriate (1.5-1.8 for body text)
- [ ] Letter spacing on headings (-0.5px for tight tracking)
- [ ] No orphaned or widowed text in key messaging

### Color System
- [ ] All colors use Tailwind design tokens (no hardcoded hex)
- [ ] Primary blue (#5687EB) used consistently for CTAs
- [ ] Brand navy (#223266) for authority/trust elements
- [ ] Semantic colors: green (success), red (error), amber (warning)
- [ ] All text meets WCAG AA contrast ratios:
  - [ ] Normal text: 4.5:1 minimum
  - [ ] Large text (18px+): 3:1 minimum
  - [ ] UI components: 3:1 minimum
- [ ] Dark mode support (if applicable)

### Spacing & Layout
- [ ] Consistent padding/margin scale (multiples of 4px)
- [ ] Adequate white space around interactive elements
- [ ] Content max-width for readability (640px-768px for prose)
- [ ] Consistent container widths
- [ ] Grid alignment on cards/sections
- [ ] No awkward gaps or overlaps

### Components
- [ ] Buttons:
  - [ ] Primary variant stands out
  - [ ] Secondary/ghost variants clear hierarchy
  - [ ] Consistent height (h-9, h-11)
  - [ ] Adequate padding (px-4, px-6)
  - [ ] Loading states with spinner
  - [ ] Disabled states visually distinct
  - [ ] Hover effects smooth
- [ ] Form Inputs:
  - [ ] Consistent border style
  - [ ] Clear focus state (ring-2)
  - [ ] Error state (red border + message)
  - [ ] Disabled state (opacity, cursor)
- [ ] Cards:
  - [ ] Consistent border-radius (rounded-2xl or rounded-3xl)
  - [ ] Consistent shadow depth
  - [ ] Hover effects (translate-y, scale, shadow)
- [ ] Badges/Pills:
  - [ ] Consistent sizing
  - [ ] Color-coded meaningfully

### Visual Polish
- [ ] Subtle gradients enhance depth (not garish)
- [ ] Shadows appropriate for elevation
- [ ] Border radius consistent across similar components
- [ ] Glassmorphism effects used sparingly and effectively
- [ ] Icons consistent stroke-width (2px Lucide)
- [ ] Images optimized and lazy-loaded
- [ ] Smooth transitions (0.2s ease)

### Animations
- [ ] Hover states transition smoothly
- [ ] Loading indicators (shimmer, spinner)
- [ ] Skeleton screens for async content
- [ ] Page transitions subtle, not distracting
- [ ] Respects `prefers-reduced-motion`
- [ ] No jank during scroll/interactions
- [ ] Animations serve a purpose (not decorative only)

---

## ✅ User Experience

### Navigation
- [ ] Clear site structure (homepage → search → detail)
- [ ] Breadcrumbs on nested pages
- [ ] Back button works as expected
- [ ] Current page/step indicated visually
- [ ] Mobile hamburger menu works
  - [ ] Opens smoothly
  - [ ] Closes on selection or outside click
  - [ ] Escape key closes
  - [ ] Focus trapped inside when open

### Search & Discovery
- [ ] Address search provides instant feedback
- [ ] Autocomplete dropdown responsive (<300ms)
- [ ] Clear indication of loading state
- [ ] Search results display clearly
- [ ] No results message helpful ("Try a different postcode")
- [ ] Filters intuitive (checkboxes, dropdowns)
- [ ] Search query persists in URL
- [ ] Can clear/reset search easily

### Forms
- [ ] Clear field labels
- [ ] Required fields marked (asterisk or "Required")
- [ ] Inline help text where needed
- [ ] Validation on blur (not just submit)
- [ ] Error messages:
  - [ ] Specific ("Email address is required", not "Invalid input")
  - [ ] Actionable ("Must be 8+ characters")
  - [ ] Positioned near field
  - [ ] Announced to screen readers
- [ ] Success feedback after submission
- [ ] Submit button disabled during processing
- [ ] Form state persists on navigation (wizard draft)
- [ ] Autocomplete attributes for browser autofill

### Map Interactions
- [ ] Map loads quickly (<2s)
- [ ] Loading spinner visible
- [ ] Clusters expand on click
- [ ] Popup content clear
- [ ] Zoom controls work
- [ ] Pan gestures smooth
- [ ] Mobile pinch-to-zoom
- [ ] Keyboard navigation (arrow keys, +/-)
- [ ] Legend/key if needed

### Wizard Flow (Publish)
- [ ] Progress stepper always visible
- [ ] Current step highlighted
- [ ] Can navigate back without losing data
- [ ] Draft persisted (sessionStorage)
- [ ] Validation prevents advancing with errors
- [ ] Review step shows all data
- [ ] Confirmation modal after submission
- [ ] Success state clear with next steps

### Loading States
- [ ] Skeleton screens for slow content
- [ ] Spinners appropriate size and placement
- [ ] Loading text descriptive ("Loading notices...")
- [ ] Progress bars for long operations
- [ ] Optimistic UI updates where possible
- [ ] No layout shift when content loads

### Error States
- [ ] Error boundaries catch crashes
- [ ] Helpful error messages (not "Error 500")
- [ ] Retry button where appropriate
- [ ] Errors logged (console/monitoring)
- [ ] User not blocked by errors
- [ ] Toast notifications for non-critical errors

### Empty States
- [ ] Clear messaging ("No drafts yet")
- [ ] Helpful CTA ("Create your first notice")
- [ ] Illustration or icon
- [ ] Not just blank white space
- [ ] Suggests next action

### Trust & Credibility
- [ ] Professional appearance throughout
- [ ] Testimonials visible on homepage
- [ ] Social proof (council logos)
- [ ] Error states don't erode confidence
- [ ] Legal/compliance indicators clear
- [ ] Proof of publication downloadable

---

## ✅ Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Tab order follows visual flow
- [ ] Focus visible on all elements
- [ ] Skip to main content link
- [ ] Escape closes modals/dropdowns
- [ ] Enter/Space activate buttons
- [ ] Arrow keys navigate within widgets (e.g., combobox)
- [ ] No keyboard traps (except intended, like modals)

### Screen Reader Support
- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`)
- [ ] Page title describes content
- [ ] Headings hierarchical (h1 → h2 → h3, no skipping)
- [ ] ARIA labels where needed:
  - [ ] `aria-label` for icon-only buttons
  - [ ] `aria-labelledby` for sections
  - [ ] `aria-describedby` for help text
- [ ] ARIA roles where needed:
  - [ ] `role="dialog"` for modals
  - [ ] `role="alert"` for errors
  - [ ] `role="status"` for toasts
  - [ ] `role="tablist"` for tabs
- [ ] ARIA states dynamic:
  - [ ] `aria-expanded` on collapsible
  - [ ] `aria-selected` on tabs
  - [ ] `aria-checked` on checkboxes
  - [ ] `aria-disabled` on disabled elements
- [ ] Form labels associated (`<label for="">` or `aria-labelledby`)
- [ ] Image alt text:
  - [ ] Descriptive for content images
  - [ ] Empty (`alt=""`) for decorative
- [ ] Link text descriptive ("Read more about licensing" not "Click here")
- [ ] Live regions for dynamic content (`aria-live="polite"`)

### Visual Accessibility
- [ ] Color not sole indicator (e.g., error has icon + color)
- [ ] Contrast ratios meet WCAG AA:
  - [ ] Text: 4.5:1 (normal), 3:1 (large 18px+)
  - [ ] UI components: 3:1
  - [ ] Focus indicators: 3:1
- [ ] Focus indicators visible:
  - [ ] Not `outline: none` without replacement
  - [ ] Ring or underline visible against background
- [ ] Text resizable to 200% without loss of functionality
- [ ] No horizontal scrolling at 320px width (except data tables)
- [ ] Target sizes minimum 44x44px (mobile)
- [ ] Forms don't rely on placeholder text alone

### Motion & Animation
- [ ] `prefers-reduced-motion` respected:
  - [ ] Animations disabled or reduced
  - [ ] Transitions instant
- [ ] Auto-playing carousels have pause button
- [ ] Animations not essential to understanding
- [ ] No flashing content (>3 flashes/sec)

### Other
- [ ] Language declared (`<html lang="en">`)
- [ ] Page title unique and descriptive
- [ ] Form errors announced to screen readers
- [ ] Focus not moved unexpectedly
- [ ] Timeout warnings given (if applicable)

---

## ✅ Responsive Design

### Mobile (375px - 767px)
- [ ] No horizontal scrolling
- [ ] Touch targets minimum 44x44px
- [ ] Text readable (no tiny fonts <14px)
- [ ] Navigation via hamburger menu
- [ ] Forms stack vertically
- [ ] Cards full-width or 2-column
- [ ] Images scale appropriately
- [ ] Map usable on small screen
- [ ] Tables responsive (horizontal scroll or card layout)
- [ ] Modals/sheets use full screen

### Tablet (768px - 1023px)
- [ ] Layout adapts (often 2-column grid)
- [ ] Navigation visible or collapsible
- [ ] Touch targets generous
- [ ] Portrait and landscape tested

### Desktop (1024px+)
- [ ] Multi-column layouts where appropriate
- [ ] Content max-width prevents overly wide text
- [ ] Hover states visible
- [ ] Sidebar navigation if applicable
- [ ] Map expands with viewport

### Large Screens (1440px+)
- [ ] Content doesn't stretch awkwardly
- [ ] Hero sections scale gracefully
- [ ] Images don't pixelate
- [ ] No excessive white space

---

## ✅ Component Consistency

### Buttons
- [ ] All use shared styles from `src/styles/ui.ts` or `src/components/ui/button.tsx`
- [ ] No one-off button styles
- [ ] Variants clear: primary, secondary, ghost, destructive

### Form Fields
- [ ] Consistent label positioning (top)
- [ ] Consistent error message styling (red text below field)
- [ ] Shared input component used
- [ ] Consistent focus ring

### Cards
- [ ] Consistent shadow (`shadow-lg`, `shadow-xl`, `shadow-card`)
- [ ] Consistent border-radius (`rounded-2xl`, `rounded-3xl`)
- [ ] Consistent padding (`p-6`, `p-8`)
- [ ] Hover effects applied uniformly

### Icons
- [ ] All from Lucide React
- [ ] Consistent sizing (`h-5 w-5`, `h-6 w-6`)
- [ ] Consistent color application

### Typography
- [ ] Heading classes reused
- [ ] Body text consistent
- [ ] Link styles consistent (underline on hover)

### Spacing
- [ ] Sections use consistent vertical spacing (`py-16`, `py-24`, `py-32`)
- [ ] Containers consistent (`max-w-6xl`, `max-w-7xl`)

---

## ✅ Performance & Perceived Performance

### Loading
- [ ] Skeleton screens appear immediately
- [ ] Progress bars for long operations (>2s)
- [ ] Spinners appropriate size
- [ ] Loading text helpful

### Images
- [ ] Lazy loading (`loading="lazy"`)
- [ ] WebP with fallbacks
- [ ] Sized correctly for context
- [ ] Alt text present

### Interactions
- [ ] Transitions smooth (use `ease-out`)
- [ ] No jank during animations
- [ ] `will-change` used sparingly
- [ ] Debounced search inputs

### Perceived Speed
- [ ] Optimistic UI updates (e.g., like button)
- [ ] Instant feedback on clicks
- [ ] No blocking operations

---

## ✅ Specific to Civic Notices

### Statutory Compliance UI
- [ ] Required legal fields clearly marked
- [ ] Consultation period countdown prominent
- [ ] Window rule validation visible
- [ ] Proof of publication clear

### Multi-Persona Support
- [ ] Council officers: Bulk actions, analytics
- [ ] Residents: Simple language, clear CTAs
- [ ] Legal professionals: Precision, audit trails

### Complex Data
- [ ] Notice detail pages: Legal text readable (not wall of text)
- [ ] Map view: Intuitive clustering
- [ ] Dashboard: Clear data visualization

### Form-Heavy Experience
- [ ] Publish wizard feels guided, not overwhelming
- [ ] Inline help contextual and concise
- [ ] Progress always visible
- [ ] Can save and resume

---

## 🎯 Priority Scoring

After checking items above, calculate priority:

### P0 (Critical) - Fix Immediately
- Blocks users from completing task
- WCAG A violation
- Legal/compliance risk
- Data loss possible

**Examples**: Submit button doesn't work, form doesn't submit, insufficient contrast for critical text

### P1 (High) - Fix Before Next Release
- Major UX friction
- WCAG AA violation
- Brand inconsistency
- Confusing workflow

**Examples**: Error messages unclear, missing focus indicators, broken responsive layout

### P2 (Medium) - Plan for Next Sprint
- Minor UX friction
- Inconsistent styling
- Missing micro-interactions
- Polish items

**Examples**: Button hover state missing, inconsistent card shadows, no empty state illustration

### P3 (Low) - Backlog
- Nice-to-have
- Advanced features
- Minor polish

**Examples**: Smoother animations, additional loading states, decorative enhancements

---

## 📊 Scoring Template

| Area | Score (1-10) | Notes |
|------|--------------|-------|
| **Visual Design** | | |
| - Typography | | |
| - Color System | | |
| - Spacing & Layout | | |
| - Components | | |
| - Visual Polish | | |
| - Animations | | |
| **User Experience** | | |
| - Navigation | | |
| - Search & Discovery | | |
| - Forms | | |
| - Loading States | | |
| - Error States | | |
| - Empty States | | |
| **Accessibility** | | |
| - Keyboard Navigation | | |
| - Screen Reader Support | | |
| - Visual Accessibility | | |
| - Motion & Animation | | |
| **Responsive Design** | | |
| - Mobile | | |
| - Tablet | | |
| - Desktop | | |
| **Component Consistency** | | |
| - Buttons | | |
| - Forms | | |
| - Cards | | |
| **Performance** | | |
| - Loading States | | |
| - Image Optimization | | |
| - Perceived Speed | | |

**Overall Score**: _____ / 100

**Grade**: _____

---

## 📝 Quick Audit Workflow

1. **Prep** (5 min)
   - Start dev server
   - Seed test data
   - Clear browser cache
   - Open browser DevTools

2. **Visual Scan** (10 min)
   - Navigate key pages
   - Check typography, colors, spacing
   - Screenshot any issues

3. **Interaction Test** (15 min)
   - Complete key workflows (search, publish wizard)
   - Test forms, validation
   - Try map interactions

4. **Accessibility Check** (10 min)
   - Keyboard navigation through site
   - Run axe DevTools scan
   - Check contrast ratios

5. **Responsive Test** (10 min)
   - Resize browser to mobile, tablet, desktop
   - Test hamburger menu
   - Check for overflow

6. **Document** (10 min)
   - List issues with priority
   - Take annotated screenshots
   - Create GitHub issues

**Total: ~60 minutes**

---

## 🔗 Quick Links

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Extension](https://wave.webaim.org/extension/)
- [GDS Design System](https://design-system.service.gov.uk/)
- [Inclusive Components](https://inclusive-components.design/)
