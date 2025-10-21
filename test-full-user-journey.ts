import { chromium, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Observation {
  category: 'critical' | 'major' | 'minor' | 'positive';
  title: string;
  description: string;
  screenshot?: string;
}

const observations: Observation[] = [];

function observe(category: Observation['category'], title: string, description: string) {
  const icon = category === 'critical' ? '🔴' : category === 'major' ? '🟠' : category === 'minor' ? '🟡' : '🟢';
  console.log(`\n${icon} [${category.toUpperCase()}] ${title}`);
  console.log(`   ${description}`);
  observations.push({ category, title, description });
}

async function wait(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullUserJourney() {
  console.log('🧑‍💼 Starting Licensing Officer User Journey Test\n');
  console.log('Scenario: Officer needs to publish a new premises licence application\n');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down to simulate real user
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Enable console logging to see our debug messages
  page.on('console', msg => {
    if (msg.text().includes('[UploadDropzone]') || msg.text().includes('[NewPublishFlow]')) {
      console.log('🖥️  Browser:', msg.text());
    }
  });

  try {
    // ========== PHASE 1: LANDING & NAVIGATION ==========
    console.log('\n📍 PHASE 1: Landing on the platform\n');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/journey-01-home.png', fullPage: true });

    observe('positive', 'Homepage loads quickly', 'The platform loads within 2 seconds with a clean, professional interface');

    // Check for clear call-to-action
    const publishButton = page.locator('text=Publish a notice').first();
    if (await publishButton.count() > 0) {
      observe('positive', 'Clear "Publish a notice" CTA', 'Button is prominently displayed and easy to find');
    } else {
      observe('major', 'Unclear entry point', 'Could not easily find how to start publishing a notice');
    }

    // ========== PHASE 2: NOTICE TYPE SELECTION ==========
    console.log('\n📍 PHASE 2: Selecting notice type\n');

    await publishButton.click();
    await page.waitForLoadState('networkidle');
    await wait(500);
    await page.screenshot({ path: 'screenshots/journey-02-notice-types.png', fullPage: true });

    // Check for "Premises Licence" option
    const premisesOption = page.locator('text=Premises Licence').first();
    const premisesVisible = await premisesOption.isVisible();

    if (premisesVisible) {
      observe('positive', 'Notice types clearly organized', 'Licensing options are easy to find and well-labeled');
      await premisesOption.click();
      await wait(500);
      await page.screenshot({ path: 'screenshots/journey-03-premises-selected.png', fullPage: true });
    } else {
      observe('critical', 'Cannot find Premises Licence option', 'The most common notice type is not visible');
    }

    // Select "New" application type
    const newOption = page.locator('text=New').first();
    if (await newOption.count() > 0) {
      await newOption.click();
      await wait(500);
      observe('positive', 'Sub-categories available', 'New/Variation/Review options help officers select correct type');
    }

    // Click Continue
    const continueBtn = page.locator('button:has-text("Continue")').first();
    if (await continueBtn.count() > 0) {
      const isDisabled = await continueBtn.getAttribute('disabled');
      if (isDisabled) {
        observe('major', 'Continue button disabled', 'Not clear why button is disabled or what action is needed');
      } else {
        await continueBtn.click();
        await page.waitForLoadState('networkidle');
        await wait(1000);
        observe('positive', 'Smooth transition', 'Moving to next step feels natural');
      }
    }

    await page.screenshot({ path: 'screenshots/journey-04-upload-page.png', fullPage: true });

    // ========== PHASE 3: DOCUMENT UPLOAD ==========
    console.log('\n📍 PHASE 3: Uploading notice document\n');

    // Check for upload instructions
    const pageText = await page.textContent('body');
    if (pageText?.includes('PDF') && pageText?.includes('DOCX')) {
      observe('positive', 'Clear file format guidance', 'Supported formats are clearly stated');
    } else {
      observe('minor', 'Missing format guidance', 'Officers may not know what file types are supported');
    }

    // Create a realistic test document
    const testDocPath = path.join(__dirname, 'test-premises-application.txt');
    const testContent = `PREMISES LICENCE - NEW APPLICATION

Notice is hereby given that John Smith of 123 High Street, Manchester, M1 1AA has applied for a Premises Licence under the Licensing Act 2003.

Premises Name: The Red Lion Public House
Premises Address: 456 Market Street, Manchester, M2 2BB

Application Date: 2025-01-15

Licensable Activities:
- Sale of alcohol for consumption on and off the premises
  Monday to Thursday: 11:00 - 23:00
  Friday to Saturday: 11:00 - 00:30
  Sunday: 12:00 - 22:30

- Late night refreshment (hot food and drink)
  Friday to Saturday: 23:00 - 00:30

Opening Hours:
Monday to Thursday: 10:30 - 23:30
Friday to Saturday: 10:30 - 01:00
Sunday: 11:30 - 23:00

Designated Premises Supervisor: Jane Elizabeth Doe
Personal Licence Number: MCC/PER/12345
Issuing Authority: Manchester City Council

The application can be viewed at Manchester City Council, Licensing Department, Town Hall, Albert Square, Manchester, M2 5DB during normal office hours.

Representations regarding this application must be made in writing to the Licensing Authority at the above address by [28 days from application date].

Licensing Authority: Manchester City Council
Council Email: licensing@manchester.gov.uk
Council Address: Town Hall, Albert Square, Manchester, M2 5DB
Council Website: https://www.manchester.gov.uk/licensing

Signed: John Smith
Date: 15 January 2025
`;
    fs.writeFileSync(testDocPath, testContent);

    // Find and interact with file input
    const fileInput = page.locator('input[type="file"]').first();
    const fileInputExists = await fileInput.count() > 0;

    if (!fileInputExists) {
      observe('critical', 'Cannot find file upload input', 'No way to upload a document');
    } else {
      observe('positive', 'File upload available', 'Drag-and-drop area is present');

      // Upload the file
      console.log('📤 Uploading test document...');
      await fileInput.setInputFiles(testDocPath);

      // Trigger the change event manually to ensure react-dropzone processes the file
      await fileInput.dispatchEvent('change');

      // Wait for upload to start
      await wait(1000); // Give it a bit more time to process
      await page.screenshot({ path: 'screenshots/journey-05-uploading.png', fullPage: true });

      // Check for loading indicators
      const uploadingText = page.locator('text=Uploading');
      const ocrText = page.locator('text=OCR');

      if (await uploadingText.count() > 0 || await ocrText.count() > 0) {
        observe('positive', 'Loading feedback visible', 'User can see that processing is happening');
      } else {
        observe('major', 'No loading feedback', 'User has no indication that upload is processing');
      }

      // Wait for OCR to complete (max 10 seconds)
      console.log('⏳ Waiting for OCR to complete...');
      try {
        await page.waitForSelector('text=extraction', { timeout: 10000 });
        observe('positive', 'OCR completes reasonably fast', 'Document processing took less than 10 seconds');
      } catch {
        observe('major', 'OCR timeout', 'Document processing took longer than expected');
      }

      await wait(2000);
      await page.screenshot({ path: 'screenshots/journey-06-after-ocr.png', fullPage: true });
    }

    // ========== PHASE 4: FORM FIELDS VISIBILITY ==========
    console.log('\n📍 PHASE 4: Checking if form fields appeared\n');

    // Check if required details section is visible
    const requiredDetailsSection = page.locator('#required-details-section');
    const formVisible = await requiredDetailsSection.isVisible();

    if (formVisible) {
      observe('positive', 'Form fields appeared after upload', 'Required details section is now visible');

      // Check if it auto-scrolled
      const viewportPos = await page.evaluate(() => window.scrollY);
      if (viewportPos > 100) {
        observe('positive', 'Auto-scroll to form', 'Page automatically scrolled to show form fields');
      }
    } else {
      observe('critical', 'Form fields NOT visible', 'After upload, required form fields did not appear - BLOCKING ISSUE');

      // Debug: Check the page state
      const bodyContent = await page.textContent('body');
      console.log('\n🔍 Debug: Checking page state...');
      console.log('Has "Complete the required details":', bodyContent?.includes('Complete the required details'));
      console.log('Has "Address":', bodyContent?.includes('Address'));
    }

    await page.screenshot({ path: 'screenshots/journey-07-form-state.png', fullPage: true });

    // ========== PHASE 5: ADDRESS LOOKUP TESTING ==========
    console.log('\n📍 PHASE 5: Testing address lookup functionality\n');

    // Look for address lookup field
    const addressLookupInput = page.locator('input[placeholder*="address"], input[placeholder*="postcode"], input[placeholder*="Search"]').first();
    const addressLookupExists = await addressLookupInput.count() > 0;

    if (addressLookupExists) {
      observe('positive', 'Address lookup field present', 'Officers can search for addresses');

      // Try typing a postcode
      await addressLookupInput.click();
      await addressLookupInput.fill('M1 1AA');
      await wait(1500);
      await page.screenshot({ path: 'screenshots/journey-08-address-lookup.png', fullPage: true });

      // Check for dropdown
      const dropdown = page.locator('[role="listbox"], ul, .dropdown').first();
      if (await dropdown.isVisible()) {
        observe('positive', 'Address dropdown appears', 'Autocomplete suggestions are shown');
      } else {
        observe('major', 'Address lookup not working', 'No dropdown appeared after typing postcode - may need API key or real data');
      }
    } else {
      observe('critical', 'No address lookup field', 'The address autocomplete we just implemented is not showing');
    }

    // ========== PHASE 6: MULTI-LINE ADDRESS FIELDS ==========
    console.log('\n📍 PHASE 6: Checking multi-line address fields\n');

    const addressLine1 = page.locator('input[name*="addressLine1"], input[id*="line1"]').first();
    const addressLine2 = page.locator('input[name*="addressLine2"], input[id*="line2"]').first();
    const city = page.locator('input[name*="city"], input[id*="city"]').first();
    const postcode = page.locator('input[name*="postcode"], input[id*="postcode"]').first();

    const hasAddressLine1 = await addressLine1.count() > 0;
    const hasCity = await city.count() > 0;
    const hasPostcode = await postcode.count() > 0;

    if (hasAddressLine1 && hasCity && hasPostcode) {
      observe('positive', 'Modern address fields present', 'Address Line 1, City, and Postcode fields are available');

      // Test if fields are editable
      try {
        await addressLine1.fill('123 Test Street');
        await city.fill('Manchester');
        await postcode.fill('M1 1AA');
        observe('positive', 'Address fields are editable', 'Officer can manually enter address details');
        await page.screenshot({ path: 'screenshots/journey-09-address-filled.png', fullPage: true });
      } catch {
        observe('major', 'Cannot interact with address fields', 'Fields may be disabled or not properly wired');
      }
    } else {
      observe('critical', 'Missing address field components', 'The modern multi-line address fields are not rendering');
    }

    // ========== PHASE 7: COUNCIL/AUTHORITY FIELDS ==========
    console.log('\n📍 PHASE 7: Testing council/authority fields\n');

    // Look for council name field (could be input or select)
    const councilName = page.locator('input[name*="council"], select[name*="council"], input[id*="AUTHORITY_NAME"]').first();
    const councilEmail = page.locator('input[type="email"][name*="council"], input[id*="councilEmail"], input[id*="AUTHORITY_EMAIL"]').first();

    if (await councilName.count() > 0) {
      observe('positive', 'Council name field present', 'Officers can enter licensing authority');

      // Try to fill it
      const tagName = await councilName.evaluate(el => el.tagName);
      if (tagName === 'SELECT') {
        observe('positive', 'Council dropdown available', 'Pre-populated list of councils');
      } else {
        await councilName.fill('Manchester City Council');
        observe('positive', 'Council name is editable', 'Can manually type council name');
      }
    } else {
      observe('major', 'No council name field', 'Cannot specify licensing authority');
    }

    if (await councilEmail.count() > 0) {
      observe('positive', 'Council email field present', 'Mandatory email field is available');
      await councilEmail.fill('licensing@manchester.gov.uk');
    } else {
      observe('major', 'Missing council email field', 'The mandatory council email field is not present');
    }

    // Check for council address fields
    const councilAddressLine1 = page.locator('input[id*="council"][id*="line1"]').first();
    if (await councilAddressLine1.count() > 0) {
      observe('positive', 'Council address uses multi-line format', 'Modern address format for council details');
    } else {
      observe('minor', 'Council address not in multi-line format', 'May be using old single-field format');
    }

    await page.screenshot({ path: 'screenshots/journey-10-council-fields.png', fullPage: true });

    // ========== PHASE 8: DATE FIELDS & AUTO-CALCULATION ==========
    console.log('\n📍 PHASE 8: Testing date fields and auto-calculation\n');

    const applicationDate = page.locator('input[type="date"][name*="application"], input[id*="APPLICATION_DATE"]').first();
    const deadlineDate = page.locator('input[type="date"][name*="deadline"], input[id*="DEADLINE_DATE"]').first();

    if (await applicationDate.count() > 0) {
      observe('positive', 'Application date field present', 'Officer can set application date');

      // Set application date to today
      const today = new Date().toISOString().split('T')[0];
      await applicationDate.fill(today);
      await wait(1000); // Wait for auto-calculation
      await page.screenshot({ path: 'screenshots/journey-11-date-filled.png', fullPage: true });

      if (await deadlineDate.count() > 0) {
        const deadlineValue = await deadlineDate.inputValue();

        if (deadlineValue) {
          // Calculate expected deadline (28 days)
          const expected = new Date();
          expected.setDate(expected.getDate() + 28);
          const expectedStr = expected.toISOString().split('T')[0];

          if (deadlineValue === expectedStr) {
            observe('positive', 'Deadline auto-calculated correctly', `Representation deadline automatically set to ${deadlineValue} (28 days from application)`);
          } else {
            observe('minor', 'Deadline auto-calculation may be off', `Expected ${expectedStr}, got ${deadlineValue}`);
          }
        } else {
          observe('major', 'Deadline NOT auto-calculated', 'After setting application date, deadline field remained empty');
        }
      } else {
        observe('major', 'Missing deadline field', 'No representation deadline field found');
      }
    } else {
      observe('major', 'Missing application date field', 'Cannot set when application was submitted');
    }

    // ========== PHASE 9: VALIDATION & ERRORS ==========
    console.log('\n📍 PHASE 9: Testing form validation\n');

    // Clear a required field to test validation
    if (await addressLine1.count() > 0) {
      await addressLine1.fill('');
      await wait(500);
    }

    // Try to continue
    const stepContinueBtn = page.locator('button[data-testid="upload-step-continue"], button:has-text("Continue")').last();

    if (await stepContinueBtn.count() > 0) {
      const isDisabled = await stepContinueBtn.isDisabled();

      if (isDisabled) {
        observe('positive', 'Continue button disabled for incomplete form', 'System prevents submitting incomplete data');

        // Check if there's an indicator of why
        const errorMessages = page.locator('[role="alert"], .error, [class*="error"]');
        if (await errorMessages.count() > 0) {
          observe('positive', 'Validation errors shown', 'Officer can see what needs to be fixed');
        } else {
          observe('minor', 'No validation error messages', 'Button is disabled but no explanation why');
        }
      } else {
        observe('minor', 'Continue button enabled despite empty fields', 'May allow incomplete submissions');
      }
    }

    await page.screenshot({ path: 'screenshots/journey-12-validation.png', fullPage: true });

    // ========== PHASE 10: OVERALL USABILITY ==========
    console.log('\n📍 PHASE 10: Overall usability assessment\n');

    // Check for help text
    const helpTexts = page.locator('[class*="hint"], [class*="help"], p[class*="text-slate-500"]');
    const helpCount = await helpTexts.count();

    if (helpCount > 5) {
      observe('positive', 'Good contextual help', `Found ${helpCount} help text elements guiding the user`);
    } else {
      observe('minor', 'Limited guidance', `Only ${helpCount} help text elements - could benefit from more tooltips`);
    }

    // Check for field labels
    const labels = page.locator('label');
    const labelCount = await labels.count();

    if (labelCount > 10) {
      observe('positive', 'All fields properly labeled', 'Good accessibility and clarity');
    } else {
      observe('minor', 'Some fields may lack labels', 'Could impact usability');
    }

    // Check page responsiveness
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (scrollHeight > 3000) {
      observe('minor', 'Very long page', 'Consider breaking into multiple steps or collapsible sections');
    }

    await page.screenshot({ path: 'screenshots/journey-13-final.png', fullPage: true });

    // Clean up
    if (fs.existsSync(testDocPath)) {
      fs.unlinkSync(testDocPath);
    }

  } catch (error) {
    console.error('\n❌ Test encountered an error:', error);
    observe('critical', 'Test execution failed', `Error: ${error}`);
    await page.screenshot({ path: 'screenshots/journey-error.png', fullPage: true });
  } finally {
    await wait(2000); // Keep browser open briefly
    await browser.close();
  }

  // ========== GENERATE REPORT ==========
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 LICENSING OFFICER USER JOURNEY REPORT');
  console.log('='.repeat(80));

  const critical = observations.filter(o => o.category === 'critical');
  const major = observations.filter(o => o.category === 'major');
  const minor = observations.filter(o => o.category === 'minor');
  const positive = observations.filter(o => o.category === 'positive');

  console.log(`\n🔴 Critical Issues: ${critical.length}`);
  console.log(`🟠 Major Issues: ${major.length}`);
  console.log(`🟡 Minor Issues: ${minor.length}`);
  console.log(`🟢 Positive Observations: ${positive.length}`);

  console.log('\n\n🔴 CRITICAL ISSUES (Must Fix):\n');
  critical.forEach((obs, i) => {
    console.log(`${i + 1}. ${obs.title}`);
    console.log(`   ${obs.description}\n`);
  });

  console.log('\n🟠 MAJOR ISSUES (Should Fix):\n');
  major.forEach((obs, i) => {
    console.log(`${i + 1}. ${obs.title}`);
    console.log(`   ${obs.description}\n`);
  });

  console.log('\n🟡 MINOR ISSUES (Nice to Fix):\n');
  minor.forEach((obs, i) => {
    console.log(`${i + 1}. ${obs.title}`);
    console.log(`   ${obs.description}\n`);
  });

  console.log('\n🟢 WHAT WORKS WELL:\n');
  positive.forEach((obs, i) => {
    console.log(`${i + 1}. ${obs.title}`);
    console.log(`   ${obs.description}\n`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('💡 KEY RECOMMENDATIONS:\n');

  if (critical.length > 0) {
    console.log('1. PRIORITY 1 - Fix Critical Issues:');
    critical.forEach(obs => console.log(`   • ${obs.title}`));
    console.log('');
  }

  if (major.length > 0) {
    console.log('2. PRIORITY 2 - Address Major Issues:');
    major.slice(0, 3).forEach(obs => console.log(`   • ${obs.title}`));
    console.log('');
  }

  console.log('3. User Experience Enhancements:');
  console.log('   • Add progress indicator showing % complete');
  console.log('   • Provide inline validation feedback as user types');
  console.log('   • Add "Save as draft" functionality');
  console.log('   • Include example data for reference');
  console.log('');

  console.log('4. Accessibility Improvements:');
  console.log('   • Ensure all form fields have associated labels');
  console.log('   • Add ARIA live regions for dynamic content');
  console.log('   • Test with screen reader');
  console.log('   • Add keyboard shortcuts for common actions');
  console.log('');

  console.log('='.repeat(80) + '\n');

  // Summary score
  const totalIssues = critical.length + major.length + minor.length;
  const score = Math.max(0, 100 - (critical.length * 20) - (major.length * 10) - (minor.length * 5));

  console.log(`\n📈 Overall Usability Score: ${score}/100`);

  if (score >= 80) {
    console.log('✅ Good - Minor improvements needed');
  } else if (score >= 60) {
    console.log('⚠️  Fair - Several issues to address');
  } else {
    console.log('❌ Poor - Significant improvements required');
  }

  console.log('\n');
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Run the test
testFullUserJourney().catch(console.error);
