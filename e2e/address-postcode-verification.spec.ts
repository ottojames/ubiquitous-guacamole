import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Address Postcode and UI Verification', () => {
  test('verifies CH4 7BB postcode populates correctly and Required badges are visible', async ({ page }) => {
    // Navigate to step 1
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select a notice type
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Should now be on step 2
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Click "Use template instead" to reveal the form directly
    const useTemplateButton = page.locator('button:has-text("Use the template instead")');
    await expect(useTemplateButton).toBeVisible({ timeout: 10000 });
    await useTemplateButton.click();

    // Wait for form to appear with "Applicant legal name" field
    await page.waitForSelector('text=Applicant legal name', { timeout: 15000 });

    // ✅ TEST 1: Verify Required badges are visible and styled correctly
    const requiredBadges = page.locator('span.bg-rose-100:has-text("Required")');
    const badgeCount = await requiredBadges.count();

    console.log(`✓ Found ${badgeCount} Required badges`);
    expect(badgeCount).toBeGreaterThan(5); // Should have at least 6 required fields

    // Check badge styling
    const firstBadge = requiredBadges.first();
    await expect(firstBadge).toBeVisible();

    const badgeClass = await firstBadge.getAttribute('class');
    expect(badgeClass).toContain('bg-rose-100');
    expect(badgeClass).toContain('text-rose-700');

    console.log('✓ Required field badges are visible and styled correctly!');

    // ✅ TEST 2: Verify CH4 7BB postcode populates correctly
    // Now search for Chester address
    const addressInput = page.locator('[role="combobox"]').first();
    await addressInput.scrollIntoViewIfNeeded();
    await addressInput.click();
    await addressInput.fill('9 lower park chester');

    // Wait for dropdown to appear
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

    // Find the Chester address option
    const chesterOption = page.locator('[role="option"]:has-text("9 Lower Park Road, Chester")');
    await expect(chesterOption).toBeVisible({ timeout: 5000 });

    // Click the Chester option
    await chesterOption.click();

    // Wait a moment for the form to populate
    await page.waitForTimeout(500);

    // Verify the postcode is CH4 7BB (NOT CH4 7DE)
    const postcodeInput = page.locator('#premises-postcode');
    await expect(postcodeInput).toHaveValue('CH4 7BB');

    // Also verify other fields populated correctly
    const line1Input = page.locator('#premises-line1');
    await expect(line1Input).toHaveValue('9 Lower Park Road');

    const cityInput = page.locator('#premises-city');
    await expect(cityInput).toHaveValue('Chester');

    console.log('✓ Postcode correctly set to CH4 7BB!');
    console.log('✓ Address line 1 correctly set to 9 Lower Park Road');
    console.log('✓ City correctly set to Chester');

    // Take a screenshot showing the fixes
    await page.screenshot({ path: 'test-results/postcode-and-badges-verification.png', fullPage: true });

    // ✅ TEST 3: Verify section headers have descriptive subtitles
    const applicantSubtitle = page.locator('text=Who is applying for the licence');
    await expect(applicantSubtitle).toBeVisible();

    const locationSubtitle = page.locator('text=Where the premises is located');
    await expect(locationSubtitle).toBeVisible();

    const licensingSubtitle = page.locator('text=Council responsible for licensing');
    await expect(licensingSubtitle).toBeVisible();

    console.log('✓ Section headers have descriptive subtitles for better organization!');

    console.log('\n========================================');
    console.log('ALL TESTS PASSED! ✅');
    console.log('========================================');
    console.log(`1. Found ${badgeCount} Required badges (highly visible)`);
    console.log('2. Postcode CH4 7BB populates correctly');
    console.log('3. Layout improved with section subtitles');
    console.log('========================================\n');
  });
});
