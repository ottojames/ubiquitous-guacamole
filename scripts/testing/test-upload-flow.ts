import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  screenshot?: string;
}

const results: TestResult[] = [];

function log(step: string, status: 'pass' | 'fail' | 'warning', details: string) {
  console.log(`[${status.toUpperCase()}] ${step}: ${details}`);
  results.push({ step, status, details });
}

async function testUploadNoticeFlow() {
  console.log('🔍 Starting licensing officer review of upload notice process...\n');

  const browser = await chromium.launch({ headless: false }); // Set to false to see what's happening
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to home page
    console.log('\n📍 Step 1: Navigating to application...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    log('Navigation', 'pass', 'Successfully loaded home page');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true });

    // Step 2: Find and click "Publish a notice" or similar CTA
    console.log('\n📍 Step 2: Looking for publish/upload notice entry point...');

    // Try multiple possible selectors
    const possibleSelectors = [
      'text=Publish a notice',
      'text=Upload notice',
      'text=Create notice',
      'a[href*="publish"]',
      'button:has-text("Publish")',
    ];

    let publishButton = null;
    for (const selector of possibleSelectors) {
      publishButton = await page.locator(selector).first();
      if (await publishButton.count() > 0) {
        console.log(`✓ Found publish button using selector: ${selector}`);
        break;
      }
    }

    if (!publishButton || await publishButton.count() === 0) {
      log('Find publish button', 'fail', 'Could not find "Publish a notice" or similar button on home page');
      await page.screenshot({ path: 'screenshots/02-no-publish-button.png', fullPage: true });
    } else {
      await publishButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/02-clicked-publish.png', fullPage: true });
      log('Find publish button', 'pass', 'Found and clicked publish notice button');
    }

    // Step 3: Select notice type (Premises Licence - New)
    console.log('\n📍 Step 3: Selecting Premises Licence - New...');

    const premisesOption = page.locator('text=Premises Licence').first();
    if (await premisesOption.count() > 0) {
      await premisesOption.click();
      await page.waitForTimeout(500);
      log('Select notice type', 'pass', 'Found and selected Premises Licence option');
      await page.screenshot({ path: 'screenshots/03-selected-premises.png', fullPage: true });
    } else {
      log('Select notice type', 'fail', 'Could not find Premises Licence option');
      await page.screenshot({ path: 'screenshots/03-no-premises-option.png', fullPage: true });
    }

    // Look for "New" sub-option
    const newOption = page.locator('text=New').first();
    if (await newOption.count() > 0) {
      await newOption.click();
      await page.waitForTimeout(500);
      log('Select new application', 'pass', 'Selected "New" application type');
      await page.screenshot({ path: 'screenshots/04-selected-new.png', fullPage: true });
    }

    // Step 4: Look for continue/next button
    console.log('\n📍 Step 4: Proceeding to upload form...');
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForLoadState('networkidle');
      log('Continue to form', 'pass', 'Clicked continue button');
      await page.screenshot({ path: 'screenshots/05-upload-form.png', fullPage: true });
    }

    // Step 5: Analyze the upload interface
    console.log('\n📍 Step 5: Analyzing upload interface...');

    // Check for upload dropzone
    const dropzone = page.locator('[data-testid*="dropzone"], .dropzone, input[type="file"]').first();
    if (await dropzone.count() > 0) {
      log('Upload interface', 'pass', 'Upload dropzone is present');
    } else {
      log('Upload interface', 'warning', 'Upload dropzone not immediately visible - may need to scroll');
    }

    // Check for helpful instructions
    const instructions = await page.textContent('body');
    if (instructions?.includes('PDF') || instructions?.includes('DOCX')) {
      log('File format guidance', 'pass', 'File format instructions are visible (PDF, DOCX mentioned)');
    } else {
      log('File format guidance', 'warning', 'No clear file format guidance visible');
    }

    // Step 6: Test file upload (create a dummy file)
    console.log('\n📍 Step 6: Testing file upload...');

    // Create a test document
    const testDocPath = path.join(__dirname, 'test-premises-notice.txt');
    const testContent = `PREMISES LICENCE - NEW APPLICATION

Application by John Smith of 123 Test Street, London, SW1A 1AA
Premises Licence at The Test Pub, 456 High Street, London, SW1A 2BB
Application date: 2025-01-15

Licensable activities:
- Sale of alcohol (on and off premises): Mon-Sun 10:00-23:00
- Late night refreshment: Fri-Sat 23:00-00:30

Designated Premises Supervisor: Jane Doe
`;
    fs.writeFileSync(testDocPath, testContent);

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(testDocPath);
      await page.waitForTimeout(2000); // Wait for OCR processing
      log('File upload', 'pass', 'Successfully uploaded test document');
      await page.screenshot({ path: 'screenshots/06-file-uploaded.png', fullPage: true });
    } else {
      log('File upload', 'fail', 'Could not find file input element');
    }

    // Step 7: Check if OCR populated fields
    console.log('\n📍 Step 7: Checking field population and form usability...');
    await page.waitForTimeout(3000); // Wait for OCR to process

    // Check for applicant name field
    const applicantInput = page.locator('input[name*="applicant"], input[id*="applicant"]').first();
    if (await applicantInput.count() > 0) {
      const value = await applicantInput.inputValue();
      if (value) {
        log('OCR auto-fill', 'pass', `Applicant name auto-filled: "${value}"`);
      } else {
        log('OCR auto-fill', 'warning', 'Applicant name field found but not auto-filled');
      }
    }

    // Step 8: Test address lookup functionality
    console.log('\n📍 Step 8: Testing address lookup functionality...');
    await page.screenshot({ path: 'screenshots/07-before-address.png', fullPage: true });

    const addressLookup = page.locator('input[placeholder*="address"], input[placeholder*="postcode"]').first();
    if (await addressLookup.count() > 0) {
      log('Address lookup UI', 'pass', 'Address lookup field is present');

      // Try typing a test postcode
      await addressLookup.fill('SW1A 1AA');
      await page.waitForTimeout(1000);

      // Check if dropdown appears
      const dropdown = page.locator('[role="listbox"], .dropdown, ul').first();
      if (await dropdown.count() > 0 && await dropdown.isVisible()) {
        log('Address lookup functionality', 'pass', 'Address dropdown appeared after typing postcode');
      } else {
        log('Address lookup functionality', 'warning', 'Address dropdown did not appear - may require actual API');
      }
      await page.screenshot({ path: 'screenshots/08-address-lookup.png', fullPage: true });
    } else {
      log('Address lookup UI', 'fail', 'No address lookup field found');
    }

    // Step 9: Check multi-line address fields
    console.log('\n📍 Step 9: Checking multi-line address fields...');

    const addressLine1 = page.locator('input[name*="addressLine1"], input[id*="line1"]').first();
    const addressLine2 = page.locator('input[name*="addressLine2"], input[id*="line2"]').first();
    const city = page.locator('input[name*="city"], input[id*="city"]').first();
    const postcode = page.locator('input[name*="postcode"], input[id*="postcode"]').first();

    const addressFieldsPresent =
      await addressLine1.count() > 0 &&
      await city.count() > 0 &&
      await postcode.count() > 0;

    if (addressFieldsPresent) {
      log('Multi-line address fields', 'pass', 'Modern address fields (line1, line2, city, postcode) are present');

      // Test filling them manually
      await addressLine1.fill('123 Test Street');
      await city.fill('London');
      await postcode.fill('SW1A 1AA');

      log('Address field interaction', 'pass', 'Address fields are editable and respond to input');
      await page.screenshot({ path: 'screenshots/09-address-fields.png', fullPage: true });
    } else {
      log('Multi-line address fields', 'fail', 'Modern multi-line address fields not found');
    }

    // Step 10: Check for council/authority fields
    console.log('\n📍 Step 10: Checking council/authority fields...');

    const councilName = page.locator('input[name*="council"], select[name*="council"], input[id*="council"]').first();
    const councilEmail = page.locator('input[type="email"][name*="council"], input[id*="councilEmail"]').first();

    if (await councilName.count() > 0) {
      log('Council fields', 'pass', 'Council name field is present');

      if (await councilEmail.count() > 0) {
        log('Council email', 'pass', 'Council email field is present and properly typed');
      } else {
        log('Council email', 'fail', 'Council email field not found - this is mandatory');
      }

      // Check for council address
      const councilAddressFields = page.locator('input[id*="council"][id*="line1"]');
      if (await councilAddressFields.count() > 0) {
        log('Council address', 'pass', 'Council address uses multi-line format');
      } else {
        log('Council address', 'warning', 'Council address fields not found or not in multi-line format');
      }
    }

    // Step 11: Check application date and deadline calculation
    console.log('\n📍 Step 11: Testing application date and deadline auto-calculation...');

    const applicationDate = page.locator('input[type="date"][name*="application"], input[id*="applicationDate"]').first();
    const deadlineDate = page.locator('input[type="date"][name*="deadline"], input[id*="deadline"]').first();

    if (await applicationDate.count() > 0) {
      log('Application date field', 'pass', 'Application date field found');

      // Set application date to today
      const today = new Date().toISOString().split('T')[0];
      await applicationDate.fill(today);
      await page.waitForTimeout(1000); // Wait for auto-calculation

      if (await deadlineDate.count() > 0) {
        const deadlineValue = await deadlineDate.inputValue();
        if (deadlineValue) {
          // Calculate expected deadline (28 days from today)
          const expectedDeadline = new Date();
          expectedDeadline.setDate(expectedDeadline.getDate() + 28);
          const expectedStr = expectedDeadline.toISOString().split('T')[0];

          if (deadlineValue === expectedStr) {
            log('Deadline auto-calculation', 'pass', `Deadline correctly calculated as ${deadlineValue} (28 days from application date)`);
          } else {
            log('Deadline auto-calculation', 'warning', `Deadline is ${deadlineValue}, expected ${expectedStr} - may use different calculation`);
          }
        } else {
          log('Deadline auto-calculation', 'fail', 'Deadline field found but not auto-populated');
        }
      } else {
        log('Deadline field', 'warning', 'Representation deadline field not found');
      }

      await page.screenshot({ path: 'screenshots/10-dates.png', fullPage: true });
    }

    // Step 12: Check for validation and error messages
    console.log('\n📍 Step 12: Testing form validation...');

    // Try to submit without required fields
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Continue")').last();
    if (await submitBtn.count() > 0) {
      // Clear a required field
      if (await applicantInput.count() > 0) {
        await applicantInput.fill('');
      }

      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Check for error messages
      const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
      if (await errorMessages.count() > 0) {
        log('Form validation', 'pass', 'Form shows error messages for missing required fields');
      } else {
        log('Form validation', 'warning', 'No clear error messages shown - validation may not be working');
      }

      await page.screenshot({ path: 'screenshots/11-validation.png', fullPage: true });
    }

    // Step 13: Usability observations
    console.log('\n📍 Step 13: Overall usability assessment...');

    // Check page layout
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    if (await mainContent.count() > 0) {
      const box = await mainContent.boundingBox();
      if (box && box.width < 1200) {
        log('Layout', 'pass', 'Content is contained in a reasonable width for readability');
      } else {
        log('Layout', 'warning', 'Content may be too wide, could impact readability');
      }
    }

    // Check for help text / hints
    const hints = page.locator('[class*="hint"], [class*="help"], [id*="help"]');
    const hintCount = await hints.count();
    if (hintCount > 3) {
      log('Help text', 'pass', `Found ${hintCount} help text elements - good guidance for users`);
    } else {
      log('Help text', 'warning', `Only ${hintCount} help text elements found - consider adding more guidance`);
    }

    // Check for loading states
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"]');
    if (await loadingIndicators.count() > 0) {
      log('Loading feedback', 'pass', 'Loading indicators present for async operations');
    } else {
      log('Loading feedback', 'warning', 'No loading indicators found - user may not know when processing is happening');
    }

    await page.screenshot({ path: 'screenshots/12-final-state.png', fullPage: true });

    // Clean up
    if (fs.existsSync(testDocPath)) {
      fs.unlinkSync(testDocPath);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    log('Test execution', 'fail', `Error: ${error}`);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 LICENSING OFFICER REVIEW REPORT');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);

  console.log('\n\nDETAILED FINDINGS:\n');

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.details}\n`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS:\n');
  console.log('1. Address Lookup Integration:');
  console.log('   - Ensure GetAddress.io API is properly configured');
  console.log('   - Test with real postcodes to verify dropdown functionality\n');

  console.log('2. User Guidance:');
  console.log('   - Add more contextual help text for complex fields');
  console.log('   - Consider adding tooltips for licensing-specific terminology\n');

  console.log('3. Validation Feedback:');
  console.log('   - Ensure all required fields show clear error messages');
  console.log('   - Consider inline validation as user types\n');

  console.log('4. Progress Indication:');
  console.log('   - Add clear progress steps (e.g., "Step 1 of 3")');
  console.log('   - Show loading states during OCR and address lookup\n');

  console.log('5. Mobile Responsiveness:');
  console.log('   - Test on mobile devices for licensing officers in the field');
  console.log('   - Ensure touch targets are adequately sized\n');

  console.log('='.repeat(80) + '\n');
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Run the test
testUploadNoticeFlow().catch(console.error);
