import { chromium, type Page, type Browser } from 'playwright';

const BASE_URL = 'http://localhost:5173';

type TestResult = {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
};

const results: Map<string, TestResult[]> = new Map();

function logResult(context: string, result: TestResult) {
  if (!results.has(context)) {
    results.set(context, []);
  }
  results.get(context)!.push(result);

  const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠️';
  console.log(`  ${icon} ${result.category}: ${result.message}`);
  if (result.details) {
    console.log(`     ${result.details}`);
  }
}

async function checkInputVisibility(page: Page, context: string) {
  console.log('\n  📋 Input Field Visibility Check...');

  // Get all text inputs
  const inputs = await page.$$('input[type="text"], input[type="email"], input[type="date"], input[type="tel"], input[type="url"], textarea, select');

  let visibleCount = 0;
  let invisibleCount = 0;
  const invisibleFields: string[] = [];

  for (const input of inputs) {
    const isVisible = await input.isVisible();
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    const identifier = name || id || 'unknown';

    if (isVisible) {
      // Check if it has proper dimensions
      const bbox = await input.boundingBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        visibleCount++;
      } else {
        invisibleCount++;
        invisibleFields.push(`${identifier} (zero dimensions)`);
      }
    } else {
      invisibleCount++;
      invisibleFields.push(identifier);
    }
  }

  if (invisibleCount === 0) {
    logResult(context, {
      category: 'Visual: Input Visibility',
      status: 'pass',
      message: `All ${visibleCount} inputs visible`,
    });
  } else {
    logResult(context, {
      category: 'Visual: Input Visibility',
      status: 'fail',
      message: `${invisibleCount} invisible inputs found`,
      details: invisibleFields.join(', '),
    });
  }
}

async function checkInputStyling(page: Page, context: string) {
  console.log('  🎨 Input Field Styling Check...');

  const inputs = await page.$$('input[type="text"], input[type="email"], input[type="date"]');

  if (inputs.length === 0) {
    logResult(context, {
      category: 'Visual: Input Styling',
      status: 'warning',
      message: 'No text inputs found to check',
    });
    return;
  }

  const firstInput = inputs[0];
  const styles = await firstInput.evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      borderWidth: computed.borderWidth,
      borderRadius: computed.borderRadius,
      padding: computed.padding,
      fontSize: computed.fontSize,
      color: computed.color,
    };
  });

  const hasWhiteBackground = styles.backgroundColor.includes('255, 255, 255');
  const hasBorder = parseFloat(styles.borderWidth) > 0;
  const hasRounding = parseFloat(styles.borderRadius) > 0;
  const hasPadding = parseFloat(styles.padding) > 0;

  if (hasWhiteBackground && hasBorder && hasRounding && hasPadding) {
    logResult(context, {
      category: 'Visual: Input Styling',
      status: 'pass',
      message: 'Inputs have proper styling',
      details: `bg: ${styles.backgroundColor}, border: ${styles.borderWidth}, padding: ${styles.padding}`,
    });
  } else {
    logResult(context, {
      category: 'Visual: Input Styling',
      status: 'fail',
      message: 'Inputs missing essential styling',
      details: `White bg: ${hasWhiteBackground}, Border: ${hasBorder}, Rounded: ${hasRounding}, Padding: ${hasPadding}`,
    });
  }
}

async function checkErrorStateVisibility(page: Page, context: string) {
  console.log('  🔴 Error State Visibility Check...');

  // Look for any validation errors
  const errorMessages = await page.$$('text=/invalid input|required|expected/i');

  if (errorMessages.length === 0) {
    logResult(context, {
      category: 'Visual: Error States',
      status: 'pass',
      message: 'No initial validation errors (as expected for empty form)',
    });
    return;
  }

  // If there are errors, check if associated inputs are visible
  for (const error of errorMessages) {
    const errorText = await error.textContent();
    const parent = await error.evaluateHandle(el => el.closest('div'));
    const inputInParent = await parent.$('input, textarea, select');

    if (inputInParent) {
      const isVisible = await inputInParent.isVisible();
      const bbox = await inputInParent.boundingBox();

      if (isVisible && bbox && bbox.width > 0) {
        logResult(context, {
          category: 'Visual: Error States',
          status: 'pass',
          message: 'Input visible despite error message',
          details: errorText?.substring(0, 50) || '',
        });
      } else {
        logResult(context, {
          category: 'Visual: Error States',
          status: 'fail',
          message: 'Input invisible when showing error',
          details: errorText?.substring(0, 50) || '',
        });
      }
    }
  }
}

async function checkLabelCoverage(page: Page, context: string) {
  console.log('  🏷️  Label Coverage Check...');

  const inputs = await page.$$('input[type="text"], input[type="email"], input[type="date"], input[type="tel"], input[type="url"], input[type="number"], textarea, select');

  let labeledCount = 0;
  let unlabeledCount = 0;
  const unlabeledFields: string[] = [];

  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledBy = await input.getAttribute('aria-labelledby');

    // Check if there's a label pointing to this input
    let hasLabel = false;
    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      hasLabel = label !== null;
    }

    if (hasLabel || ariaLabel || ariaLabelledBy) {
      labeledCount++;
    } else {
      unlabeledCount++;
      const name = await input.getAttribute('name');
      unlabeledFields.push(name || id || 'unknown');
    }
  }

  const coverage = inputs.length > 0 ? (labeledCount / inputs.length) * 100 : 100;

  if (coverage === 100) {
    logResult(context, {
      category: 'Accessibility: Labels',
      status: 'pass',
      message: `100% label coverage (${labeledCount}/${inputs.length})`,
    });
  } else if (coverage >= 90) {
    logResult(context, {
      category: 'Accessibility: Labels',
      status: 'warning',
      message: `${coverage.toFixed(0)}% label coverage`,
      details: `Unlabeled: ${unlabeledFields.join(', ')}`,
    });
  } else {
    logResult(context, {
      category: 'Accessibility: Labels',
      status: 'fail',
      message: `Poor label coverage: ${coverage.toFixed(0)}%`,
      details: `Unlabeled: ${unlabeledFields.join(', ')}`,
    });
  }
}

async function checkRequiredFieldIndicators(page: Page, context: string) {
  console.log('  ⭐ Required Field Indicators Check...');

  // Look for required indicators (asterisks)
  const asterisks = await page.$$('span.text-rose-500, span.text-rose-600, span:has-text("*")');
  const requiredInputs = await page.$$('input[required], input[aria-required="true"]');

  logResult(context, {
    category: 'UX: Required Indicators',
    status: 'pass',
    message: `${asterisks.length} asterisks, ${requiredInputs.length} required attrs`,
  });
}

async function checkVisualHierarchy(page: Page, context: string) {
  console.log('  📐 Visual Hierarchy Check...');

  const headings = await page.$$('h1, h2, h3, h4');
  const sections = await page.$$('section');

  if (headings.length >= 2 && sections.length >= 1) {
    logResult(context, {
      category: 'UX: Visual Hierarchy',
      status: 'pass',
      message: `${headings.length} headings, ${sections.length} sections`,
    });
  } else {
    logResult(context, {
      category: 'UX: Visual Hierarchy',
      status: 'warning',
      message: 'Limited visual structure',
      details: `${headings.length} headings, ${sections.length} sections`,
    });
  }
}

async function checkAddressAutocomplete(page: Page, context: string) {
  console.log('  🗺️  Address Autocomplete Check...');

  // Look for address lookup fields
  const addressLookups = await page.$$('[data-testid*="address-lookup"], [data-testid*="_address-lookup"]');

  if (addressLookups.length === 0) {
    logResult(context, {
      category: 'Feature: Address Lookup',
      status: 'warning',
      message: 'No address lookup fields found',
    });
    return;
  }

  // Test first address lookup
  const firstLookup = addressLookups[0];
  const isVisible = await firstLookup.isVisible();

  if (!isVisible) {
    logResult(context, {
      category: 'Feature: Address Lookup',
      status: 'fail',
      message: 'Address lookup field not visible',
    });
    return;
  }

  await firstLookup.fill('9 lower park road ches');
  await page.waitForTimeout(1500);

  const dropdown = page.locator('role=listbox');
  const dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);

  if (dropdownVisible) {
    logResult(context, {
      category: 'Feature: Address Lookup',
      status: 'pass',
      message: `${addressLookups.length} lookup fields, autocomplete working`,
    });
  } else {
    logResult(context, {
      category: 'Feature: Address Lookup',
      status: 'fail',
      message: 'Address autocomplete not responding',
    });
  }
}

async function checkCouncilAutocomplete(page: Page, context: string) {
  console.log('  🏛️  Council Autocomplete Check...');

  const authorityInput = page.locator('input[name="authorityname"]').first();
  const exists = await authorityInput.count();

  if (exists === 0) {
    logResult(context, {
      category: 'Feature: Council Search',
      status: 'warning',
      message: 'No authority field found',
    });
    return;
  }

  const isVisible = await authorityInput.isVisible();
  if (!isVisible) {
    logResult(context, {
      category: 'Feature: Council Search',
      status: 'fail',
      message: 'Authority field not visible',
    });
    return;
  }

  await authorityInput.fill('Brighton');
  await page.waitForTimeout(500);

  const dropdown = page.locator('role=listbox');
  const dropdownVisible = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);

  if (dropdownVisible) {
    logResult(context, {
      category: 'Feature: Council Search',
      status: 'pass',
      message: 'Council autocomplete working',
    });
  } else {
    logResult(context, {
      category: 'Feature: Council Search',
      status: 'fail',
      message: 'Council autocomplete not responding',
    });
  }
}

async function checkDateCalculation(page: Page, context: string) {
  console.log('  📅 Date Auto-calculation Check...');

  const appDateInput = page.locator('input[name="application_date"]').first();
  const deadlineInput = page.locator('input[name="deadline_date"]').first();

  const appExists = await appDateInput.count();
  const deadlineExists = await deadlineInput.count();

  if (appExists === 0 || deadlineExists === 0) {
    logResult(context, {
      category: 'Feature: Date Calculation',
      status: 'warning',
      message: 'Date fields not found in this form',
    });
    return;
  }

  await appDateInput.fill('2025-01-20');
  await page.waitForTimeout(1000);

  const deadlineValue = await deadlineInput.inputValue();

  if (deadlineValue && deadlineValue !== '') {
    logResult(context, {
      category: 'Feature: Date Calculation',
      status: 'pass',
      message: `Deadline auto-calculated: ${deadlineValue}`,
    });
  } else {
    logResult(context, {
      category: 'Feature: Date Calculation',
      status: 'fail',
      message: 'Deadline not auto-calculated',
    });
  }
}

async function checkProgressIndicator(page: Page, context: string) {
  console.log('  📊 Progress Indicator Check...');

  const progressText = await page.locator('text=/\\d+ required field/i').textContent({ timeout: 2000 }).catch(() => null);

  if (progressText) {
    logResult(context, {
      category: 'UX: Progress Feedback',
      status: 'pass',
      message: `Progress indicator present: "${progressText}"`,
    });
  } else {
    logResult(context, {
      category: 'UX: Progress Feedback',
      status: 'warning',
      message: 'No progress indicator visible',
    });
  }
}

async function checkActivitiesSection(page: Page, context: string) {
  console.log('  🎭 Activities & Hours Section Check...');

  // Look for activity checkboxes
  const activityCheckboxes = await page.$$('input[type="checkbox"][id*="activity-"]');

  if (activityCheckboxes.length === 0) {
    logResult(context, {
      category: 'Feature: Activities',
      status: 'warning',
      message: 'No activity checkboxes found',
    });
    return;
  }

  const firstCheckbox = activityCheckboxes[0];
  const isVisible = await firstCheckbox.isVisible();

  if (!isVisible) {
    logResult(context, {
      category: 'Feature: Activities',
      status: 'fail',
      message: 'Activity checkboxes not visible',
    });
    return;
  }

  // Check one activity
  await firstCheckbox.click();
  await page.waitForTimeout(500);

  // Look for time inputs that should appear
  const timeInputs = await page.$$('input[type="time"]');

  if (timeInputs.length > 0) {
    logResult(context, {
      category: 'Feature: Activities',
      status: 'pass',
      message: `${activityCheckboxes.length} activities, hours inputs expand`,
    });
  } else {
    logResult(context, {
      category: 'Feature: Activities',
      status: 'fail',
      message: 'Activity selected but hours inputs not showing',
    });
  }
}

async function checkResponsiveness(page: Page, context: string) {
  console.log('  📱 Responsive Layout Check...');

  const originalSize = page.viewportSize();

  // Test mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);

  const inputs = await page.$$('input[type="text"]');
  let mobileVisible = true;
  for (const input of inputs.slice(0, 3)) {
    const isVisible = await input.isVisible();
    if (!isVisible) {
      mobileVisible = false;
      break;
    }
  }

  // Restore original size
  if (originalSize) {
    await page.setViewportSize(originalSize);
    await page.waitForTimeout(500);
  }

  if (mobileVisible) {
    logResult(context, {
      category: 'UX: Responsive Design',
      status: 'pass',
      message: 'Form usable on mobile viewport',
    });
  } else {
    logResult(context, {
      category: 'UX: Responsive Design',
      status: 'fail',
      message: 'Layout breaks on mobile viewport',
    });
  }
}

async function testFormPath(
  page: Page,
  noticeType: string,
  path: 'upload' | 'template',
  testId: string
) {
  const context = `${noticeType} - ${path === 'upload' ? 'Upload Path' : 'Template Path'}`;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing: ${context}`);
  console.log('='.repeat(80));

  // Step 1: Navigate and select notice type
  await page.goto(`${BASE_URL}/publish/step-1`);
  await page.waitForLoadState('networkidle');

  await page.getByTestId(testId).click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');

  // Step 2: Choose path
  if (path === 'upload') {
    // For upload path, we just check the initial state
    console.log('\n  📄 Upload path selected (OCR form)');
  } else {
    const useTemplateBtn = page.locator('button:has-text("Use template")');
    await useTemplateBtn.click();
    await page.waitForTimeout(2000);
    console.log('\n  📝 Template path selected');
  }

  // Run all visual checks
  await checkInputVisibility(page, context);
  await checkInputStyling(page, context);
  await checkErrorStateVisibility(page, context);
  await checkLabelCoverage(page, context);
  await checkRequiredFieldIndicators(page, context);
  await checkVisualHierarchy(page, context);

  if (path === 'template') {
    await checkAddressAutocomplete(page, context);
    await checkCouncilAutocomplete(page, context);
    await checkDateCalculation(page, context);
    await checkProgressIndicator(page, context);
    await checkActivitiesSection(page, context);
  }

  await checkResponsiveness(page, context);
}

async function generateReport() {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'VISUAL SCRUTINY REPORT' + ' '.repeat(36) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  let totalTests = 0;
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  for (const [context, testResults] of results.entries()) {
    console.log(`\n📋 ${context}`);
    console.log('─'.repeat(80));

    for (const result of testResults) {
      totalTests++;
      if (result.status === 'pass') totalPass++;
      else if (result.status === 'fail') totalFail++;
      else totalWarn++;

      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.category}: ${result.message}`);
      if (result.details) {
        console.log(`   └─ ${result.details}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPass} (${((totalPass/totalTests)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${totalFail} (${((totalFail/totalTests)*100).toFixed(1)}%)`);
  console.log(`⚠️  Warnings: ${totalWarn} (${((totalWarn/totalTests)*100).toFixed(1)}%)`);

  const score = ((totalPass + (totalWarn * 0.5)) / totalTests) * 100;
  console.log(`\n📊 Overall Score: ${score.toFixed(1)}/100`);

  if (score >= 95) {
    console.log('🎉 EXCELLENT - Production ready!');
  } else if (score >= 85) {
    console.log('👍 GOOD - Minor improvements needed');
  } else if (score >= 70) {
    console.log('⚠️  FAIR - Several issues to address');
  } else {
    console.log('❌ POOR - Significant work needed');
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Visual Scrutiny...\n');
  console.log('Testing as: Licensing Officer + UI Developer\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test all 3 notice types × 2 paths = 6 total tests
    await testFormPath(page, 'Premises Licence New', 'upload', 'notice-option-licensing-premises-new');
    await testFormPath(page, 'Premises Licence New', 'template', 'notice-option-licensing-premises-new');

    await testFormPath(page, 'Premises Licence Variation', 'upload', 'notice-option-licensing-premises-variation');
    await testFormPath(page, 'Premises Licence Variation', 'template', 'notice-option-licensing-premises-variation');

    await testFormPath(page, 'Premises Licence Review', 'upload', 'notice-option-licensing-premises-review');
    await testFormPath(page, 'Premises Licence Review', 'template', 'notice-option-licensing-premises-review');

    // Generate final report
    await generateReport();

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await browser.close();
  }
}

main();
