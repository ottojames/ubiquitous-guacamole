import { test, expect } from '@playwright/test';

test.describe('Address lookup - Chester addresses', () => {
  test('typing "9 lowe" returns multiple UK addresses including Chester', async ({ page }) => {
    // Start at step 1 and select a notice type
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select a notice type and continue to step 2
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Should now be on step 2
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Wait for the upload section to appear (use .first() to handle multiple matches)
    await expect(page.locator('text=Upload your notice').first()).toBeVisible({ timeout: 10000 });

    // Click "Use template instead" to reveal the form directly without uploading
    await page.locator('button:has-text("Use template instead")').first().click();

    // Wait for the form to appear
    await expect(page.locator('text=Applicant legal name')).toBeVisible({ timeout: 10000 });

    // Now find the address lookup input - it's in a combobox
    const addressInput = page.locator('[role="combobox"]').first();
    await addressInput.scrollIntoViewIfNeeded();
    await expect(addressInput).toBeVisible({ timeout: 5000 });

    // Click and type "9 lowe"
    await addressInput.click();
    await addressInput.fill('9 lowe');

    // Wait for the suggestions dropdown to appear
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 5000 });

    // Get all suggestions
    const suggestions = await page.locator('[role="option"]').allTextContents();

    console.log('Found suggestions:', suggestions);
    console.log('Total suggestions:', suggestions.length);

    // Verify we have multiple suggestions (not just the single London address)
    expect(suggestions.length).toBeGreaterThan(1);

    // Verify at least one Chester address is present
    const hasChesterAddress = suggestions.some(suggestion =>
      suggestion.toLowerCase().includes('chester')
    );
    expect(hasChesterAddress).toBe(true);

    // Verify specific Chester addresses are present
    const suggestionText = suggestions.join('\n');
    expect(suggestionText).toContain('Chester');

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/chester-address-dropdown.png', fullPage: true });

    console.log('✓ Chester addresses are showing in dropdown!');
  });

  test('selecting a Chester address populates the form fields correctly', async ({ page }) => {
    // Start at step 1 and select a notice type
    await page.goto('http://localhost:5173/publish/step-1');
    await page.waitForLoadState('networkidle');

    // Select a notice type and continue to step 2
    await page.getByTestId('notice-option-licensing-premises-new').click();
    await page.getByTestId('notice-step-continue').click();

    // Should now be on step 2
    await expect(page).toHaveURL(/\/publish\/step-2/);

    // Wait for the upload section to appear (use .first() to handle multiple matches)
    await expect(page.locator('text=Upload your notice').first()).toBeVisible({ timeout: 10000 });

    // Click "Use template instead" to reveal the form directly without uploading
    await page.locator('button:has-text("Use template instead")').first().click();

    // Wait for the form to appear
    await expect(page.locator('text=Applicant legal name')).toBeVisible({ timeout: 10000 });

    // Now find the address lookup input
    const addressInput = page.locator('[role="combobox"]').first();
    await addressInput.scrollIntoViewIfNeeded();
    await expect(addressInput).toBeVisible({ timeout: 5000 });

    // Type "9 lowe"
    await addressInput.click();
    await addressInput.fill('9 lowe');

    // Wait for suggestions
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible({ timeout: 5000 });

    // Find and click the Chester address
    const chesterOption = page.locator('[role="option"]:has-text("9 Lower Bridge Street, Chester")');
    await expect(chesterOption).toBeVisible({ timeout: 5000 });
    await chesterOption.click();

    // Wait a moment for the form to populate
    await page.waitForTimeout(500);

    // Verify the Address Line 1 field is populated
    const line1Input = page.locator('#premises-line1');
    await expect(line1Input).toHaveValue('9 Lower Bridge Street');

    // Verify the Town/City field is populated
    const cityInput = page.locator('#premises-city');
    await expect(cityInput).toHaveValue('Chester');

    // Verify the Postcode field is populated
    const postcodeInput = page.locator('#premises-postcode');
    await expect(postcodeInput).toHaveValue('CH1 1RS');

    console.log('✓ Chester address correctly populated all form fields!');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/chester-address-populated.png', fullPage: true });
  });
});
