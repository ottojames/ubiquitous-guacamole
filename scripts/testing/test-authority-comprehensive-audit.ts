import { chromium, type Page, type Browser } from 'playwright';

const BASE_URL = 'http://localhost:5173';

type NoticeConfig = {
  testId: string;
  name: string;
  category: string;
  authority: string;
};

// ALL notice types organized by authority
const NOTICE_CONFIGS: NoticeConfig[] = [
  // LICENSING ACT 2003 - Licensing Manager
  { testId: 'notice-option-licensing-premises-new', name: 'Premises Licence — New', category: 'Licensing Act 2003', authority: 'Licensing Manager' },
  { testId: 'notice-option-licensing-premises-variation', name: 'Premises Licence — Variation', category: 'Licensing Act 2003', authority: 'Licensing Manager' },
  { testId: 'notice-option-licensing-premises-review', name: 'Premises Licence — Review', category: 'Licensing Act 2003', authority: 'Licensing Manager' },
  { testId: 'notice-option-licensing-club-new', name: 'Club Premises Certificate — New', category: 'Licensing Act 2003', authority: 'Licensing Manager' },
  { testId: 'notice-option-licensing-club-variation', name: 'Club Premises Certificate — Variation', category: 'Licensing Act 2003', authority: 'Licensing Manager' },
  { testId: 'notice-option-licensing-club-review', name: 'Club Premises Certificate — Review', category: 'Licensing Act 2003', authority: 'Licensing Manager' },

  // GAMBLING ACT 2005 - Licensing Manager (Gambling & Alcohol Licensing)
  { testId: 'notice-option-gambling-betting-new', name: 'Betting — New', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-betting-variation', name: 'Betting — Variation', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-betting-review', name: 'Betting — Review', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-betting-transfer', name: 'Betting — Transfer', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-bingo-new', name: 'Bingo — New', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-bingo-variation', name: 'Bingo — Variation', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-bingo-review', name: 'Bingo — Review', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-bingo-transfer', name: 'Bingo — Transfer', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-agc-new', name: 'Adult Gaming Centre — New', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-agc-variation', name: 'Adult Gaming Centre — Variation', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-agc-review', name: 'Adult Gaming Centre — Review', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-agc-transfer', name: 'Adult Gaming Centre — Transfer', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-fec-new', name: 'Family Entertainment Centre — New', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-fec-variation', name: 'Family Entertainment Centre — Variation', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-fec-review', name: 'Family Entertainment Centre — Review', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },
  { testId: 'notice-option-gambling-fec-transfer', name: 'Family Entertainment Centre — Transfer', category: 'Gambling Act 2005', authority: 'Licensing Manager (Gambling)' },

  // GVOL - Traffic Commissioner
  { testId: 'notice-option-gvol-new', name: 'GVOL — New', category: 'GVOL', authority: 'Traffic Commissioner' },
  { testId: 'notice-option-gvol-variation', name: 'GVOL — Variation', category: 'GVOL', authority: 'Traffic Commissioner' },

  // PLANNING - Head of Planning
  { testId: 'notice-option-planning-major', name: 'Major Development', category: 'Planning', authority: 'Head of Planning' },
  { testId: 'notice-option-planning-eia', name: 'EIA Development', category: 'Planning', authority: 'Head of Planning' },
  { testId: 'notice-option-planning-listed', name: 'Listed Building', category: 'Planning', authority: 'Head of Planning' },
  { testId: 'notice-option-planning-conservation', name: 'Conservation Area', category: 'Planning', authority: 'Head of Planning' },
  { testId: 'notice-option-planning-prow', name: 'Public Right of Way', category: 'Planning', authority: 'Head of Planning' },
  { testId: 'notice-option-planning-departure', name: 'Departure', category: 'Planning', authority: 'Head of Planning' },

  // PROBATE - Probate Registry (HM Courts & Tribunals Service)
  { testId: 'notice-option-probate-trustee-s27', name: 'Trustee Act 1925 s.27', category: 'Probate', authority: 'Probate Registry' },
];

type TestResult = {
  config: NoticeConfig;
  templatePathAvailable: boolean;
  uploadPathAvailable: boolean;
  templateStep2Complete: boolean;
  templateStep3Loaded: boolean;
  templatePreviewGenerated: boolean;
  templatePreviewLength: number;
  uiIssues: string[];
  functionalIssues: string[];
  complianceIssues: string[];
};

async function testNoticePath(page: Page, config: NoticeConfig): Promise<TestResult> {
  const result: TestResult = {
    config,
    templatePathAvailable: false,
    uploadPathAvailable: false,
    templateStep2Complete: false,
    templateStep3Loaded: false,
    templatePreviewGenerated: false,
    templatePreviewLength: 0,
    uiIssues: [],
    functionalIssues: [],
    complianceIssues: [],
  };

  try {
    // Step 1: Navigate and select notice type
    await page.goto(`${BASE_URL}/publish/step-1`, { waitUntil: 'networkidle' });

    const noticeOption = page.getByTestId(config.testId);
    const optionExists = await noticeOption.count();

    if (optionExists === 0) {
      result.functionalIssues.push('Notice type option not found on Step 1');
      return result;
    }

    await noticeOption.click();
    await page.waitForTimeout(300);

    const continueStep1 = page.locator('button:has-text("Continue")');
    await continueStep1.click();
    await page.waitForLoadState('networkidle');

    // Step 2: Check available upload methods
    const useTemplateBtn = page.locator('button:has-text("Structured template")');
    const uploadNoticeBtn = page.locator('button:has-text("Upload & OCR")');

    result.templatePathAvailable = await useTemplateBtn.isVisible();
    result.uploadPathAvailable = await uploadNoticeBtn.isVisible();

    if (!result.templatePathAvailable && !result.uploadPathAvailable) {
      result.functionalIssues.push('No upload methods available');
      return result;
    }

    // Test template path if available
    if (result.templatePathAvailable) {
      await useTemplateBtn.click();
      await page.waitForTimeout(2000);

      // Check for "Load example data" button
      const loadExampleBtn = page.locator('button:has-text("Load example data")');
      if (await loadExampleBtn.isVisible()) {
        await loadExampleBtn.click();
        await page.waitForTimeout(2000);

        // Check Continue button
        const continueBtn = page.locator('button:has-text("Continue")').last();
        const isEnabled = await continueBtn.isEnabled();

        if (isEnabled) {
          result.templateStep2Complete = true;

          // Navigate to Step 3
          await continueBtn.click();
          await page.waitForTimeout(3000);

          const step3Heading = page.locator('text="Confirm your notice"');
          const step3Visible = await step3Heading.isVisible().catch(() => false);

          if (step3Visible) {
            result.templateStep3Loaded = true;

            // Check preview
            const previewContainer = page.locator('.rounded-xl.border.border-slate-200').first();
            const previewText = await previewContainer.textContent().catch(() => '');

            if (previewText && previewText.length > 100 &&
                !previewText.includes('No preview yet') &&
                !previewText.includes('Loading')) {
              result.templatePreviewGenerated = true;
              result.templatePreviewLength = previewText.length;

              // Compliance check: Verify statutory elements
              if (config.category === 'Licensing Act 2003') {
                if (!previewText.includes('LICENSING ACT 2003')) {
                  result.complianceIssues.push('Missing "LICENSING ACT 2003" heading');
                }
                if (!previewText.toLowerCase().includes('representations')) {
                  result.complianceIssues.push('Missing representations information');
                }
              } else if (config.category === 'Gambling Act 2005') {
                if (!previewText.includes('GAMBLING ACT 2005')) {
                  result.complianceIssues.push('Missing "GAMBLING ACT 2005" heading');
                }
              } else if (config.category === 'Planning') {
                if (!previewText.toLowerCase().includes('planning')) {
                  result.complianceIssues.push('Missing planning reference');
                }
              }
            } else {
              result.functionalIssues.push('Preview not generated at Step 3');
            }
          } else {
            result.functionalIssues.push('Step 3 did not load');
          }
        } else {
          result.functionalIssues.push('Continue button disabled after loading example data');
        }
      } else {
        result.functionalIssues.push('Load example data button not found');
      }
    }

  } catch (error) {
    result.functionalIssues.push(`Error: ${error}`);
  }

  return result;
}

async function runAuthorityAudit() {
  console.log('═'.repeat(100));
  console.log('🏛️  COMPREHENSIVE AUTHORITY PERSPECTIVE AUDIT');
  console.log('═'.repeat(100));
  console.log('\n');

  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: TestResult[] = [];
  const byAuthority = new Map<string, TestResult[]>();

  console.log(`📋 Testing ${NOTICE_CONFIGS.length} notice types across all authorities...\n`);

  for (let i = 0; i < NOTICE_CONFIGS.length; i++) {
    const config = NOTICE_CONFIGS[i];

    console.log(`[${i + 1}/${NOTICE_CONFIGS.length}] ${config.name}...`);

    const result = await testNoticePath(page, config);
    results.push(result);

    // Group by authority
    if (!byAuthority.has(config.authority)) {
      byAuthority.set(config.authority, []);
    }
    byAuthority.get(config.authority)!.push(result);

    // Small delay between tests
    await page.waitForTimeout(500);
  }

  await browser.close();

  // Generate report
  console.log('\n\n');
  console.log('═'.repeat(100));
  console.log('📊 AUTHORITY PERSPECTIVE REPORT');
  console.log('═'.repeat(100));
  console.log('\n');

  // Overall statistics
  const totalNotices = results.length;
  const templateAvailable = results.filter(r => r.templatePathAvailable).length;
  const uploadAvailable = results.filter(r => r.uploadPathAvailable).length;
  const step2Complete = results.filter(r => r.templateStep2Complete).length;
  const step3Loaded = results.filter(r => r.templateStep3Loaded).length;
  const previewGenerated = results.filter(r => r.templatePreviewGenerated).length;
  const hasIssues = results.filter(r =>
    r.uiIssues.length > 0 ||
    r.functionalIssues.length > 0 ||
    r.complianceIssues.length > 0
  ).length;

  console.log('OVERALL STATISTICS');
  console.log('─'.repeat(100));
  console.log(`Total Notice Types: ${totalNotices}`);
  console.log(`Template Path Available: ${templateAvailable}/${totalNotices} (${((templateAvailable/totalNotices)*100).toFixed(1)}%)`);
  console.log(`Upload Path Available: ${uploadAvailable}/${totalNotices} (${((uploadAvailable/totalNotices)*100).toFixed(1)}%)`);
  console.log(`Step 2 Complete (Template): ${step2Complete}/${totalNotices} (${((step2Complete/totalNotices)*100).toFixed(1)}%)`);
  console.log(`Step 3 Loaded (Template): ${step3Loaded}/${totalNotices} (${((step3Loaded/totalNotices)*100).toFixed(1)}%)`);
  console.log(`Preview Generated (Template): ${previewGenerated}/${totalNotices} (${((previewGenerated/totalNotices)*100).toFixed(1)}%)`);
  console.log(`Notices with Issues: ${hasIssues}/${totalNotices}`);
  console.log('\n\n');

  // Report by authority
  for (const [authority, authorityResults] of byAuthority.entries()) {
    console.log('═'.repeat(100));
    console.log(`🏛️  ${authority.toUpperCase()}`);
    console.log('═'.repeat(100));
    console.log('\n');

    const authTotal = authorityResults.length;
    const authPreviewGenerated = authorityResults.filter(r => r.templatePreviewGenerated).length;
    const authHasIssues = authorityResults.filter(r =>
      r.uiIssues.length > 0 ||
      r.functionalIssues.length > 0 ||
      r.complianceIssues.length > 0
    );

    console.log(`Total Notice Types: ${authTotal}`);
    console.log(`Working End-to-End: ${authPreviewGenerated}/${authTotal} (${((authPreviewGenerated/authTotal)*100).toFixed(1)}%)`);
    console.log(`Notices with Issues: ${authHasIssues.length}/${authTotal}`);
    console.log('\n');

    // Detailed results for this authority
    authorityResults.forEach((result, index) => {
      const status = result.templatePreviewGenerated ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.config.name}: ${status}`);

      if (result.templatePreviewGenerated) {
        console.log(`   Preview: ${result.templatePreviewLength} characters`);
      }

      if (result.functionalIssues.length > 0) {
        console.log(`   ⚠️  Functional Issues:`);
        result.functionalIssues.forEach(issue => console.log(`      - ${issue}`));
      }

      if (result.complianceIssues.length > 0) {
        console.log(`   ⚠️  Compliance Issues:`);
        result.complianceIssues.forEach(issue => console.log(`      - ${issue}`));
      }

      if (result.uiIssues.length > 0) {
        console.log(`   ⚠️  UI/UX Issues:`);
        result.uiIssues.forEach(issue => console.log(`      - ${issue}`));
      }
      console.log('');
    });
    console.log('\n');
  }

  // Final summary
  console.log('═'.repeat(100));
  console.log('🎯 FINAL VERDICT');
  console.log('═'.repeat(100));
  console.log('\n');

  if (previewGenerated === totalNotices && hasIssues === 0) {
    console.log('✅ ALL NOTICE TYPES PASS - SYSTEM READY FOR AUTHORITY USE');
  } else {
    console.log(`⚠️  ${totalNotices - previewGenerated} notice type(s) failed end-to-end test`);
    console.log(`⚠️  ${hasIssues} notice type(s) have issues requiring attention`);
  }
  console.log('\n');
}

runAuthorityAudit();
