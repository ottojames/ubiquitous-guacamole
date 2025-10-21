import { chromium, type Page } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';

type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'POSITIVE';

interface Finding {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  testId: string;
}

const findings: Finding[] = [];
let currentTestId = '';

function log(severity: Severity, category: string, title: string, description: string) {
  findings.push({ severity, category, title, description, testId: currentTestId });
  const emoji = {
    CRITICAL: '🔴',
    MAJOR: '🟠',
    MINOR: '🟡',
    POSITIVE: '🟢',
  }[severity];
  console.log(`${emoji} [${severity}] ${title}`);
  console.log(`   ${description}`);
}

async function testForm(page: Page, testId: string, noticeType: string, uploadMethod: 'upload' | 'template') {
  currentTestId = testId;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 TEST: ${testId}`);
  console.log(`${'='.repeat(80)}\n`);

  // Navigate and select notice type
  await page.goto(`${BASE_URL}/publish/step-1`);
  await page.waitForLoadState('networkidle');

  const testIdMap: Record<string, string> = {
    'new': 'notice-option-licensing-premises-new',
    'variation': 'notice-option-licensing-premises-variation',
    'review': 'notice-option-licensing-premises-review',
  };

  await page.getByTestId(testIdMap[noticeType]).click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');

  // Choose method
  if (uploadMethod === 'template') {
    const useTemplateBtn = page.locator('button:has-text("Use template")');
    if (await useTemplateBtn.isVisible()) {
      await useTemplateBtn.click();
      log('POSITIVE', 'Flow', 'Template option available', 'Can use structured form without uploading');
    } else {
      log('MAJOR', 'Flow', 'Template option missing', 'No structured form alternative');
      return;
    }
  } else {
    const uploadNoticeBtn = page.locator('button:has-text("Upload notice")');
    if (await uploadNoticeBtn.isVisible()) {
      await uploadNoticeBtn.click();
      log('POSITIVE', 'Flow', 'Upload option available', 'Can upload document');
    }
  }

  await page.waitForTimeout(500);

  // Check form visibility
  const formVisible = await page.locator('text=Complete the required details').isVisible();
  if (formVisible) {
    log('POSITIVE', 'UX', 'Form fields visible immediately', 'Can start data entry right away');
  } else {
    log('MAJOR', 'UX', 'Form fields hidden', 'Fields not immediately visible');
  }

  // Test address autocomplete
  const addressInput = page.locator('[data-testid="applicant_address-lookup"]').first();
  if (await addressInput.isVisible()) {
    log('POSITIVE', 'Features', 'Address autocomplete present', 'Address lookup available');

    await addressInput.fill('9 lower park road ches');
    await page.waitForTimeout(1500);

    const dropdown = page.locator('role=listbox');
    if (await dropdown.isVisible()) {
      log('POSITIVE', 'Features', 'Address suggestions work', 'Dropdown appears with results');

      const firstOption = page.locator('role=option').first();
      await firstOption.click();
      await page.waitForTimeout(1500);

      // Check if fields populated
      const line1Input = page.locator(`input[name="applicant_addressLine1"]`).first();
      const postcodeInput = page.locator(`input[name="applicant_addressPostcode"]`).first();

      try {
        const line1Value = await line1Input.inputValue({ timeout: 3000 });
        const postcodeValue = await postcodeInput.inputValue({ timeout: 3000 });

        if (line1Value && line1Value.length > 0) {
          log('POSITIVE', 'Features', 'Address fields populate', `Address line 1: ${line1Value}`);
        } else {
          log('CRITICAL', 'Features', 'Address fields do not populate', 'Clicking address does not fill fields');
        }

        if (postcodeValue && postcodeValue.length > 0) {
          log('POSITIVE', 'Features', 'Postcode populates', `Postcode: ${postcodeValue}`);
        } else {
          log('MAJOR', 'Features', 'Postcode missing', 'Postcode not retrieved from API');
        }
      } catch (e) {
        log('CRITICAL', 'Features', 'Address fields not found', 'Cannot verify address population');
      }
    } else {
      log('MAJOR', 'Features', 'Address suggestions not appearing', 'Dropdown not showing');
    }
  } else {
    log('MAJOR', 'Features', 'Address autocomplete missing', 'No address lookup');
  }

  // Test required fields
  const requiredFields = [
    { name: 'applicantname', label: 'Applicant name' },
    { name: 'premisesname', label: 'Premises name' },
    { name: 'authorityname', label: 'Authority name' },
    { name: 'application_date', label: 'Application date' },
    { name: 'deadline_date', label: 'Deadline date' },
  ];

  let fieldsFound = 0;
  for (const field of requiredFields) {
    const element = page.locator(`input[name="${field.name}"]`).first();
    if (await element.isVisible()) {
      fieldsFound++;
    }
  }

  if (fieldsFound === requiredFields.length) {
    log('POSITIVE', 'Completeness', 'All required fields present', `${fieldsFound}/${requiredFields.length} fields found`);
  } else {
    log('MAJOR', 'Completeness', 'Missing required fields', `Only ${fieldsFound}/${requiredFields.length} found`);
  }

  // Test authority autocomplete
  const authorityField = page.locator('input[name="authorityname"]').first();
  if (await authorityField.isVisible()) {
    await authorityField.fill('west');
    await page.waitForTimeout(700);
    const councilDropdown = page.locator('role=listbox');
    if (await councilDropdown.isVisible()) {
      log('POSITIVE', 'Features', 'Authority search works', 'Council autocomplete functional');

      const firstCouncil = page.locator('role=option').first();
      await firstCouncil.click();
      await page.waitForTimeout(500);

      try {
        const emailField = page.locator('input[name="authorityemail"]').first();
        const emailValue = await emailField.inputValue({ timeout: 2000 });
        if (emailValue && emailValue.includes('@')) {
          log('POSITIVE', 'Features', 'Authority email auto-fills', 'Contact details populated');
        }
      } catch (e) {
        // Email field not present or didn't auto-fill, that's okay
      }
    }
  }

  // Test licensable activities
  const activitiesLabel = page.locator('text=Licensable activities').first();
  if (await activitiesLabel.isVisible()) {
    log('POSITIVE', 'Completeness', 'Activities field present', 'Can specify licence scope');
  } else {
    log('MAJOR', 'Completeness', 'Activities field missing', 'Cannot specify what licence covers');
  }

  // Test deadline calculation
  const appDateField = page.locator('input[name="application_date"]').first();
  const deadlineField = page.locator('input[name="deadline_date"]').first();

  if (await appDateField.isVisible() && await deadlineField.isVisible()) {
    await appDateField.fill('2025-01-20');
    await page.waitForTimeout(500);
    const deadlineValue = await deadlineField.inputValue();

    if (deadlineValue === '2025-02-17') {
      log('POSITIVE', 'Features', 'Deadline auto-calculates correctly', '28 days calculated properly');
    } else if (deadlineValue) {
      log('MINOR', 'Features', 'Deadline calculation may be wrong', `Got ${deadlineValue}, expected 2025-02-17`);
    } else {
      log('MINOR', 'Features', 'No deadline auto-calculation', 'Officer must calculate manually');
    }
  }

  // Test validation
  const continueBtn = page.locator('button:has-text("Continue")').last();
  const isDisabled = await continueBtn.isDisabled();

  if (isDisabled) {
    log('POSITIVE', 'Validation', 'Form validation prevents submission', 'Continue disabled when incomplete');
  } else {
    log('MINOR', 'Validation', 'Validation may be too lenient', 'Continue enabled prematurely');
  }

  // Test progress indicator
  try {
    const progressText = await page.locator('text=/\\d+ required field/i').textContent({ timeout: 3000 });
    if (progressText) {
      log('POSITIVE', 'UX', 'Progress indicator present', progressText);
    }
  } catch (e) {
    log('MINOR', 'UX', 'No progress indicator', 'Cannot see completion status');
  }

  // Test accessibility
  const labelCount = await page.locator('label').count();
  const inputCount = await page.locator('input, textarea, select').count();
  const labelRatio = inputCount > 0 ? Math.round((labelCount / inputCount) * 100) : 0;

  if (labelRatio >= 90) {
    log('POSITIVE', 'Accessibility', 'Good label coverage', `${labelRatio}% of inputs labeled`);
  } else if (labelRatio >= 70) {
    log('MINOR', 'Accessibility', 'Moderate label coverage', `${labelRatio}% of inputs labeled`);
  } else {
    log('MAJOR', 'Accessibility', 'Poor label coverage', `Only ${labelRatio}% of inputs labeled`);
  }
}

async function generateReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE PREMISES LICENCE AUDIT REPORT');
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

  const totalIssues = critical.length * 3 + major.length * 2 + minor.length;
  const score = Math.max(0, 100 - totalIssues);

  console.log(`📊 Overall UX Score: ${score}/100`);
  if (score >= 90) console.log('🏆 Excellent - Ready for production');
  else if (score >= 70) console.log('✅ Good - Minor improvements needed');
  else if (score >= 50) console.log('⚠️  Fair - Several issues to address');
  else console.log('🚫 Poor - Major overhaul required');

  // Group by test
  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 FINDINGS BY TEST\n');

  const byTest: Record<string, Finding[]> = {};
  for (const finding of findings) {
    if (!byTest[finding.testId]) byTest[finding.testId] = [];
    byTest[finding.testId].push(finding);
  }

  for (const [testId, items] of Object.entries(byTest)) {
    console.log(`\n${testId}:`);
    console.log('-'.repeat(40));
    for (const item of items) {
      const emoji = { CRITICAL: '🔴', MAJOR: '🟠', MINOR: '🟡', POSITIVE: '🟢' }[item.severity];
      console.log(`${emoji} ${item.title}`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🎯 PRIORITY RECOMMENDATIONS\n');

  if (critical.length > 0) {
    console.log('🔴 CRITICAL - Fix Immediately:\n');
    critical.slice(0, 5).forEach((f, i) => {
      console.log(`${i + 1}. ${f.title} - ${f.description}`);
    });
  }

  if (major.length > 0) {
    console.log('\n🟠 MAJOR - Address Soon:\n');
    major.slice(0, 5).forEach((f, i) => {
      console.log(`${i + 1}. ${f.title} - ${f.description}`);
    });
  }

  console.log('\n💡 TOP POSITIVE FINDINGS:\n');
  positive.slice(0, 5).forEach((f, i) => {
    console.log(`${i + 1}. ${f.title} - ${f.description}`);
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log('🏆 LICENSING OFFICER VERDICT\n');

  if (score >= 90) {
    console.log('EXCELLENT - This system is ready for production use.\n');
  } else if (score >= 70) {
    console.log('GOOD - Minor improvements would make this excellent.\n');
  } else if (score >= 50) {
    console.log('FAIR - Has potential but needs work before deployment.\n');
  } else {
    console.log('POOR - Significant improvements needed before deployment.\n');
  }

  console.log(`${'='.repeat(80)}\n`);

  // Save detailed report
  const reportPath = './final-audit-report.log';
  const reportContent = findings.map(f => {
    const emoji = { CRITICAL: '🔴', MAJOR: '🟠', MINOR: '🟡', POSITIVE: '🟢' }[f.severity];
    return `[${f.testId}] ${emoji} ${f.category}: ${f.title}\n   ${f.description}`;
  }).join('\n\n');

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Report saved to: ${reportPath}\n`);
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test all 6 scenarios
    await testForm(page, 'Premises Licence New - Upload Path', 'new', 'upload');
    await testForm(page, 'Premises Licence New - Template Path', 'new', 'template');
    await testForm(page, 'Premises Licence Variation - Upload Path', 'variation', 'upload');
    await testForm(page, 'Premises Licence Variation - Template Path', 'variation', 'template');
    await testForm(page, 'Premises Licence Review - Upload Path', 'review', 'upload');
    await testForm(page, 'Premises Licence Review - Template Path', 'review', 'template');

    await generateReport();

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

main();
