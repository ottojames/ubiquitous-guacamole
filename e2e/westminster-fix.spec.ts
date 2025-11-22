import { test, expect } from '@playwright/test';

test('Westminster template placeholders are replaced with form data', async ({ page }) => {
  console.log('🧪 Starting Westminster template test...');

  // Navigate to Wilson & Partners firm portal
  await page.goto('http://localhost:5173/f/wilson-partners/publish');
  await page.waitForLoadState('networkidle');
  console.log('✓ Loaded firm portal');

  // Step 1: Expand Licensing Act 2003 category
  console.log('Step 1: Expanding Licensing Act 2003 category...');
  const licensingCategory = page.locator('summary:has-text("Licensing Act 2003")').first();
  await licensingCategory.click();
  await page.waitForTimeout(500);
  console.log('  ✓ Expanded Licensing category');

  // Step 2: Select notice type using data-testid
  console.log('Step 2: Selecting notice type...');
  await page.click('button[data-testid="notice-option-licensing-premises-new"]');
  await page.waitForTimeout(500);
  console.log('  ✓ Clicked Premises Licence - New');

  // Click Continue button to proceed to form
  await page.click('button[data-testid="notice-step-continue"]');
  await page.waitForTimeout(2000);
  console.log('✓ Selected notice type and proceeded to form');

  // Fill confirmation email (required for Continue button)
  await page.fill('input[type="email"]#email', 'test@example.com');
  console.log('✓ Filled confirmation email');

  // CRITICAL: Click "Structured template" button to switch to template mode
  await page.click('button:has-text("Structured template")');
  await page.waitForTimeout(1000);
  console.log('✓ Switched to Structured template mode');

  // Step 3: Fill out all form fields
  console.log('Step 3: Filling form fields...');

  // Based on TemplateBuilderForm.tsx, field names are: token.toLowerCase().replace(/_/g, '')
  // So APPLICANT_NAME -> applicantname, PREMISES_NAME -> premisesname, etc.

  // Applicant details
  await page.fill('input[name="applicantname"]', 'Test Applicant Ltd');
  console.log('  ✓ Filled applicant name');

  // Applicant address - CRITICAL: name has underscore applicant_addressLine1
  await page.fill('input[name="applicant_addressLine1"]', '123 Test Street');
  await page.fill('input[name="applicant_addressCity"]', 'London');
  await page.fill('input[name="applicant_addressPostcode"]', 'SW1A 1AA');
  console.log('  ✓ Filled applicant address');

  // Premises details
  await page.fill('input[name="premisesname"]', 'The Test Pub');
  console.log('  ✓ Filled premises name');

  // Premises address - CRITICAL: name has underscore premises_addressLine1
  await page.fill('input[name="premises_addressLine1"]', '456 High Street');
  await page.fill('input[name="premises_addressCity"]', 'Westminster');
  await page.fill('input[name="premises_addressPostcode"]', 'SW1A 2AA');
  console.log('  ✓ Filled premises address');

  // Dates - CRITICAL: date fields keep underscores
  const today = new Date().toISOString().split('T')[0];
  const deadline = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await page.fill('input[name="application_date"]', today);
  await page.fill('input[name="deadline_date"]', deadline);
  console.log('  ✓ Filled dates');

  // Step 4: Select Westminster City Council (CRITICAL!)
  console.log('Step 4: Selecting Westminster City Council...');
  const authorityInput = page.locator('input[name="authorityname"]').first();
  await authorityInput.click();
  await authorityInput.fill('Westminster');
  await page.waitForTimeout(1000); // Wait for dropdown

  // Click Westminster option
  const westminsterOption = page.locator('text=Westminster City Council').first();
  await westminsterOption.click();
  await page.waitForTimeout(500);
  console.log('  ✓ Selected Westminster City Council');

  // Step 5: Fill activities and hours (REQUIRED!)
  console.log('Step 5: Setting up activities and hours...');

  // Check the "Sale of alcohol – On the premises" checkbox
  const alcoholCheckbox = page.locator('#activity-alcohol_on');
  await alcoholCheckbox.check();
  await page.waitForTimeout(1000); // Wait for DPS fields to appear
  console.log('  ✓ Checked alcohol activity');

  // Fill DPS name (required when alcohol is selected)
  await page.fill('#dps-name', 'John Smith');
  console.log('  ✓ Filled DPS name');

  // Fill DPS licensing authority (optional but good to include)
  await page.fill('#dps-authority', 'Westminster City Council');
  console.log('  ✓ Filled DPS licensing authority');

  // Set hours using the "Copy to all days" button
  const copyToAllDaysBtn = page.locator('button:has-text("Copy to all days")').first();

  // First, uncheck the "None" checkbox for Monday to enable the time inputs
  const monNoneCheckbox = page.locator('input[type="checkbox"]').first();
  await monNoneCheckbox.uncheck();
  await page.waitForTimeout(300);
  console.log('  ✓ Unchecked Monday "None" checkbox');

  // Set Monday hours
  const monStartInput = page.locator('input[type="time"]').first();
  await monStartInput.fill('11:00');
  const monEndInput = page.locator('input[type="time"]').nth(1);
  await monEndInput.fill('23:00');
  await page.waitForTimeout(300);
  console.log('  ✓ Set Monday hours: 11:00-23:00');

  // Now copy to all days
  await copyToAllDaysBtn.click();
  await page.waitForTimeout(500);
  console.log('  ✓ Copied hours to all days');

  // Verify DPS field is filled (already done earlier as dpsname)

  // Step 6: Continue to next step
  console.log('Step 6: Proceeding to review...');
  const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').last();
  await nextBtn.click();
  await page.waitForTimeout(2000);

  // Step 7: Publish the notice
  console.log('Step 7: Publishing notice...');
  const publishBtn = page.locator('button:has-text("Publish"), button:has-text("Submit")').last();
  await publishBtn.click();

  // Wait for success modal
  console.log('Step 8: Waiting for success modal...');
  await page.waitForSelector('text=Notice Published', { timeout: 30000 });
  console.log('  ✓ Notice published successfully!');

  // Extract notice ID from the magic link
  const magicLinkInput = page.locator('input[value*="/notices/"]').first();
  const linkText = await magicLinkInput.inputValue();
  console.log('  Magic link:', linkText);

  const noticeIdMatch = linkText.match(/notices\/([a-f0-9-]+)/);
  if (!noticeIdMatch) {
    throw new Error('Could not extract notice ID from: ' + linkText);
  }

  const noticeId = noticeIdMatch[1];
  console.log('  Notice ID:', noticeId);

  // Step 9: Navigate to the notice and verify template rendering
  console.log('Step 9: Verifying template rendering...');
  await page.goto(`http://localhost:5173/notices/${noticeId}`);
  await page.waitForLoadState('networkidle');

  const noticeContent = await page.textContent('body');
  console.log('\n=== NOTICE CONTENT PREVIEW ===');
  console.log(noticeContent?.substring(0, 1000));
  console.log('==============================\n');

  // CRITICAL CHECKS: Verify placeholders are replaced
  const unreplacedTokens = noticeContent?.match(/\{\{[A-Z_]+\}\}/g);
  if (unreplacedTokens && unreplacedTokens.length > 0) {
    console.error('❌ FAILED: Found unreplaced tokens:', unreplacedTokens);
    throw new Error(`Template rendering failed! Found unreplaced tokens: ${unreplacedTokens.join(', ')}`);
  }
  console.log('✓ No unreplaced placeholders found');

  // Verify actual form data appears
  const assertions = [
    { value: 'Test Applicant Ltd', name: 'applicant name' },
    { value: 'The Test Pub', name: 'premises name' },
    { value: 'Westminster', name: 'Westminster location' },
    { value: 'Westminster City Council', name: 'council name' },
  ];

  for (const assertion of assertions) {
    if (!noticeContent?.includes(assertion.value)) {
      console.error(`❌ FAILED: Missing ${assertion.name}: ${assertion.value}`);
      throw new Error(`Notice does not contain ${assertion.name}`);
    }
    console.log(`✓ Found ${assertion.name}: ${assertion.value}`);
  }

  console.log('\n✅ SUCCESS! All placeholders properly replaced with form data.');
  console.log(`Notice URL: http://localhost:5173/notices/${noticeId}\n`);
});
