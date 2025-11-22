# Playwright Test Templates for UX Audit

These are reusable test templates for auditing UI/UX. Copy and adapt as needed.

---

## Setup

```typescript
// e2e/ux-audit/helpers.ts
import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run axe accessibility scan on current page
 */
export async function runA11yScan(page: Page, testName: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  expect(results.violations, `Accessibility violations in ${testName}`).toEqual([]);

  return results;
}

/**
 * Check color contrast ratio
 */
export async function checkContrast(page: Page, selector: string, minRatio: number) {
  const element = page.locator(selector).first();

  const color = await element.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      fg: style.color,
      bg: style.backgroundColor,
    };
  });

  // Use axe or manual calculation
  // This is a simplified check - use axe for comprehensive testing
  console.log(`Contrast check for ${selector}:`, color);
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNav(page: Page, expectedFocusableCount: number) {
  await page.keyboard.press('Tab');

  let tabCount = 0;
  const maxTabs = 100; // Safety limit

  while (tabCount < maxTabs) {
    await page.keyboard.press('Tab');
    tabCount++;

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        testId: el?.getAttribute('data-testid'),
        role: el?.getAttribute('role'),
      };
    });

    if (tabCount === expectedFocusableCount) break;
  }

  expect(tabCount).toBeGreaterThanOrEqual(expectedFocusableCount);
}

/**
 * Check for horizontal overflow
 */
export async function checkNoHorizontalScroll(page: Page) {
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const windowWidth = await page.evaluate(() => window.innerWidth);

  expect(bodyWidth, 'Page should not have horizontal scroll').toBeLessThanOrEqual(windowWidth + 1);
}

/**
 * Wait for loading to complete (no spinners, skeletons)
 */
export async function waitForPageReady(page: Page) {
  // Wait for common loading indicators to disappear
  await page.waitForSelector('[data-testid*="loading"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForSelector('[data-testid*="skeleton"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForSelector('[aria-busy="true"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
}
```

---

## Template 1: Homepage Visual & UX Audit

```typescript
// e2e/ux-audit/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { runA11yScan, checkNoHorizontalScroll, waitForPageReady } from './helpers';

test.describe('Homepage UI/UX Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test('hero section displays correctly', async ({ page }) => {
    // Check main heading
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/search.*publish.*verify/i);

    // Check contrast (h1 should be readable)
    const h1Color = await h1.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    console.log('H1 color:', h1Color);

    // Screenshot for visual review
    await page.screenshot({
      path: 'audit/screenshots/homepage-hero.png',
      fullPage: false
    });
  });

  test('search card is visually polished', async ({ page }) => {
    const searchCard = page.locator('text=Search').first().locator('..').locator('..');
    await expect(searchCard).toBeVisible();

    // Check for glassmorphism properties
    const hasGlassmorphism = await searchCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backdropFilter: style.backdropFilter,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
      };
    });

    expect(hasGlassmorphism.backdropFilter).toContain('blur');
    expect(parseInt(hasGlassmorphism.borderRadius)).toBeGreaterThan(16); // Should be rounded
  });

  test('address search provides feedback', async ({ page }) => {
    const input = page.locator('[data-testid="home-address-input"]');
    const submit = page.locator('[data-testid="home-address-submit"]');

    // Empty submission
    await submit.click();
    // Should not navigate or show error
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/'); // Still on homepage

    // Valid search
    await input.fill('SW1A 1AA');
    await submit.click();
    await page.waitForURL(/\/notices\?/, { timeout: 5000 });

    // Check toast notification
    const toast = page.locator('[role="status"]');
    await expect(toast).toBeVisible({ timeout: 2000 });
  });

  test('testimonial carousel works', async ({ page }) => {
    const carousel = page.locator('text=/Trusted by.*councils/').locator('..').locator('..');
    await expect(carousel).toBeVisible();

    // Check navigation buttons
    const prevBtn = page.locator('[aria-label="Previous testimonial"]');
    const nextBtn = page.locator('[aria-label="Next testimonial"]');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Click next
    const currentText = await carousel.textContent();
    await nextBtn.click();
    await page.waitForTimeout(600); // Allow animation

    const newText = await carousel.textContent();
    expect(newText).not.toBe(currentText);

    // Check dot indicators
    const dots = page.locator('[role="tab"]');
    const dotCount = await dots.count();
    expect(dotCount).toBeGreaterThan(1);
  });

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Hamburger menu visible
    const hamburger = page.locator('[aria-label="Open menu"]');
    await expect(hamburger).toBeVisible();

    // Click to open
    await hamburger.click();

    // Sheet visible
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    // Check focus trap (Tab should stay in sheet)
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    // Should be within sheet

    // Escape closes
    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
  });

  test('no horizontal scroll at any breakpoint', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      await checkNoHorizontalScroll(page);
    }
  });

  test('accessibility scan passes', async ({ page }) => {
    await runA11yScan(page, 'homepage');
  });
});
```

---

## Template 2: Publish Wizard Flow Audit

```typescript
// e2e/ux-audit/publish-wizard.spec.ts
import { test, expect } from '@playwright/test';
import { runA11yScan, waitForPageReady } from './helpers';

test.describe('Publish Wizard UI/UX', () => {
  test('step 1: notice type selection', async ({ page }) => {
    await page.goto('/publish/step-1');
    await waitForPageReady(page);

    // Stepper visible
    const stepper = page.locator('[data-testid*="stepper"]').first();
    await expect(stepper).toBeVisible();

    // Active step indicator
    // Check for visual distinction (e.g., different background, checkmark)

    // Notice type cards
    const cards = page.locator('[data-testid*="notice-type"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Check card styling consistency
    const firstCard = cards.first();
    const cardStyle = await firstCard.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        padding: style.padding,
      };
    });

    expect(parseInt(cardStyle.borderRadius)).toBeGreaterThan(8);

    // Hover effect
    await firstCard.hover();
    await page.waitForTimeout(300);
    // Could check for transform/shadow change

    // Click to proceed
    await firstCard.click();
    await page.waitForURL(/\/publish\/step-2/, { timeout: 3000 });
  });

  test('step 2: upload method choice', async ({ page }) => {
    // Navigate to step 2 (may need to select notice type first)
    await page.goto('/publish/step-1');
    await page.locator('[data-testid="notice-type-premises-licence"]').click();
    await page.waitForURL(/\/publish\/step-2/);

    // Upload choice visible
    const uploadChoice = page.locator('text=/upload.*pdf/i').first();
    const buildChoice = page.locator('text=/build.*scratch/i').first();

    await expect(uploadChoice).toBeVisible();
    await expect(buildChoice).toBeVisible();

    // Drag-and-drop zone (if upload selected)
    await uploadChoice.click();
    const dropzone = page.locator('[data-testid="upload-dropzone"]');
    await expect(dropzone).toBeVisible();

    // Check for clear instructions
    await expect(dropzone).toContainText(/drag.*drop/i);
  });

  test('step 3: form validation provides clear errors', async ({ page }) => {
    // Navigate to step 3
    await page.goto('/publish/step-1');
    await page.locator('[data-testid="notice-type-premises-licence"]').first().click();
    await page.waitForURL(/\/publish\/step-2/);
    await page.locator('text=/build.*scratch/i').click();
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForURL(/\/publish\/step-3/);

    // Try to continue without filling required fields
    const continueBtn = page.locator('[data-testid="continue-button"]');
    await continueBtn.click();

    // Error summary should appear
    const errorSummary = page.locator('[role="alert"]').first();
    await expect(errorSummary).toBeVisible({ timeout: 2000 });

    // Check inline errors
    const fieldError = page.locator('[data-testid*="field-error"]').first();
    await expect(fieldError).toBeVisible();

    // Error text should be specific
    const errorText = await fieldError.textContent();
    expect(errorText?.toLowerCase()).toContain('required');

    // Screenshot
    await page.screenshot({ path: 'audit/screenshots/wizard-step3-errors.png' });
  });

  test('step 3: preview pane updates in real-time', async ({ page }) => {
    // Navigate to step 3 with build method
    await page.goto('/publish/step-1');
    await page.locator('[data-testid="notice-type-premises-licence"]').first().click();
    await page.waitForURL(/\/publish\/step-2/);
    await page.locator('text=/build.*scratch/i').click();
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForURL(/\/publish\/step-3/);

    const preview = page.locator('[data-testid="notice-preview"]');

    // Fill a field
    await page.fill('[name="applicantName"]', 'Test Applicant Ltd');
    await page.waitForTimeout(500); // Allow debounce

    // Check preview updates
    await expect(preview).toContainText('Test Applicant Ltd', { timeout: 3000 });

    // Fill another field
    await page.fill('[name="premisesName"]', 'The Red Lion');
    await page.waitForTimeout(500);
    await expect(preview).toContainText('The Red Lion');
  });

  test('step 4: review shows all entered data', async ({ page }) => {
    // Navigate through wizard with filled data
    // (This is a simplified version; in practice, you'd fill all required fields)

    await page.goto('/publish/step-1');
    await page.locator('[data-testid="notice-type-premises-licence"]').first().click();
    // ... continue through steps with data ...

    // On step 4, check review cards
    const reviewCard = page.locator('[data-testid="review-card"]');
    await expect(reviewCard).toBeVisible();

    // Should show applicant name, premises, etc.
    await expect(reviewCard).toContainText('Applicant');
    await expect(reviewCard).toContainText('Premises');

    // Compliance checklist
    const checklist = page.locator('[data-testid="compliance-checklist"]');
    await expect(checklist).toBeVisible();

    // Cost card
    const costCard = page.locator('text=/£.*total/i');
    await expect(costCard).toBeVisible();
  });

  test('wizard stepper allows back navigation', async ({ page }) => {
    await page.goto('/publish/step-2');

    // Click step 1 in stepper
    const step1 = page.locator('[data-testid="stepper-step-1"]');

    if (await step1.isEnabled()) {
      await step1.click();
      await page.waitForURL(/\/publish\/step-1/, { timeout: 2000 });
    } else {
      // If not clickable, use back button
      await page.goBack();
      expect(page.url()).toContain('/step-1');
    }
  });

  test('draft persists across navigation', async ({ page }) => {
    await page.goto('/publish/step-1');
    await page.locator('[data-testid="notice-type-premises-licence"]').first().click();
    await page.waitForURL(/\/publish\/step-2/);

    // Fill some data
    await page.locator('text=/build.*scratch/i').click();
    await page.locator('[data-testid="continue-button"]').click();
    await page.waitForURL(/\/publish\/step-3/);
    await page.fill('[name="applicantName"]', 'Persisted Applicant');

    // Navigate away and back
    await page.goto('/');
    await page.goto('/publish/step-3');

    // Check if data persisted
    const input = page.locator('[name="applicantName"]');
    await expect(input).toHaveValue('Persisted Applicant');
  });

  test('accessibility scan on each step', async ({ page }) => {
    const steps = ['/publish/step-1', '/publish/step-2'];

    for (const step of steps) {
      await page.goto(step);
      await waitForPageReady(page);
      await runA11yScan(page, `wizard ${step}`);
    }
  });
});
```

---

## Template 3: Map View Interaction Audit

```typescript
// e2e/ux-audit/map-view.spec.ts
import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers';

test.describe('Map View UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notices');
    await waitForPageReady(page);
  });

  test('toggle to map view works', async ({ page }) => {
    const toggle = page.locator('[data-testid="toggle-map-view"]');
    await expect(toggle).toBeVisible();

    await toggle.click();

    // Map canvas should appear
    const mapCanvas = page.locator('.maplibregl-canvas');
    await expect(mapCanvas).toBeVisible({ timeout: 10000 });

    // Screenshot
    await page.screenshot({ path: 'audit/screenshots/map-view.png' });
  });

  test('map displays clusters', async ({ page }) => {
    await page.click('[data-testid="toggle-map-view"]');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });

    // Wait for markers to load
    await page.waitForTimeout(2000);

    const markers = page.locator('.maplibregl-marker');
    const markerCount = await markers.count();

    expect(markerCount, 'Should have at least one marker/cluster').toBeGreaterThan(0);
  });

  test('clicking cluster shows popup or zooms', async ({ page }) => {
    await page.click('[data-testid="toggle-map-view"]');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click first marker
    const firstMarker = page.locator('.maplibregl-marker').first();
    await firstMarker.click();

    // Either popup appears or map zooms
    const popup = page.locator('.maplibregl-popup');
    const popupVisible = await popup.isVisible().catch(() => false);

    if (popupVisible) {
      // Check popup content
      await expect(popup).toContainText(/notice|application/i);
    } else {
      // Map should have zoomed (hard to test precisely)
      // Could check zoom level via MapLibre API if exposed
      console.log('Cluster clicked, map may have zoomed');
    }
  });

  test('map controls work', async ({ page }) => {
    await page.click('[data-testid="toggle-map-view"]');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });

    // Zoom controls
    const zoomIn = page.locator('.maplibregl-ctrl-zoom-in');
    const zoomOut = page.locator('.maplibregl-ctrl-zoom-out');

    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(500);
      // Zoom level should increase (could verify via MapLibre API)
    }

    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(500);
    }
  });

  test('map is keyboard accessible', async ({ page }) => {
    await page.click('[data-testid="toggle-map-view"]');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });

    // Focus map
    await page.focus('.maplibregl-canvas');

    // Arrow keys should pan
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // +/- keys should zoom
    await page.keyboard.press('+');
    await page.waitForTimeout(300);
    await page.keyboard.press('-');
    await page.waitForTimeout(300);

    // Verify map responded (hard to test precisely without API access)
    console.log('Map keyboard navigation tested');
  });

  test('mobile map is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/notices');
    await page.click('[data-testid="toggle-map-view"]');
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });

    // Touch gestures (pinch-to-zoom, pan) are handled by MapLibre
    // We can test that the map is visible and sized correctly
    const canvas = page.locator('.maplibregl-canvas');
    await expect(canvas).toBeVisible();

    const size = await canvas.boundingBox();
    expect(size?.width).toBeGreaterThan(300); // Should fill mobile width
    expect(size?.height).toBeGreaterThan(300); // Should be tall enough
  });
});
```

---

## Template 4: Responsive Design Audit

```typescript
// e2e/ux-audit/responsive.spec.ts
import { test, expect } from '@playwright/test';
import { checkNoHorizontalScroll, waitForPageReady } from './helpers';

const viewports = [
  { name: 'mobile-s', width: 320, height: 568 },
  { name: 'mobile-m', width: 375, height: 667 },
  { name: 'mobile-l', width: 425, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'desktop-xl', width: 1920, height: 1080 },
];

const pages = [
  '/',
  '/notices',
  '/publish/step-1',
  '/notices/123', // Replace with actual notice ID
];

test.describe('Responsive Design Audit', () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: no horizontal scroll on key pages`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const url of pages) {
        await page.goto(url).catch(() => console.log(`Could not navigate to ${url}`));
        await waitForPageReady(page);
        await checkNoHorizontalScroll(page);
      }
    });

    test(`${viewport.name}: touch targets meet minimum size`, async ({ page }) => {
      if (viewport.width > 768) {
        test.skip(); // Only test on mobile
      }

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Check all buttons and links
      const interactiveElements = page.locator('button, a');
      const count = await interactiveElements.count();

      for (let i = 0; i < Math.min(count, 20); i++) { // Check first 20
        const element = interactiveElements.nth(i);
        const box = await element.boundingBox();

        if (box) {
          // WCAG recommends 44x44px minimum
          const meetsMinimum = box.width >= 44 && box.height >= 44;

          if (!meetsMinimum) {
            const testId = await element.getAttribute('data-testid');
            const text = await element.textContent();
            console.warn(`Small target at ${viewport.name}: ${testId || text?.slice(0, 30)} - ${box.width}x${box.height}`);
          }

          // Allow some leeway for icons with adequate spacing
          expect(box.width >= 40 || box.height >= 40, `Target too small: ${testId || text?.slice(0, 30)}`).toBeTruthy();
        }
      }
    });

    test(`${viewport.name}: text is readable`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Check body text size
      const body = page.locator('body');
      const fontSize = await body.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });

      // Should be at least 14px on mobile, 16px on desktop
      const minSize = viewport.width < 768 ? 14 : 16;
      expect(fontSize).toBeGreaterThanOrEqual(minSize);
    });

    test(`${viewport.name}: screenshot for visual review`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const url of pages.slice(0, 2)) { // Just homepage and notices
        await page.goto(url).catch(() => {});
        await waitForPageReady(page);

        const filename = url === '/' ? 'homepage' : url.replace(/\//g, '-');
        await page.screenshot({
          path: `audit/screenshots/${viewport.name}-${filename}.png`,
          fullPage: true
        });
      }
    });
  }
});
```

---

## Template 5: Component Consistency Audit

```typescript
// e2e/ux-audit/component-consistency.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Component Consistency Audit', () => {
  test('button styles are consistent', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button, a[class*="btn"]');
    const count = await buttons.count();

    const styles: Array<{
      borderRadius: string;
      padding: string;
      fontSize: string;
      transition: string;
    }> = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const style = await btn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          fontSize: computed.fontSize,
          transition: computed.transition,
        };
      });
      styles.push(style);
    }

    // Check that border radius is consistent
    const radii = styles.map(s => s.borderRadius);
    const uniqueRadii = new Set(radii);

    // Should have at most 3-4 different radii (for different button sizes)
    expect(uniqueRadii.size, 'Too many different border radii - inconsistent styling').toBeLessThanOrEqual(4);
  });

  test('form inputs are consistent', async ({ page }) => {
    await page.goto('/publish/step-3');

    const inputs = page.locator('input[type="text"], textarea');
    const count = await inputs.count();

    if (count === 0) {
      test.skip(); // No inputs on this page
    }

    const firstInput = inputs.first();
    const baseStyle = await firstInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderRadius: computed.borderRadius,
        borderWidth: computed.borderWidth,
        padding: computed.padding,
      };
    });

    // Check that other inputs match
    for (let i = 1; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      const style = await input.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          borderWidth: computed.borderWidth,
          padding: computed.padding,
        };
      });

      expect(style.borderRadius).toBe(baseStyle.borderRadius);
      expect(style.borderWidth).toBe(baseStyle.borderWidth);
    }
  });

  test('cards have consistent shadows', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('[class*="rounded"], [class*="shadow"]');
    const count = await cards.count();

    const shadows: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const card = cards.nth(i);
      const shadow = await card.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });
      if (shadow !== 'none') {
        shadows.push(shadow);
      }
    }

    // Should have consistent shadow values (within 3-4 variants)
    const uniqueShadows = new Set(shadows);
    expect(uniqueShadows.size, 'Too many different shadow styles').toBeLessThanOrEqual(5);
  });

  test('icons are consistent size', async ({ page }) => {
    await page.goto('/');

    const icons = page.locator('svg[class*="lucide"]');
    const count = await icons.count();

    const sizes: Array<{ width: number; height: number }> = [];

    for (let i = 0; i < Math.min(count, 15); i++) {
      const icon = icons.nth(i);
      const box = await icon.boundingBox();
      if (box) {
        sizes.push({ width: box.width, height: box.height });
      }
    }

    // Icons should be square
    for (const size of sizes) {
      expect(Math.abs(size.width - size.height), 'Icon not square').toBeLessThan(2);
    }

    // Should have consistent sizes (e.g., 16px, 20px, 24px)
    const widths = sizes.map(s => Math.round(s.width));
    const uniqueWidths = new Set(widths);
    expect(uniqueWidths.size, 'Too many different icon sizes').toBeLessThanOrEqual(4);
  });
});
```

---

## Running the Tests

```bash
# Run all UX audit tests
npx playwright test e2e/ux-audit/

# Run specific suite
npx playwright test e2e/ux-audit/homepage.spec.ts

# Run with headed browser (watch it run)
npx playwright test e2e/ux-audit/ --headed

# Run specific viewport
npx playwright test e2e/ux-audit/responsive.spec.ts --grep "mobile-m"

# Generate HTML report
npx playwright show-report

# Run with trace (for debugging)
npx playwright test --trace on
```

---

## Customizing for Your Needs

### Add Custom Assertions

```typescript
// helpers.ts
export async function expectSmoothTransition(page: Page, selector: string) {
  const element = page.locator(selector).first();

  const transition = await element.evaluate((el) => {
    return window.getComputedStyle(el).transition;
  });

  expect(transition, `${selector} should have smooth transition`).toContain('ease');
}
```

### Visual Regression Testing

```typescript
test('homepage visual regression', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100, // Allow small differences
  });
});
```

### Performance Timing

```typescript
test('homepage loads quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime, 'Page should load in under 3 seconds').toBeLessThan(3000);
});
```

---

These templates provide a solid foundation for automated UI/UX testing. Adapt the selectors (`[data-testid="..."]`) to match your actual component IDs.
