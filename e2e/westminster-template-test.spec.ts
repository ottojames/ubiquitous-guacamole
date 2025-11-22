import { test, expect } from '@playwright/test';

test('Westminster custom template renders with form data', async ({ page }) => {
  // Navigate to Wilson & Partners firm portal
  await page.goto('http://localhost:5173/f/wilson-partners/publish');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Step 1: Fill out the Licensing Act 2003 form
  console.log('Step 1: Filling out form fields...');

  // Applicant details
  await page.fill('input[name="applicantName"]', 'Test Applicant Ltd');
  await page.fill('input[name="contactEmail"]', 'test@example.com');

  // Premises details
  await page.fill('input[name="premisesName"]', 'The Test Pub');
  await page.fill('input[name="premisesLine1"]', '123 Test Street');
  await page.fill('input[name="premisesCity"]', 'London');
  await page.fill('input[name="premisesPostcode"]', 'SW1A 1AA');

  // Dates
  const today = new Date().toISOString().split('T')[0];
  const deadline = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await page.fill('input[name="applicationDate"]', today);
  await page.fill('input[name="representationDeadline"]', deadline);

  // Activities
  const activitiesInput = page.locator('input[name="activities"]').or(page.locator('textarea[name="activities"]'));
  if (await activitiesInput.count() > 0) {
    await activitiesInput.first().fill('Sale of alcohol, Live music');
  }

  // Step 2: Select Westminster City Council
  console.log('Step 2: Selecting Westminster City Council...');
  const councilInput = page.locator('input[placeholder*="Search councils"], input[placeholder*="council"]').first();
  await councilInput.click();
  await councilInput.fill('Westminster');

  // Wait for dropdown and select Westminster
  await page.waitForTimeout(500);
  const westminsterOption = page.locator('text=Westminster City Council').first();
  await westminsterOption.click();

  // Step 3: Submit the form
  console.log('Step 3: Submitting form...');
  await page.waitForTimeout(1000);

  const submitButton = page.locator('button:has-text("Submit"), button:has-text("Publish")').last();
  await submitButton.click();

  // Step 4: Wait for success modal and get the notice URL
  console.log('Step 4: Waiting for success modal...');
  await page.waitForSelector('text=Notice Published', { timeout: 15000 });

  // Extract the notice URL from the magic link
  const magicLinkInput = page.locator('input[value*="/notices/"]').or(page.locator('text=/notices/[a-f0-9-]+/'));
  const linkText = await magicLinkInput.first().inputValue().catch(() =>
    magicLinkInput.first().textContent()
  );

  console.log('Notice published! Link:', linkText);

  // Step 5: Navigate to the notice and verify template rendering
  console.log('Step 5: Verifying template rendering...');

  // Extract notice ID from link
  const noticeIdMatch = linkText?.match(/notices\/([a-f0-9-]+)/);
  if (!noticeIdMatch) {
    throw new Error('Could not extract notice ID from: ' + linkText);
  }

  const noticeId = noticeIdMatch[1];
  await page.goto(`http://localhost:5173/notices/${noticeId}`);
  await page.waitForLoadState('networkidle');

  // Get the notice text
  const noticeContent = await page.textContent('body');

  console.log('\n=== NOTICE CONTENT ===');
  console.log(noticeContent?.substring(0, 1000));
  console.log('======================\n');

  // Verify that placeholders are replaced (should NOT contain {{)
  if (noticeContent?.includes('{{')) {
    const unreplacedTokens = noticeContent.match(/\{\{[A-Z_]+\}\}/g);
    console.error('❌ FAILED: Found unreplaced tokens:', unreplacedTokens);
    throw new Error(`Template rendering failed! Found unreplaced tokens: ${unreplacedTokens?.join(', ')}`);
  }

  // Verify that actual form data appears
  const assertions = [
    { value: 'Test Applicant Ltd', name: 'applicant name' },
    { value: 'The Test Pub', name: 'premises name' },
    { value: '123 Test Street', name: 'premises address' },
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
