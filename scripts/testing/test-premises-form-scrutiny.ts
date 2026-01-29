import { chromium, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Observation {
  category: 'critical' | 'major' | 'minor' | 'positive';
  phase: string;
  title: string;
  description: string;
  screenshot?: string;
}

const observations: Observation[] = [];

function observe(category: Observation['category'], phase: string, title: string, description: string) {
  const icon = category === 'critical' ? '🔴' : category === 'major' ? '🟠' : category === 'minor' ? '🟡' : '🟢';
  console.log(`\n${icon} [${category.toUpperCase()}] ${title}`);
  console.log(`   ${description}`);
  observations.push({ category, phase, title, description });
}

async function wait(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Realistic premises licence application text
const MOCK_OCR_TEXT = `PREMISES LICENCE - NEW APPLICATION

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

Representations regarding this application must be made in writing to the Licensing Authority at the above address by 12 February 2025.

Licensing Authority: Manchester City Council
Council Email: licensing@manchester.gov.uk
Council Address: Town Hall, Albert Square, Manchester, M2 5DB
Council Website: https://www.manchester.gov.uk/licensing

Signed: John Smith
Date: 15 January 2025`;

async function testPremisesLicenceForm() {
  console.log('🧑‍💼 PREMISES LICENCE FORM - LICENSING OFFICER UX SCRUTINY\n');
  console.log('Perspective: Experienced licensing officer reviewing the upload & form flow');
  console.log('Task: Upload a premises licence application and complete all required fields\n');
  console.log('='.repeat(80) + '\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150 // Simulate realistic user speed
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Intercept upload API to bypass react-dropzone issues
  await page.route('**/api/upload', async route => {
    console.log('📤 [MOCKED] Upload API intercepted - returning test data');
    await wait(800); // Simulate realistic OCR processing time
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        text: MOCK_OCR_TEXT,
        ocr_text: MOCK_OCR_TEXT,
        meta: { engine: 'test', pageCount: 1, bytes: MOCK_OCR_TEXT.length }
      })
    });
  });

  // Intercept AI summary API
  await page.route('**/api/ai-summary', async route => {
    console.log('🤖 [MOCKED] AI Summary API intercepted');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: 'New premises licence application for The Red Lion Public House for sale of alcohol and late night refreshment.'
      })
    });
  });

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('[UploadDropzone]') || msg.text().includes('[NewPublishFlow]')) {
      console.log('🖥️  Browser:', msg.text());
    }
  });

  try {
    // ========== PHASE 1: NAVIGATION & NOTICE TYPE SELECTION ==========
    console.log('\n📍 PHASE 1: Navigation & Notice Type Selection\n');

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/scrutiny-01-home.png', fullPage: true });

    const loadTime = await page.evaluate(() => performance.now());
    if (loadTime < 3000) {
      observe('positive', 'Performance', 'Fast initial load', `Page loaded in ${Math.round(loadTime)}ms - excellent`);
    } else {
      observe('minor', 'Performance', 'Slow initial load', `Page took ${Math.round(loadTime)}ms to load`);
    }

    // Check branding and clarity
    const heading = await page.textContent('h1');
    if (heading?.includes('Publish') || heading?.includes('Notice')) {
      observe('positive', 'Clarity', 'Clear value proposition', 'Heading immediately communicates purpose');
    } else {
      observe('minor', 'Clarity', 'Unclear purpose', 'Main heading does not clearly state what the platform does');
    }

    // Navigate to publish flow
    const publishBtn = page.locator('text=Publish a notice').first();
    if (await publishBtn.isVisible()) {
      observe('positive', 'Navigation', 'Obvious CTA', 'Primary action button is easy to find');
      await publishBtn.click();
      await page.waitForLoadState('networkidle');
    } else {
      observe('critical', 'Navigation', 'Cannot find publish button', 'No clear way to start publishing');
      throw new Error('Cannot proceed without publish button');
    }

    await wait(500);
    await page.screenshot({ path: 'screenshots/scrutiny-02-notice-types.png', fullPage: true });

    // Evaluate notice type selection screen
    const noticeTypeCards = page.locator('[class*="card"], [role="button"]');
    const cardCount = await noticeTypeCards.count();

    if (cardCount >= 3) {
      observe('positive', 'Organization', 'Clear notice type options', `${cardCount} notice types presented clearly`);
    } else {
      observe('minor', 'Organization', 'Limited notice types', 'May need more licensing categories');
    }

    // Select Premises Licence
    const premisesOption = page.locator('text=Premises Licence').first();
    if (await premisesOption.isVisible()) {
      await premisesOption.click();
      await wait(300);

      // Check for sub-options
      const newOption = page.locator('text=New').first();
      const variationOption = page.locator('text=Variation').first();

      if (await newOption.count() > 0 && await variationOption.count() > 0) {
        observe('positive', 'Categorization', 'Sub-types available', 'New/Variation/Review options help narrow selection');
        await newOption.click();
        await wait(300);
      } else {
        observe('minor', 'Categorization', 'No sub-types', 'Missing New/Variation/Review distinction');
      }
    } else {
      observe('critical', 'Navigation', 'Premises Licence not found', 'Most common notice type is missing');
      throw new Error('Cannot find Premises Licence option');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-03-selected-type.png', fullPage: true });

    // Click Continue
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const isDisabled = await continueBtn.isDisabled();

    if (!isDisabled) {
      observe('positive', 'Validation', 'Continue enabled after selection', 'Button state reflects form validity');
      await continueBtn.click();
      await page.waitForLoadState('networkidle');
      await wait(1000);
    } else {
      observe('major', 'Validation', 'Continue button stuck disabled', 'Cannot proceed after selecting notice type');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-04-upload-page.png', fullPage: true });

    // ========== PHASE 2: UPLOAD METHOD SELECTION ==========
    console.log('\n📍 PHASE 2: Upload Method Selection\n');

    // Check for method selection buttons
    const uploadOcrBtn = page.locator('button:has-text("Upload"), button:has-text("OCR")').first();
    const structuredBtn = page.locator('button:has-text("Structured"), button:has-text("template")').first();

    if (await uploadOcrBtn.count() > 0 && await structuredBtn.count() > 0) {
      observe('positive', 'Choice', 'Dual input methods', 'Officers can upload notice OR use structured template');

      // Check if one is pre-selected
      const uploadSelected = await uploadOcrBtn.evaluate(el =>
        el.classList.contains('bg-blue') || el.getAttribute('aria-selected') === 'true'
      );

      if (uploadSelected) {
        observe('positive', 'UX', 'Upload pre-selected', 'Logical default for most common workflow');
      }
    } else {
      observe('major', 'Choice', 'Missing method selection', 'No clear way to choose between upload and template');
    }

    // ========== PHASE 3: FILE UPLOAD EXPERIENCE ==========
    console.log('\n📍 PHASE 3: File Upload Experience\n');

    // Check upload zone design
    const uploadZone = page.locator('[data-testid="upload-dropzone"]').first();
    if (await uploadZone.isVisible()) {
      observe('positive', 'Visibility', 'Upload dropzone present', 'Clear drag-and-drop area');

      // Check for helpful text
      const uploadText = await page.textContent('[data-testid="upload-dropzone"]');
      if (uploadText?.includes('PDF') || uploadText?.includes('DOCX')) {
        observe('positive', 'Guidance', 'File format guidance visible', 'Officer knows what file types are accepted');
      } else {
        observe('minor', 'Guidance', 'Missing format hints', 'Should show accepted file types');
      }

      // Check for security/encryption messaging
      if (uploadText?.includes('Encrypt') || uploadText?.includes('secure')) {
        observe('positive', 'Trust', 'Security messaging present', 'Builds confidence in upload process');
      } else {
        observe('minor', 'Trust', 'No security indicators', 'Officers may hesitate to upload sensitive documents');
      }
    } else {
      observe('critical', 'Functionality', 'No upload zone', 'Cannot upload documents');
    }

    // Since file upload simulation doesn't work with react-dropzone in Playwright,
    // we'll test the MANUAL ENTRY path instead, which is equally important for licensing officers
    // who may need to type in details from a physical notice
    console.log('📝 Testing manual entry path (skipping file upload simulation)...');

    observe('minor', 'Testing', 'Skipped upload test', 'File upload requires real backend - testing manual entry instead');

    // Scroll down to see if there are any fields visible by default
    await page.evaluate(() => window.scrollTo(0, 600));
    await wait(1000);
    await page.screenshot({ path: 'screenshots/scrutiny-05-manual-entry.png', fullPage: true });

    // Look for any visible input fields in the "Complete required fields" section
    const visibleFields = await page.locator('input[type="text"]:visible, select:visible, textarea:visible').count();
    console.log(`Found ${visibleFields} visible input fields`);

    if (visibleFields > 0) {
      observe('positive', 'Flow', 'Form fields visible for manual entry', 'Officers can start typing immediately');
    } else {
      observe('critical', 'Flow', 'No fields visible for manual entry', 'Cannot enter data without upload');
    }

    // ========== PHASE 4: FORM VISIBILITY & STRUCTURE ==========
    console.log('\n📍 PHASE 4: Form Visibility & Structure\n');

    // Check for form organization
    const sectionHeadings = page.locator('h4, h3, h2').filter({ hasText: /applicant|premises|authority|licensing|deadline|complete|required/i });
    const headingCount = await sectionHeadings.count();

    if (headingCount >= 1) {
      observe('positive', 'Organization', 'Form has section headings', `${headingCount} sections help organize the form`);
    } else {
      observe('minor', 'Organization', 'No section headings', 'Form could benefit from clearer structure');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-06-form-structure.png', fullPage: true });

    // ========== PHASE 5: FIELD-BY-FIELD SCRUTINY ==========
    console.log('\n📍 PHASE 5: Individual Field Quality\n');

    // Check for specific required fields
    const fieldChecks = [
      { name: 'Application Type', selector: 'select[id*="APPLICATION_TYPE"], input[id*="APPLICATION_TYPE"]' },
      { name: 'Applicant Name', selector: 'input[id*="APPLICANT_NAME"]' },
      { name: 'Premises Address', selector: 'textarea[id*="PREMISES_ADDRESS"], input[id*="PREMISES_ADDRESS"]' },
      { name: 'Premises Name', selector: 'input[id*="PREMISES_NAME"]' },
      { name: 'Authority Name', selector: 'input[id*="AUTHORITY_NAME"]' },
      { name: 'Authority Email', selector: 'input[id*="AUTHORITY_EMAIL"]' },
      { name: 'Application Date', selector: 'input[id*="APPLICATION_DATE"]' },
      { name: 'Deadline Date', selector: 'input[id*="DEADLINE_DATE"]' },
      { name: 'Licensable Activities', selector: 'input[id*="LICENSABLE_ACTIVITIES"], textarea[id*="LICENSABLE_ACTIVITIES"]' },
    ];

    let fieldsFound = 0;
    let fieldsWithLabels = 0;
    let fieldsWithHints = 0;

    for (const field of fieldChecks) {
      const element = page.locator(field.selector).first();
      const exists = await element.count() > 0;

      if (exists) {
        fieldsFound++;

        // Check for label
        const fieldId = await element.getAttribute('id');
        const label = fieldId ? page.locator(`label[for="${fieldId}"]`).first() : null;
        const hasLabel = label ? await label.count() > 0 : false;

        if (hasLabel) {
          fieldsWithLabels++;
        }

        // Check for hint text nearby
        const parent = element.locator('xpath=..');
        const parentText = await parent.textContent();
        if (parentText && (parentText.length > field.name.length + 50)) {
          fieldsWithHints++;
        }

        console.log(`  ✓ ${field.name}: Found ${hasLabel ? '(labeled)' : '(no label)'}`);
      } else {
        console.log(`  ✗ ${field.name}: Missing`);
      }
    }

    observe(
      fieldsFound >= 7 ? 'positive' : fieldsFound >= 5 ? 'minor' : 'major',
      'Completeness',
      `${fieldsFound}/${fieldChecks.length} required fields present`,
      `Field coverage: ${Math.round(fieldsFound / fieldChecks.length * 100)}%`
    );

    if (fieldsWithLabels / Math.max(fieldsFound, 1) > 0.9) {
      observe('positive', 'Accessibility', 'Excellent label coverage', `${fieldsWithLabels}/${fieldsFound} fields have labels`);
    } else {
      observe('major', 'Accessibility', 'Missing labels', `Only ${fieldsWithLabels}/${fieldsFound} fields labeled - screen reader issues`);
    }

    if (fieldsWithHints >= 3) {
      observe('positive', 'Guidance', 'Helpful field hints', `${fieldsWithHints} fields have explanatory text`);
    } else {
      observe('minor', 'Guidance', 'Limited help text', 'More field-level guidance would help officers');
    }

    // ========== PHASE 6: ADDRESS HANDLING ==========
    console.log('\n📍 PHASE 6: Address Input Experience\n');

    // Look for address lookup/autocomplete
    const addressLookup = page.locator('input[placeholder*="postcode" i], input[placeholder*="search" i], input[placeholder*="address" i]').first();
    const hasAddressLookup = await addressLookup.count() > 0;

    if (hasAddressLookup) {
      observe('positive', 'Convenience', 'Address lookup present', 'Officers can search for addresses instead of typing');

      // Test address lookup
      await addressLookup.click();
      await addressLookup.fill('M2 2BB');
      await wait(1500);

      const dropdown = page.locator('[role="listbox"], [role="menu"]').first();
      if (await dropdown.isVisible()) {
        observe('positive', 'Functionality', 'Address autocomplete works', 'Dropdown appeared with suggestions');
        await page.screenshot({ path: 'screenshots/scrutiny-08-address-lookup.png', fullPage: true });
      } else {
        observe('minor', 'Functionality', 'Address lookup incomplete', 'Field present but no dropdown appeared');
      }
    } else {
      observe('major', 'Convenience', 'No address lookup', 'Officers must manually type full addresses - time-consuming');
    }

    // Check for multi-line address fields
    const addressLine1 = page.locator('input[id*="line1"], input[name*="addressLine1"]').first();
    const city = page.locator('input[id*="city"], input[id*="town"]').first();
    const postcode = page.locator('input[id*="postcode"]').first();

    const hasModernAddressFields =
      await addressLine1.count() > 0 &&
      await city.count() > 0 &&
      await postcode.count() > 0;

    if (hasModernAddressFields) {
      observe('positive', 'Data Quality', 'Structured address fields', 'Separate fields ensure clean, consistent data');
    } else {
      observe('minor', 'Data Quality', 'Single address field', 'Free-text address may lead to inconsistent formatting');
    }

    // ========== PHASE 7: COUNCIL/AUTHORITY SELECTION ==========
    console.log('\n📍 PHASE 7: Council/Authority Selection\n');

    const authorityField = page.locator('input[id*="AUTHORITY_NAME"]').first();

    if (await authorityField.count() > 0) {
      observe('positive', 'Essential Fields', 'Authority field present', 'Can specify licensing authority');

      // Test if it's a searchable dropdown (like CouncilSelect)
      await authorityField.click();
      await authorityField.fill('Manchester');
      await wait(1000);

      const councilDropdown = page.locator('[role="listbox"]').filter({ hasText: /council/i }).first();
      if (await councilDropdown.isVisible()) {
        observe('positive', 'UX', 'Council autocomplete works', 'Officers can search councils instead of typing full names');

        // Check number of options
        const options = councilDropdown.locator('[role="option"]');
        const optionCount = await options.count();
        if (optionCount > 0) {
          observe('positive', 'Data', `${optionCount} councils in database`, 'Comprehensive council list');
        }

        await page.screenshot({ path: 'screenshots/scrutiny-09-council-search.png', fullPage: true });
      } else {
        observe('minor', 'UX', 'Manual council entry', 'No autocomplete - may lead to spelling variations');
      }
    } else {
      observe('major', 'Essential Fields', 'Authority field missing', 'Cannot specify licensing authority');
    }

    // Check for auto-populated council fields
    const councilEmail = page.locator('input[id*="AUTHORITY_EMAIL"]').first();
    const councilAddress = page.locator('input[id*="AUTHORITY_ADDRESS"], textarea[id*="AUTHORITY_ADDRESS"]').first();

    if (await councilEmail.count() > 0 && await councilAddress.count() > 0) {
      observe('positive', 'Automation', 'Council detail fields present', 'Can capture email and address');
    }

    // ========== PHASE 8: DATE HANDLING & AUTO-CALCULATION ==========
    console.log('\n📍 PHASE 8: Date Fields & Auto-Calculation\n');

    const applicationDate = page.locator('input[id*="APPLICATION_DATE"]').first();
    const deadlineDate = page.locator('input[id*="DEADLINE_DATE"]').first();

    if (await applicationDate.count() > 0) {
      observe('positive', 'Essential Fields', 'Application date field present', 'Officers can set application date');

      // Test date picker
      const dateType = await applicationDate.getAttribute('type');
      if (dateType === 'date') {
        observe('positive', 'UX', 'Native date picker', 'Browser date picker provides good UX');
      } else {
        observe('minor', 'UX', 'Text date input', 'Could benefit from date picker');
      }

      // Test auto-calculation
      const today = new Date().toISOString().split('T')[0];
      await applicationDate.fill(today);
      await wait(1500); // Wait for auto-calculation

      if (await deadlineDate.count() > 0) {
        const deadlineValue = await deadlineDate.inputValue();

        if (deadlineValue && deadlineValue !== today) {
          // Calculate expected (28 days)
          const expected = new Date();
          expected.setDate(expected.getDate() + 28);
          const expectedStr = expected.toISOString().split('T')[0];

          if (deadlineValue === expectedStr) {
            observe('positive', 'Automation', '28-day deadline auto-calculated', 'Saves time and prevents errors');
          } else {
            observe('minor', 'Automation', 'Deadline calculation may be incorrect', `Expected ${expectedStr}, got ${deadlineValue}`);
          }
        } else {
          observe('major', 'Automation', 'Deadline not auto-calculated', 'Officer must manually calculate 28-day deadline');
        }

        await page.screenshot({ path: 'screenshots/scrutiny-10-date-auto-calc.png', fullPage: true });
      } else {
        observe('major', 'Essential Fields', 'Deadline field missing', 'Cannot set representation deadline');
      }
    } else {
      observe('major', 'Essential Fields', 'Application date missing', 'Cannot record when application was submitted');
    }

    // ========== PHASE 9: VALIDATION & ERROR HANDLING ==========
    console.log('\n📍 PHASE 9: Validation & Error Handling\n');

    // Clear a required field to test validation
    if (await addressLine1.count() > 0) {
      await addressLine1.fill('Test Address');
      await wait(500);
      await addressLine1.fill('');
      await wait(500);

      // Check for inline error message
      const errorMsg = page.locator('[role="alert"], [class*="error"]').filter({ hasText: /address|required/i }).first();
      if (await errorMsg.isVisible()) {
        observe('positive', 'Validation', 'Inline error messages', 'Officer immediately sees what is wrong');
      } else {
        observe('minor', 'Validation', 'No inline validation', 'Errors only shown on submit attempt');
      }
    }

    // Check Continue button state
    const stepContinue = page.locator('button:has-text("Continue")').last();
    if (await stepContinue.count() > 0) {
      const isStillDisabled = await stepContinue.isDisabled();

      if (isStillDisabled) {
        observe('positive', 'Validation', 'Continue disabled for incomplete form', 'Prevents submitting bad data');

        // Check for missing field indicator
        const missingCount = page.locator('text=/\\d+ required.*remaining/i').first();
        if (await missingCount.isVisible()) {
          const countText = await missingCount.textContent();
          observe('positive', 'Feedback', 'Shows remaining required fields', `Clear indicator: "${countText}"`);
        } else {
          observe('minor', 'Feedback', 'No completion progress indicator', 'Officer does not know how many fields left');
        }
      } else {
        observe('minor', 'Validation', 'Continue enabled despite empty fields', 'May allow incomplete submissions');
      }
    }

    await page.screenshot({ path: 'screenshots/scrutiny-11-validation.png', fullPage: true });

    // ========== PHASE 10: FORM COMPLETION & SUBMISSION ==========
    console.log('\n📍 PHASE 10: Form Completion Experience\n');

    // Fill out the complete form
    const fillField = async (selector: string, value: string, description: string) => {
      const field = page.locator(selector).first();
      if (await field.count() > 0) {
        await field.fill(value);
        console.log(`  ✓ Filled: ${description}`);
        return true;
      }
      return false;
    };

    console.log('\n📝 Filling required fields...\n');

    await fillField('input[id*="APPLICANT_NAME"]', 'John Smith', 'Applicant Name');
    await fillField('input[id*="PREMISES_NAME"]', 'The Red Lion Public House', 'Premises Name');

    if (await addressLine1.count() > 0) {
      await addressLine1.fill('456 Market Street');
      await city.fill('Manchester');
      await postcode.fill('M2 2BB');
      console.log('  ✓ Filled: Address fields');
    }

    await fillField('input[id*="AUTHORITY_NAME"]', 'Manchester City Council', 'Authority Name');
    await fillField('input[id*="AUTHORITY_EMAIL"]', 'licensing@manchester.gov.uk', 'Authority Email');
    await fillField('textarea[id*="LICENSABLE_ACTIVITIES"]', 'Sale of alcohol, Late night refreshment', 'Activities');

    await wait(1000);
    await page.screenshot({ path: 'screenshots/scrutiny-12-form-filled.png', fullPage: true });

    // Check if Continue is now enabled
    const nowEnabled = !(await stepContinue.isDisabled());
    if (nowEnabled) {
      observe('positive', 'Flow', 'Continue enabled after completion', 'Form validation works correctly');

      // Check for confirmation/preview
      await stepContinue.click();
      await wait(1500);
      await page.screenshot({ path: 'screenshots/scrutiny-13-next-step.png', fullPage: true });

      // Look for preview/confirmation page
      const pageText = await page.textContent('body');
      if (pageText?.includes('Preview') || pageText?.includes('Review') || pageText?.includes('Confirm')) {
        observe('positive', 'Safety', 'Preview before submission', 'Officer can review data before finalizing');
      } else {
        observe('minor', 'Safety', 'No preview step', 'Would benefit from final review before submission');
      }
    } else {
      observe('major', 'Validation', 'Continue still disabled after filling', 'Form validation may be too strict or buggy');
    }

    // ========== PHASE 11: RIGHT-SIDE PREVIEW/HELP PANEL ==========
    console.log('\n📍 PHASE 11: Preview & Help Panel\n');

    await page.goto('http://localhost:5173/publish/step-2');
    await wait(1000);

    // Check for right-side panel
    const previewPanel = page.locator('aside, [class*="rail"], [class*="sidebar"]').first();
    if (await previewPanel.count() > 0) {
      const panelText = await previewPanel.textContent();

      if (panelText?.includes('Preview')) {
        observe('positive', 'UX', 'Live preview panel', 'Officer can see how notice will appear');
      }

      if (panelText?.includes('Issue') || panelText?.includes('Compliance')) {
        observe('positive', 'Quality', 'Compliance checking', 'System validates legal requirements');
      }

      if (panelText?.includes('Key dates') || panelText?.includes('Deadline')) {
        observe('positive', 'Reference', 'Key dates summary', 'Important deadlines visible at a glance');
      }
    } else {
      observe('minor', 'UX', 'No preview panel', 'Officer cannot see final output while editing');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-14-preview-panel.png', fullPage: true });

    // ========== PHASE 12: OVERALL USABILITY & POLISH ==========
    console.log('\n📍 PHASE 12: Overall Polish & Professional Feel\n');

    // Check for consistent styling
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    if (buttonCount > 0) {
      const firstButtonClass = await allButtons.first().getAttribute('class');
      const hasConsistentStyling = firstButtonClass?.includes('rounded') || firstButtonClass?.includes('btn');

      if (hasConsistentStyling) {
        observe('positive', 'Design', 'Consistent button styling', 'Professional, cohesive appearance');
      }
    }

    // Check for loading states
    const hasSpinners = await page.locator('[class*="spin"], [class*="loader"], [class*="skeleton"]').count() > 0;
    if (hasSpinners) {
      observe('positive', 'Feedback', 'Loading states present', 'Officer knows system is working during slow operations');
    }

    // Check for help/documentation
    const helpLinks = page.locator('a[href*="help"], a[href*="docs"], a[href*="guide"]');
    if (await helpLinks.count() > 0) {
      observe('positive', 'Support', 'Help documentation linked', 'Officers can get assistance');
    } else {
      observe('minor', 'Support', 'No help links visible', 'Would benefit from contextual help');
    }

    // Check for save/draft functionality
    const saveIndicator = await page.textContent('body');
    if (saveIndicator?.includes('Saved') || saveIndicator?.includes('Draft')) {
      observe('positive', 'Safety', 'Auto-save indicator', 'Officer knows work is being saved');
    } else {
      observe('major', 'Safety', 'No save confirmation', 'Risk of losing work if browser crashes');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-15-final-overview.png', fullPage: true });

    // ========== PHASE 13: KEYBOARD NAVIGATION ==========
    console.log('\n📍 PHASE 13: Keyboard Accessibility\n');

    await page.goto('http://localhost:5173/publish/step-2');
    await wait(1000);

    // Test tab navigation
    await page.keyboard.press('Tab');
    await wait(200);
    await page.keyboard.press('Tab');
    await wait(200);
    await page.keyboard.press('Tab');
    await wait(200);

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    if (focusedElement && ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(focusedElement)) {
      observe('positive', 'Accessibility', 'Tab navigation works', 'Keyboard users can navigate the form');
    } else {
      observe('major', 'Accessibility', 'Poor keyboard navigation', 'Tab focus not working properly');
    }

    // Check for focus indicators
    const focusedClass = await page.evaluate(() => document.activeElement?.className);
    if (focusedClass?.includes('focus') || focusedClass?.includes('ring')) {
      observe('positive', 'Accessibility', 'Visible focus indicators', 'Keyboard users can see where they are');
    } else {
      observe('minor', 'Accessibility', 'Weak focus indicators', 'Should have stronger visual focus states');
    }

    await page.screenshot({ path: 'screenshots/scrutiny-16-keyboard-nav.png', fullPage: true });

  } catch (error) {
    console.error('\n❌ Test encountered an error:', error);
    observe('critical', 'Testing', 'Test execution failed', `Error: ${error}`);
    await page.screenshot({ path: 'screenshots/scrutiny-error.png', fullPage: true });
  } finally {
    await wait(3000); // Keep browser open to review
    await browser.close();
  }

  // ========== GENERATE COMPREHENSIVE REPORT ==========
  generateReport();
}

function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 PREMISES LICENCE FORM - COMPREHENSIVE UX AUDIT REPORT');
  console.log('='.repeat(80));

  const critical = observations.filter(o => o.category === 'critical');
  const major = observations.filter(o => o.category === 'major');
  const minor = observations.filter(o => o.category === 'minor');
  const positive = observations.filter(o => o.category === 'positive');

  console.log(`\n📈 SUMMARY STATISTICS:\n`);
  console.log(`🔴 Critical Issues: ${critical.length}`);
  console.log(`🟠 Major Issues: ${major.length}`);
  console.log(`🟡 Minor Issues: ${minor.length}`);
  console.log(`🟢 Positive Findings: ${positive.length}`);

  const totalIssues = critical.length + major.length + minor.length;
  const score = Math.max(0, 100 - (critical.length * 20) - (major.length * 10) - (minor.length * 5));

  console.log(`\n📊 Overall UX Score: ${score}/100`);

  if (score >= 80) {
    console.log('✅ Excellent - Minor improvements suggested');
  } else if (score >= 60) {
    console.log('⚠️  Good - Several improvements recommended');
  } else if (score >= 40) {
    console.log('❌ Fair - Significant improvements needed');
  } else {
    console.log('🚫 Poor - Major overhaul required');
  }

  // Group by phase
  const phases = Array.from(new Set(observations.map(o => o.phase)));

  console.log('\n\n' + '='.repeat(80));
  console.log('📋 DETAILED FINDINGS BY PHASE\n');

  phases.forEach(phase => {
    const phaseObs = observations.filter(o => o.phase === phase);
    console.log(`\n${phase}:`);
    console.log('-'.repeat(40));

    phaseObs.forEach(obs => {
      const icon = obs.category === 'critical' ? '🔴' : obs.category === 'major' ? '🟠' : obs.category === 'minor' ? '🟡' : '🟢';
      console.log(`${icon} ${obs.title}`);
      console.log(`   ${obs.description}`);
    });
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 PRIORITY RECOMMENDATIONS\n');

  if (critical.length > 0) {
    console.log('🔴 CRITICAL - Fix Immediately:\n');
    critical.forEach((obs, i) => {
      console.log(`${i + 1}. ${obs.title}`);
      console.log(`   ${obs.description}`);
      console.log('');
    });
  }

  if (major.length > 0) {
    console.log('🟠 MAJOR - Address Soon:\n');
    major.slice(0, 5).forEach((obs, i) => {
      console.log(`${i + 1}. ${obs.title}`);
      console.log(`   ${obs.description}`);
      console.log('');
    });
  }

  console.log('\n💡 QUICK WINS (Positive aspects to maintain):\n');
  positive.slice(0, 5).forEach((obs, i) => {
    console.log(`${i + 1}. ${obs.title} - ${obs.description}`);
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('🏆 LICENSING OFFICER VERDICT\n');
  console.log('From the perspective of an experienced licensing officer:\n');

  if (score >= 70) {
    console.log('This system would SPEED UP my workflow. The form is well-designed with');
    console.log('helpful automation (address lookup, date calculation) and clear structure.');
    console.log('Minor improvements would make it excellent.');
  } else if (score >= 50) {
    console.log('This system is USABLE but needs improvement. Some frustrations around');
    console.log('missing fields, unclear validation, or lack of guidance would slow me down.');
    console.log('With fixes, it could be great.');
  } else {
    console.log('This system would FRUSTRATE me in daily use. Critical gaps in functionality,');
    console.log('poor error handling, or confusing flow would make me prefer the old process.');
    console.log('Significant work needed before deployment.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Run the test
testPremisesLicenceForm().catch(console.error);
