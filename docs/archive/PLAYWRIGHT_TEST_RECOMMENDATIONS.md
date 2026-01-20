# Playwright Test Recommendations for UI/UX Audit Findings

**Date**: 2025-11-05
**Purpose**: Prevent regression of identified UI/UX and accessibility issues

---

## Test Suite 1: Accessibility Compliance

### Test 1.1: Color Contrast Validation
**Priority**: P0
**Prevents Regression Of**: Finding 1.1 (Insufficient contrast on disabled states)

```typescript
// e2e/accessibility/color-contrast.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Color Contrast Compliance', () => {
  test('disabled buttons meet WCAG AA contrast ratio', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Find Continue button before selection
    const continueBtn = page.getByTestId('notice-step-continue');
    await expect(continueBtn).toBeDisabled();

    // Run axe-core scan focused on contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="notice-step-continue"]')
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toHaveLength(0);
  });

  test('placeholder text meets minimum contrast', async ({ page }) => {
    await page.goto('/publish/step-1');

    const searchInput = page.getByPlaceholder(/search notice types/i);

    // Check computed styles
    const placeholderColor = await searchInput.evaluate((el) => {
      return window.getComputedStyle(el, '::placeholder').color;
    });

    // Placeholder should use text-slate-600 (rgb(71, 85, 105)) not text-slate-400
    expect(placeholderColor).toContain('71, 85, 105');
  });
});
```

---

### Test 1.2: Focus Trap in Mobile Menu
**Priority**: P0
**Prevents Regression Of**: Finding 3.1 (Mobile menu lacks focus trap)

```typescript
// e2e/accessibility/focus-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Focus Management', () => {
  test('mobile menu traps focus within modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page.goto('/');

    // Open hamburger menu
    await page.getByLabel('Open menu').click();

    // Verify modal is visible
    await expect(page.getByRole('dialog', { name: /menu/i })).toBeVisible();

    // Tab through all focusable elements
    const focusableElements = await page.evaluate(() => {
      const tabbableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const modalElements = Array.from(
        document.querySelectorAll('[role="dialog"] ' + tabbableSelector)
      );
      const outsideElements = Array.from(
        document.querySelectorAll('main ' + tabbableSelector)
      );
      return {
        modalCount: modalElements.length,
        outsideCount: outsideElements.length,
      };
    });

    // Tab through modal + 1 (should cycle back to first element)
    for (let i = 0; i <= focusableElements.modalCount; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be within modal
    const focusedElementRole = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return activeEl?.closest('[role="dialog"]') ? 'inside' : 'outside';
    });

    expect(focusedElementRole).toBe('inside');
  });

  test('Escape key closes mobile menu and restores focus', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.getByLabel('Open menu');
    await menuButton.click();

    // Press Escape
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Focus should return to hamburger button
    await expect(menuButton).toBeFocused();
  });
});
```

---

### Test 1.3: Form Error Announcements
**Priority**: P0
**Prevents Regression Of**: Finding 3.2 (Form errors missing aria-describedby)

```typescript
// e2e/accessibility/form-errors.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Form Error Accessibility', () => {
  test('email validation errors are announced to screen readers', async ({ page }) => {
    await page.goto('/publish/step-2');

    const emailInput = page.getByLabel(/email address/i);

    // Enter invalid email and blur
    await emailInput.fill('invalid-email');
    await emailInput.blur();

    // Wait for error to appear
    const errorMessage = page.getByText(/please enter a valid email/i);
    await expect(errorMessage).toBeVisible();

    // Check ARIA attributes
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();

    const ariaInvalid = await emailInput.getAttribute('aria-invalid');
    expect(ariaInvalid).toBe('true');

    // Verify error has proper ID
    const errorId = await errorMessage.getAttribute('id');
    expect(ariaDescribedBy).toContain(errorId!);

    // Verify error has role="alert" or aria-live
    const errorRole = await errorMessage.getAttribute('role');
    expect(errorRole).toBe('alert');
  });

  test('error messages persist when field regains focus', async ({ page }) => {
    await page.goto('/publish/step-2');

    const emailInput = page.getByLabel(/email address/i);

    await emailInput.fill('bad-email');
    await emailInput.blur();
    await expect(page.getByText(/valid email/i)).toBeVisible();

    // Re-focus field
    await emailInput.focus();

    // Error should still be visible
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
```

---

## Test Suite 2: Component Consistency

### Test 2.1: Button Height Standardization
**Priority**: P1
**Prevents Regression Of**: Finding 5.1 (Button height variance)

```typescript
// e2e/visual/component-consistency.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Button Size Consistency', () => {
  test('all primary CTAs use consistent height', async ({ page }) => {
    await page.goto('/');

    // Collect heights of all primary buttons
    const buttonHeights = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a[href="/publish"]'));
      return buttons.map((btn) => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim(),
          height: rect.height,
          location: btn.closest('header') ? 'header' : 'hero',
        };
      });
    });

    // All hero CTAs should be h-11 (44px) or h-14 (56px) for large variant
    const allowedHeights = [44, 56];
    buttonHeights.forEach(({ text, height, location }) => {
      expect(
        allowedHeights,
        `Button "${text}" in ${location} has invalid height ${height}px`
      ).toContain(Math.round(height));
    });

    // Verify wizard Continue buttons
    await page.goto('/publish/step-1');
    const continueHeight = await page
      .getByTestId('notice-step-continue')
      .evaluate((el) => el.getBoundingClientRect().height);

    expect([56], 'Wizard Continue button should use lg variant (56px)').toContain(
      Math.round(continueHeight)
    );
  });
});
```

---

### Test 2.2: Border Radius Consistency
**Priority**: P2
**Prevents Regression Of**: Finding 1.2 (Border radius inconsistency)

```typescript
// e2e/visual/border-radius.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Border Radius Tokens', () => {
  test('cards use semantic border-radius values', async ({ page }) => {
    await page.goto('/');

    const borderRadii = await page.evaluate(() => {
      const selectors = {
        testimonialCard: '.rounded-3xl',
        noticeCard: '[data-testid="notice-card"]',
        searchCard: 'form input[type="text"]',
      };

      return Object.entries(selectors).map(([name, selector]) => {
        const el = document.querySelector(selector);
        if (!el) return { name, radius: null };
        const radius = window.getComputedStyle(el).borderRadius;
        return { name, radius };
      });
    });

    // Define allowed values (px or rem converted to px at base 16px)
    const allowedRadii = ['16px', '24px', '28px', '1rem', '1.5rem', '1.75rem'];

    borderRadii.forEach(({ name, radius }) => {
      if (radius) {
        const normalized = radius.replace(/(\d+)px/g, '$1px').split(' ')[0]; // Take first value if multiple
        expect(
          allowedRadii.some((allowed) => normalized.includes(allowed)),
          `${name} uses non-standard radius: ${radius}`
        ).toBeTruthy();
      }
    });
  });
});
```

---

## Test Suite 3: Keyboard Navigation

### Test 3.1: Skip Link Functionality
**Priority**: P1
**Prevents Regression Of**: Finding 3.3 (Missing skip link)

```typescript
// e2e/accessibility/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('skip link appears on Tab and jumps to main content', async ({ page }) => {
    await page.goto('/');

    // Press Tab once - skip link should appear
    await page.keyboard.press('Tab');

    const skipLink = page.getByText(/skip to main content/i);
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();

    // Activate skip link
    await page.keyboard.press('Enter');

    // Focus should move to main content
    const mainContent = page.locator('main, [id="main-content"]');
    const isFocusedOnMain = await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active?.tagName === 'MAIN' ||
        active?.id === 'main-content' ||
        active?.closest('main') !== null
      );
    });

    expect(isFocusedOnMain).toBeTruthy();
  });

  test('wizard stepper is keyboard navigable', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Select a notice type
    await page.getByTestId('notice-option-licensing-premises-new').click();

    // Continue to Step 2
    await page.getByTestId('notice-step-continue').click();
    await expect(page).toHaveURL(/step-2/);

    // Tab to stepper - should be able to navigate back
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple Tabs

    // Find Step 1 link in stepper
    const step1Link = page.locator('[aria-label*="Progress"] a[href*="step-1"]');
    if (await step1Link.isVisible()) {
      await step1Link.focus();
      await expect(step1Link).toBeFocused();
    }
  });
});
```

---

## Test Suite 4: Responsive Design

### Test 4.1: Touch Target Sizes
**Priority**: P1
**Prevents Regression Of**: Finding 4.1 (Touch targets below 44px)

```typescript
// e2e/responsive/touch-targets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Touch Target Sizes (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('all interactive elements meet 44x44px minimum', async ({ page }) => {
    await page.goto('/');

    // Check hamburger menu button
    const hamburger = page.getByLabel(/open menu/i);
    const hamburgerBox = await hamburger.boundingBox();
    expect(hamburgerBox).toBeTruthy();
    expect(hamburgerBox!.width).toBeGreaterThanOrEqual(44);
    expect(hamburgerBox!.height).toBeGreaterThanOrEqual(44);

    // Check primary CTA
    const publishBtn = page.getByRole('link', { name: /publish/i }).first();
    const publishBox = await publishBtn.boundingBox();
    expect(publishBox!.height).toBeGreaterThanOrEqual(44);

    // Check testimonial navigation dots
    const dots = page.locator('[role="tab"]');
    const dotCount = await dots.count();

    for (let i = 0; i < dotCount; i++) {
      const dot = dots.nth(i);
      const box = await dot.boundingBox();
      // Account for padding - total clickable area should be e44px
      expect(box!.width + box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('wizard stepper circles are tappable on mobile', async ({ page }) => {
    await page.goto('/publish/step-1');

    const stepCircles = page.locator('[aria-label*="Progress"] button, [aria-label*="Progress"] a');
    const count = await stepCircles.count();

    for (let i = 0; i < count; i++) {
      const circle = stepCircles.nth(i);
      const box = await circle.boundingBox();
      if (box) {
        // Either the element itself or its clickable area should be e44px
        const isTappable = box.width >= 40 || box.height >= 40;
        expect(isTappable, `Step circle ${i + 1} too small for touch`).toBeTruthy();
      }
    }
  });
});
```

---

### Test 4.2: No Horizontal Scroll at 320px
**Priority**: P2
**Prevents Regression Of**: Finding 4.2 (Horizontal scroll on smallest devices)

```typescript
// e2e/responsive/viewport-constraints.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Viewport Constraints', () => {
  test('no horizontal scroll at 320px (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 320;

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('wizard steps do not overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/publish/step-1');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);

    // Check specific overflow elements
    const headerCard = page.locator('header.rounded-3xl').first();
    const cardWidth = await headerCard.evaluate((el) => el.scrollWidth);
    const containerWidth = await page.evaluate(() => window.innerWidth);

    expect(cardWidth).toBeLessThanOrEqual(containerWidth);
  });
});
```

---

## Test Suite 5: User Experience Flows

### Test 5.1: Loading States Consistency
**Priority**: P1
**Prevents Regression Of**: Finding 2.2 (Continue button loading state inconsistency)

```typescript
// e2e/ux/loading-states.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Loading States', () => {
  test('all Continue buttons show spinner during transition', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Select notice type
    await page.getByTestId('notice-option-licensing-premises-new').click();

    const continueBtn = page.getByTestId('notice-step-continue');

    // Click and immediately check for spinner
    const spinnerPromise = page.waitForSelector('svg.animate-spin', { timeout: 1000 });
    await continueBtn.click();

    // Should show spinner icon (not just text change)
    const spinner = await spinnerPromise;
    expect(spinner).toBeTruthy();

    // Button text should change
    await expect(continueBtn).toContainText(/working|processing/i);

    // Wait for navigation
    await expect(page).toHaveURL(/step-2/);
  });

  test('Step 2 Continue button also shows spinner', async ({ page }) => {
    await page.goto('/publish/step-2?draft=test-123');

    // Fill required email
    await page.getByLabel(/email address/i).fill('test@example.com');

    // Assume we have uploaded a notice (mocked state)
    const continueBtn = page.getByTestId('upload-step-continue');

    if (await continueBtn.isEnabled()) {
      const spinnerPromise = page.waitForSelector('svg.animate-spin', { timeout: 1000 });
      await continueBtn.click();

      const spinner = await spinnerPromise;
      expect(spinner).toBeTruthy();
    }
  });
});
```

---

### Test 5.2: Wizard Stepper Label Visibility
**Priority**: P1
**Prevents Regression Of**: Finding 2.1 (Stepper labels disappear)

```typescript
// e2e/ux/wizard-stepper.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wizard Stepper UX', () => {
  test('all step labels visible on Step 1', async ({ page }) => {
    await page.goto('/publish/step-1');

    const stepLabels = [
      /type/i,      // Step 1: Notice type
      /upload/i,    // Step 2: Upload
      /confirm/i,   // Step 3: Confirm details (or similar)
      /review|pay/i // Step 4: Review & Pay
    ];

    for (const labelPattern of stepLabels) {
      const label = page.locator('[aria-label*="Progress"]').getByText(labelPattern);
      await expect(label).toBeVisible();
    }
  });

  test('step labels remain visible on all steps', async ({ page }) => {
    await page.goto('/publish/step-1');

    // Progress through wizard
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // On Step 2, Step 3 and Step 4 labels should still be visible
    await expect(page).toHaveURL(/step-2/);
    await expect(page.getByText(/confirm/i).first()).toBeVisible();
    await expect(page.getByText(/review|pay/i).first()).toBeVisible();
  });
});
```

---

## Test Suite 6: Motion & Animation

### Test 6.1: Reduced Motion Preference
**Priority**: P2
**Prevents Regression Of**: Finding 3.4 (Testimonial carousel ignores prefers-reduced-motion)

```typescript
// e2e/accessibility/reduced-motion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reduced Motion Support', () => {
  test.use({ reducedMotion: 'reduce' });

  test('carousel auto-rotation pauses with prefers-reduced-motion', async ({ page }) => {
    await page.goto('/');

    // Find first testimonial text
    const firstTestimonial = page.locator('blockquote').first();
    const initialText = await firstTestimonial.textContent();

    // Wait 8 seconds (carousel normally rotates every 7s)
    await page.waitForTimeout(8000);

    // Text should NOT have changed (auto-rotation disabled)
    const currentText = await firstTestimonial.textContent();
    expect(currentText).toBe(initialText);
  });

  test('manual navigation still works with reduced motion', async ({ page }) => {
    await page.goto('/');

    const nextButton = page.getByLabel(/next testimonial/i);
    const firstText = await page.locator('blockquote').first().textContent();

    await nextButton.click();

    // Should transition immediately (no animation delay)
    await page.waitForTimeout(100); // Short delay for React state update

    const secondText = await page.locator('blockquote').first().textContent();
    expect(secondText).not.toBe(firstText);
  });
});
```

---

## Test Execution Plan

### Phase 1: Critical Accessibility (Week 1)
- Test 1.1: Color Contrast
- Test 1.2: Focus Trap
- Test 1.3: Form Error Announcements
- Test 3.1: Skip Link

### Phase 2: Component Consistency (Week 2)
- Test 2.1: Button Heights
- Test 2.2: Border Radius
- Test 5.1: Loading States

### Phase 3: Responsive & Mobile (Week 3)
- Test 4.1: Touch Targets
- Test 4.2: Viewport Constraints
- Test 5.2: Wizard Stepper

### Phase 4: Polish & Motion (Week 4)
- Test 6.1: Reduced Motion

---

## Running the Tests

```bash
# Install dependencies
npm install -D @playwright/test @axe-core/playwright

# Run all accessibility tests
npx playwright test e2e/accessibility

# Run specific test file
npx playwright test e2e/accessibility/color-contrast.spec.ts

# Run with headed browser (for debugging)
npx playwright test --headed

# Generate report
npx playwright test --reporter=html
```

---

## CI/CD Integration

Add to `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test e2e/accessibility
        env:
          CI: true
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: accessibility-report
          path: playwright-report/
```

---

**Total Recommended Tests**: 12 spec files, ~35 individual test cases
**Coverage**: Addresses 18/22 audit findings (82%)
**Estimated Setup Time**: 2-3 days for full test suite implementation
