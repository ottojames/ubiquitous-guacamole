import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';

type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'POSITIVE';

interface Finding {
  severity: Severity;
  category: string;
  title: string;
  description: string;
}

const findings: Finding[] = [];

function log(severity: Severity, category: string, title: string, description: string) {
  findings.push({ severity, category, title, description });
  const emoji = {
    CRITICAL: '🔴',
    MAJOR: '🟠',
    MINOR: '🟡',
    POSITIVE: '🟢',
  }[severity];
  console.log(`${emoji} [${severity}] ${title}`);
  console.log(`   ${description}`);
  console.log();
}

async function testUploadPath(page: Page, testName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 TEST: ${testName} - FILE UPLOAD PATH`);
  console.log(`${'='.repeat(80)}\n`);

  // Navigate to start
  await page.goto(`${BASE_URL}/publish/step-1`);
  await page.waitForLoadState('networkidle');

  // Step 1: Select notice type
  log('POSITIVE', 'Navigation', 'Page loads successfully', 'The premises licence form is accessible');

  // Select "Premises licence - New"
  const premisesOption = page.getByTestId('notice-option-licensing-premises-new');
  if (await premisesOption.isVisible()) {
    await premisesOption.click();
    log('POSITIVE', 'Selection', 'Premises licence option found', 'Officer can select premises licence type');
  } else {
    log('CRITICAL', 'Selection', 'Premises licence option missing', 'Cannot proceed with premises licence application');
    return;
  }

  // Click continue
  const continueBtn = page.locator('button:has-text("Continue")');
  await continueBtn.click();
  await page.waitForLoadState('networkidle');

  // Step 2: Upload method selection
  const uploadNoticeBtn = page.locator('button:has-text("Upload notice")');
  if (await uploadNoticeBtn.isVisible()) {
    await uploadNoticeBtn.click();
    log('POSITIVE', 'Flow', 'Upload option available', 'Officer can choose to upload a document');
  } else {
    log('MAJOR', 'Flow', 'Upload option missing', 'No clear path to upload notice document');
  }

  // Wait for upload page
  await page.waitForTimeout(500);

  // Check if form fields are visible immediately
  const formVisible = await page.locator('text=Complete the required details').isVisible();
  if (formVisible) {
    log('POSITIVE', 'UX', 'Form fields visible without upload', 'Officer can start entering data immediately without uploading');
  } else {
    log('MAJOR', 'UX', 'Form fields hidden', 'Officer must upload file before seeing form fields');
  }

  // Test address autocomplete
  const addressInput = page.locator('[data-testid="applicant_address-lookup"]').first();
  if (await addressInput.isVisible()) {
    log('POSITIVE', 'Features', 'Address autocomplete present', 'Officers can look up addresses quickly');

    // Test address lookup
    await addressInput.fill('9 lower park road ches');
    await page.waitForTimeout(1000);

    const dropdown = page.locator('role=listbox');
    const dropdownVisible = await dropdown.isVisible();

    if (dropdownVisible) {
      log('POSITIVE', 'Features', 'Address suggestions appear', 'Autocomplete is working');

      // Click first suggestion
      const firstOption = page.locator('role=option').first();
      await firstOption.click();
      await page.waitForTimeout(500);

      // Check if address fields populated
      const addressLine1 = page.locator('input[name*="addressline1"]').first();
      const addressLine1Value = await addressLine1.inputValue();

      if (addressLine1Value && addressLine1Value.length > 0) {
        log('POSITIVE', 'Features', 'Address autocomplete populates fields', 'Address fields are filled automatically');
      } else {
        log('MAJOR', 'Features', 'Address autocomplete doesn\'t populate', 'Clicking suggestion doesn\'t fill address fields');
      }

      // Check if postcode is populated
      const postcodeField = page.locator('input[name*="postcode"]').first();
      const postcodeValue = await postcodeField.inputValue();

      if (postcodeValue && postcodeValue.length > 0) {
        log('POSITIVE', 'Features', 'Postcode populated', `Postcode field filled: ${postcodeValue}`);
      } else {
        log('MAJOR', 'Features', 'Postcode missing', 'Postcode not populated from address lookup');
      }
    } else {
      log('MAJOR', 'Features', 'Address suggestions not appearing', 'Autocomplete dropdown not showing');
    }
  } else {
    log('MAJOR', 'Features', 'Address autocomplete missing', 'No address lookup functionality found');
  }

  // Test all required fields
  const fieldTests = [
    { selector: 'input[name="applicantname"]', label: 'Applicant name', testValue: 'Test Pub Ltd' },
    { selector: 'input[name="premisesname"]', label: 'Premises name', testValue: 'The Red Lion' },
    { selector: 'input[name="application_date"]', label: 'Application date', testValue: '2025-01-15' },
  ];

  let fieldsFound = 0;
  for (const field of fieldTests) {
    const element = page.locator(field.selector).first();
    if (await element.isVisible()) {
      fieldsFound++;
      await element.fill(field.testValue);

      // Check if label exists
      const label = await element.getAttribute('aria-label') || await page.locator(`label[for="${await element.getAttribute('id')}"]`).textContent();
      if (label) {
        log('POSITIVE', 'Accessibility', `${field.label} has label`, 'Screen reader accessible');
      } else {
        log('MINOR', 'Accessibility', `${field.label} missing label`, 'May cause accessibility issues');
      }
    }
  }

  if (fieldsFound === fieldTests.length) {
    log('POSITIVE', 'Completeness', 'All key fields present', `Found ${fieldsFound}/${fieldTests.length} required fields`);
  } else {
    log('MAJOR', 'Completeness', 'Missing required fields', `Only found ${fieldsFound}/${fieldTests.length} required fields`);
  }

  // Test authority field
  const authorityField = page.locator('input[name="authorityname"]').first();
  if (await authorityField.isVisible()) {
    log('POSITIVE', 'Features', 'Authority field present', 'Officer can specify licensing authority');

    // Test if it's a searchable dropdown
    await authorityField.fill('west');
    await page.waitForTimeout(500);
    const councilDropdown = page.locator('role=listbox');
    if (await councilDropdown.isVisible()) {
      log('POSITIVE', 'Features', 'Council search working', 'Authority field has autocomplete');

      // Click first council
      const firstCouncil = page.locator('role=option').first();
      await firstCouncil.click();
      await page.waitForTimeout(500);

      // Check if authority email populated
      const emailField = page.locator('input[name="authorityemail"]').first();
      const emailValue = await emailField.inputValue();
      if (emailValue && emailValue.includes('@')) {
        log('POSITIVE', 'Features', 'Authority email auto-populated', 'Council details filled automatically');
      }
    }
  } else {
    log('MAJOR', 'Completeness', 'Authority field missing', 'Cannot specify licensing authority');
  }

  // Test licensable activities
  const activitiesField = page.locator('text=Licensable activities').first();
  if (await activitiesField.isVisible()) {
    log('POSITIVE', 'Completeness', 'Licensable activities field present', 'Officer can specify what activities are being applied for');

    // Check if it's checkboxes
    const saleOfAlcohol = page.locator('text=Sale of alcohol');
    if (await saleOfAlcohol.isVisible()) {
      await saleOfAlcohol.click();
      log('POSITIVE', 'UX', 'Activity selection is intuitive', 'Checkboxes for common activities');
    }
  } else {
    log('MAJOR', 'Completeness', 'Licensable activities missing', 'Cannot specify what the licence is for');
  }

  // Test deadline auto-calculation
  const deadlineField = page.locator('input[name="deadline_date"]').first();
  if (await deadlineField.isVisible()) {
    const deadlineValue = await deadlineField.inputValue();
    if (deadlineValue && deadlineValue.length > 0) {
      log('POSITIVE', 'Features', 'Deadline auto-calculated', 'Saves time by calculating representation deadline');
    } else {
      log('MINOR', 'Features', 'Deadline not auto-calculated', 'Officer must manually calculate 28-day deadline');
    }
  }

  // Check for validation
  const continueStep2 = page.locator('button:has-text("Continue")').last();
  const isDisabled = await continueStep2.isDisabled();

  if (isDisabled) {
    log('POSITIVE', 'Validation', 'Continue button disabled when incomplete', 'Prevents submitting incomplete forms');
  } else {
    log('MINOR', 'Validation', 'Continue button enabled prematurely', 'May allow incomplete submissions');
  }

  // Test help/guidance
  const helpText = await page.locator('text=/help|guide|hint|example/i').count();
  if (helpText > 5) {
    log('POSITIVE', 'UX', 'Helpful guidance provided', `Found ${helpText} help messages`);
  } else {
    log('MINOR', 'UX', 'Limited guidance', 'More field-level help would assist officers');
  }

  // Test keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  if (focusedElement) {
    log('POSITIVE', 'Accessibility', 'Keyboard navigation works', 'Officers can navigate without mouse');
  } else {
    log('MINOR', 'Accessibility', 'Keyboard navigation issues', 'Tab navigation may not work properly');
  }
}

async function testTemplatePath(page: Page, testName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 TEST: ${testName} - TEMPLATE PATH`);
  console.log(`${'='.repeat(80)}\n`);

  // Navigate to start
  await page.goto(`${BASE_URL}/publish/step-1`);
  await page.waitForLoadState('networkidle');

  // Select premises licence - new application
  await page.getByTestId('notice-option-licensing-premises-new').click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');

  // Choose template path
  const useTemplateBtn = page.locator('button:has-text("Use template")');
  if (await useTemplateBtn.isVisible()) {
    await useTemplateBtn.click();
    log('POSITIVE', 'Flow', 'Template option available', 'Officer can use structured form without uploading');
  } else {
    log('MAJOR', 'Flow', 'Template option missing', 'No alternative to file upload');
    return;
  }

  await page.waitForTimeout(500);

  // Check if all fields are immediately visible
  const formSection = page.locator('text=Complete the required details');
  if (await formSection.isVisible()) {
    log('POSITIVE', 'UX', 'Template form immediately visible', 'All fields shown upfront');
  } else {
    log('MAJOR', 'UX', 'Template form not visible', 'Form fields not appearing');
  }

  // Test field presence and accessibility
  const templateFieldTests = [
    { selector: 'input[name="applicantname"]', label: 'Applicant name', required: true },
    { selector: '[data-testid="applicant_address-lookup"]', label: 'Applicant address', required: true },
    { selector: 'input[name="premisesname"]', label: 'Premises name', required: true },
    { selector: '[data-testid="premises_address-lookup"]', label: 'Premises address', required: true },
    { selector: 'input[name="authorityname"]', label: 'Authority name', required: true },
    { selector: 'input[name="application_date"]', label: 'Application date', required: true },
    { selector: 'input[name="deadline_date"]', label: 'Deadline date', required: true },
  ];

  let presentCount = 0;
  let requiredCount = 0;
  let labeledCount = 0;

  for (const field of templateFieldTests) {
    const element = page.locator(field.selector).first();
    const visible = await element.isVisible();

    if (visible) {
      presentCount++;

      // Check if required indicator present
      const parent = element.locator('xpath=ancestor::div[1]');
      const hasAsterisk = await parent.locator('text=*').count() > 0;
      if (hasAsterisk && field.required) {
        requiredCount++;
      }

      // Check for label
      const elementId = await element.getAttribute('id');
      const label = elementId ? await page.locator(`label[for="${elementId}"]`).count() : 0;
      if (label > 0 || await element.getAttribute('aria-label')) {
        labeledCount++;
      }
    }
  }

  const coverage = Math.round((presentCount / templateFieldTests.length) * 100);
  if (coverage === 100) {
    log('POSITIVE', 'Completeness', 'All fields present in template', `${presentCount}/${templateFieldTests.length} fields found`);
  } else if (coverage >= 80) {
    log('MINOR', 'Completeness', 'Most fields present', `${coverage}% field coverage`);
  } else {
    log('MAJOR', 'Completeness', 'Many fields missing', `Only ${coverage}% field coverage`);
  }

  if (requiredCount === templateFieldTests.filter(f => f.required).length) {
    log('POSITIVE', 'UX', 'Required fields clearly marked', 'All required fields have * indicator');
  } else {
    log('MINOR', 'UX', 'Required field indicators missing', 'Not all required fields marked with *');
  }

  const labelCoverage = Math.round((labeledCount / presentCount) * 100);
  if (labelCoverage === 100) {
    log('POSITIVE', 'Accessibility', 'All fields properly labeled', 'Screen reader accessible');
  } else if (labelCoverage >= 80) {
    log('MINOR', 'Accessibility', 'Most fields labeled', `${labelCoverage}% have labels`);
  } else {
    log('MAJOR', 'Accessibility', 'Many fields unlabeled', `Only ${labelCoverage}% have labels`);
  }

  // Test data entry workflow
  log('POSITIVE', 'Testing', 'Starting data entry workflow test', 'Filling all fields to test flow');

  // Fill applicant name
  await page.locator('input[name="applicantname"]').first().fill('The Acme Pub Company Ltd');

  // Fill applicant address using autocomplete
  const applicantAddress = page.locator('[data-testid="applicant_address-lookup"]').first();
  await applicantAddress.fill('10 downing street');
  await page.waitForTimeout(1000);
  const addressDropdown = page.locator('role=option').first();
  if (await addressDropdown.isVisible()) {
    await addressDropdown.click();
    await page.waitForTimeout(500);
  }

  // Fill premises name
  await page.locator('input[name="premisesname"]').first().fill('The King\'s Head');

  // Fill premises address
  const premisesAddress = page.locator('[data-testid="premises_address-lookup"]').nth(1);
  if (await premisesAddress.isVisible()) {
    await premisesAddress.fill('1 main street');
    await page.waitForTimeout(1000);
    const premDropdown = page.locator('role=option').first();
    if (await premDropdown.isVisible()) {
      await premDropdown.click();
      await page.waitForTimeout(500);
    }
  }

  // Fill authority
  const authorityInput = page.locator('input[name="authorityname"]').first();
  await authorityInput.fill('westminster');
  await page.waitForTimeout(500);
  const councilOption = page.locator('role=option').first();
  if (await councilOption.isVisible()) {
    await councilOption.click();
    await page.waitForTimeout(500);
  }

  // Fill application date
  await page.locator('input[name="application_date"]').first().fill('2025-01-20');
  await page.waitForTimeout(500);

  // Check if deadline auto-filled
  const deadlineValue = await page.locator('input[name="deadline_date"]').first().inputValue();
  if (deadlineValue && deadlineValue === '2025-02-17') {
    log('POSITIVE', 'Features', 'Deadline auto-calculates correctly', '28 days from application date');
  } else if (deadlineValue) {
    log('MINOR', 'Features', 'Deadline calculation may be incorrect', `Got ${deadlineValue}, expected 2025-02-17`);
  }

  // Select licensable activities
  const saleOfAlcohol = page.locator('text=Sale of alcohol').first();
  if (await saleOfAlcohol.isVisible()) {
    await saleOfAlcohol.click();
  }

  const lateNight = page.locator('text=Late night refreshment').first();
  if (await lateNight.isVisible()) {
    await lateNight.click();
  }

  // Check continue button state
  await page.waitForTimeout(500);
  const continueBtn = page.locator('button:has-text("Continue")').last();
  const isEnabled = !(await continueBtn.isDisabled());

  if (isEnabled) {
    log('POSITIVE', 'Validation', 'Form validation working', 'Continue enabled after filling required fields');
  } else {
    log('MAJOR', 'Validation', 'Form validation too strict', 'Continue still disabled after filling all visible required fields');
  }

  // Test progress indicator
  const progressText = await page.locator('text=/\\d+ required field/i').textContent();
  if (progressText) {
    log('POSITIVE', 'UX', 'Progress indicator present', `Officer can see completion status: ${progressText}`);
  } else {
    log('MINOR', 'UX', 'No progress indicator', 'Officer cannot see how many fields remaining');
  }
}

async function generateReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE PREMISES LICENCE UX AUDIT REPORT');
  console.log(`${'='.repeat(80)}\n`);

  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const major = findings.filter(f => f.severity === 'MAJOR');
  const minor = findings.filter(f => f.severity === 'MINOR');
  const positive = findings.filter(f => f.severity === 'POSITIVE');

  console.log('📈 SUMMARY STATISTICS:\n');
  console.log(`🔴 Critical Issues: ${critical.length}`);
  console.log(`🟠 Major Issues: ${major.length}`);
  console.log(`🟡 Minor Issues: ${minor.length}`);
  console.log(`🟢 Positive Findings: ${positive.length}\n`);

  // Calculate score
  const totalIssues = critical.length * 3 + major.length * 2 + minor.length;
  const maxScore = 100;
  const score = Math.max(0, maxScore - totalIssues);

  console.log(`📊 Overall UX Score: ${score}/100`);
  if (score >= 90) {
    console.log('🏆 Excellent - Ready for production');
  } else if (score >= 70) {
    console.log('✅ Good - Minor improvements needed');
  } else if (score >= 50) {
    console.log('⚠️  Fair - Several issues to address');
  } else {
    console.log('🚫 Poor - Major overhaul required');
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 DETAILED FINDINGS BY CATEGORY\n');

  // Group by category
  const byCategory: Record<string, Finding[]> = {};
  for (const finding of findings) {
    if (!byCategory[finding.category]) {
      byCategory[finding.category] = [];
    }
    byCategory[finding.category].push(finding);
  }

  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`${category}:`);
    console.log('-'.repeat(40));
    for (const item of items) {
      const emoji = {
        CRITICAL: '🔴',
        MAJOR: '🟠',
        MINOR: '🟡',
        POSITIVE: '🟢',
      }[item.severity];
      console.log(`${emoji} ${item.title}`);
      console.log(`   ${item.description}\n`);
    }
  }

  console.log('='.repeat(80));
  console.log('🎯 PRIORITY RECOMMENDATIONS\n');

  if (critical.length > 0) {
    console.log('🔴 CRITICAL - Fix Immediately:\n');
    critical.forEach((f, i) => {
      console.log(`${i + 1}. ${f.title}`);
      console.log(`   ${f.description}\n`);
    });
  }

  if (major.length > 0) {
    console.log('🟠 MAJOR - Address Soon:\n');
    major.slice(0, 5).forEach((f, i) => {
      console.log(`${i + 1}. ${f.title}`);
      console.log(`   ${f.description}\n`);
    });
  }

  console.log('\n💡 QUICK WINS (Positive aspects to maintain):\n');
  positive.slice(0, 5).forEach((f, i) => {
    console.log(`${i + 1}. ${f.title} - ${f.description}`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log('🏆 LICENSING OFFICER VERDICT\n');
  console.log('From the perspective of an experienced licensing officer:\n');

  if (score >= 90) {
    console.log('This system would SIGNIFICANTLY IMPROVE my daily workflow. It\'s intuitive,');
    console.log('complete, and would save considerable time. Ready for deployment.\n');
  } else if (score >= 70) {
    console.log('This system would HELP my workflow with some minor improvements. The core');
    console.log('functionality is solid but a few tweaks would make it excellent.\n');
  } else if (score >= 50) {
    console.log('This system has POTENTIAL but needs work. Some useful features but also');
    console.log('frustrating gaps that would slow me down. Not quite ready yet.\n');
  } else {
    console.log('This system would FRUSTRATE me in daily use. Critical gaps in functionality,');
    console.log('poor error handling, or confusing flow would make me prefer the old process.');
    console.log('Significant work needed before deployment.\n');
  }

  console.log(`${'='.repeat(80)}\n\n`);

  // Write to file
  const reportPath = './scrutiny-comprehensive-report.log';
  const reportContent = findings.map(f => {
    const emoji = { CRITICAL: '🔴', MAJOR: '🟠', MINOR: '🟡', POSITIVE: '🟢' }[f.severity];
    return `${emoji} [${f.severity}] ${f.category}: ${f.title}\n   ${f.description}`;
  }).join('\n\n');

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Upload path - New application
    await testUploadPath(page, 'New Premises Licence Application');

    // Test 2: Template path - New application
    await testTemplatePath(page, 'New Premises Licence Application');

    // Generate comprehensive report
    await generateReport();

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

main();
