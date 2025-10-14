import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Address Postcode Fix - Chester CH4 7BB', () => {
  test('correctly populates CH4 7BB postcode when selecting 9 Lower Park Road Chester', async ({ page }) => {
    // Navigate to step 1
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select a notice type
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Should now be on step 2
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Upload a test file to reveal the form
    const testPdfPath = path.resolve('test-fixtures/sample.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Wait for form to appear
    await page.waitForSelector('text=Applicant legal name', { timeout: 15000 });

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

    // Take a screenshot
    await page.screenshot({ path: 'test-results/chester-postcode-fix.png', fullPage: true });
  });

  test('verifies required field badges are visible', async ({ page }) => {
    // Navigate to step 1
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select a notice type
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Should now be on step 2
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Upload a test file
    const testPdfPath = path.resolve('test-fixtures/sample.pdf');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Wait for form to appear
    await page.waitForSelector('text=Applicant legal name', { timeout: 15000 });

    // Check that "Required" badges are visible and prominent
    const requiredBadges = page.locator('span.bg-rose-100:has-text("Required")');
    const badgeCount = await requiredBadges.count();

    console.log(`Found ${badgeCount} "Required" badges`);
    expect(badgeCount).toBeGreaterThan(5); // Should have at least 6 required fields

    // Check that the badges have the correct styling (red/rose background)
    const firstBadge = requiredBadges.first();
    await expect(firstBadge).toBeVisible();

    // Verify the badge has correct classes
    const badgeClass = await firstBadge.getAttribute('class');
    expect(badgeClass).toContain('bg-rose-100');
    expect(badgeClass).toContain('text-rose-700');

    console.log('✓ Required field badges are visible and styled correctly!');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/required-badges.png', fullPage: true });
  });
});
