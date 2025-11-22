import { test, expect } from '@playwright/test';

test('Manual flow with comprehensive logging', async ({ page, context }) => {
  const allLogs: string[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(text);

    // Print important logs immediately
    if (
      text.includes('[TemplateBuilderForm]') ||
      text.includes('[CouncilDepartmentSelect]') ||
      text.includes('Bristol') ||
      text.includes('🔥')
    ) {
      console.log('🎯 IMPORTANT:', text);
    }
  });

  console.log('\\n========== STEP 1: Load Homepage ==========');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('\\n========== STEP 2: Go to /publish/step-1 ==========');
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/manual-step-1.png', fullPage: true });

  console.log('\\n========== STEP 3: Find and click Premises Licence button ==========');
  const premisesButton = page.locator('[data-testid="notice-option-licensing-premises-new"]');
  const buttonCount = await premisesButton.count();
  console.log(`Found ${buttonCount} Premises Licence buttons`);

  if (buttonCount > 0) {
    const isVisible = await premisesButton.isVisible();
    console.log(`Button visible: ${isVisible}`);

    // Use JavaScript to click directly (bypasses visibility checks)
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="notice-option-licensing-premises-new"]') as HTMLElement;
      if (button) {
        button.click();
      }
    });
    console.log('✓ Clicked Premises Licence button (via JavaScript)');
    await page.waitForTimeout(1000);
  }

  console.log('\\n========== STEP 4: Click Next button ==========');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
    if (nextButton) {
      (nextButton as HTMLElement).click();
    }
  });
  await page.waitForURL(/step-2/, { timeout: 10000 });
  console.log('✓ Navigated to step-2');
  await page.waitForTimeout(1000);

  // Screenshot step 2
  await page.screenshot({ path: '/tmp/manual-step-2.png', fullPage: true });

  console.log('\\n========== STEP 5: Click Build from template ==========');
  await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('button, label'));
    const templateElement = allElements.find(el => el.textContent?.includes('Build from template'));
    if (templateElement) {
      (templateElement as HTMLElement).click();
    }
  });
  console.log('✓ Clicked Build from template');
  await page.waitForTimeout(3000); // Give time for lazy load and render

  // Screenshot template form
  await page.screenshot({ path: '/tmp/manual-template-form.png', fullPage: true });

  console.log('\\n========== STEP 6: Find council input field ==========');
  const councilInput = page.locator('input[name="authorityname"]');
  const inputCount = await councilInput.count();
  console.log(`Found ${inputCount} council input fields`);

  if (inputCount > 0) {
    console.log('✓ Council input found!');

    console.log('\\n========== STEP 7: Click input and type "bristol" ==========');
    await councilInput.click();
    await page.waitForTimeout(1000);

    await councilInput.fill('bristol');
    await page.waitForTimeout(3000); // Wait for dropdown and database query

    // Screenshot after typing
    await page.screenshot({ path: '/tmp/manual-after-typing-bristol.png', fullPage: true });

    console.log('\\n========== STEP 8: Check for Bristol Council in dropdown ==========');
    const bodyText = await page.textContent('body');

    if (bodyText?.includes('Bristol')) {
      console.log('✅ SUCCESS: "Bristol" found on page!');

      if (bodyText.includes('Bristol Council')) {
        console.log('✅ SUCCESS: "Bristol Council" found on page!');
      }

      if (bodyText.includes('Sampleton')) {
        console.log('⚠️ WARNING: "Sampleton" also found (old static data still present)');
      }
    } else {
      console.log('❌ FAIL: "Bristol" NOT found on page');
    }
  } else {
    console.log('❌ FAIL: Council input not found');
  }

  // Wait for any late logs
  await page.waitForTimeout(2000);

  console.log('\\n========== FINAL ANALYSIS ==========');

  const templateFormLogs = allLogs.filter(log => log.includes('[TemplateBuilderForm]'));
  const councilSelectLogs = allLogs.filter(log => log.includes('[CouncilDepartmentSelect]'));
  const versionMarkerLogs = allLogs.filter(log => log.includes('v2025-11-17'));
  const bristolLogs = allLogs.filter(log => log.includes('Bristol'));

  console.log(`\\nTotal console messages: ${allLogs.length}`);
  console.log(`TemplateBuilderForm logs: ${templateFormLogs.length}`);
  console.log(`CouncilDepartmentSelect logs: ${councilSelectLogs.length}`);
  console.log(`Version marker logs: ${versionMarkerLogs.length}`);
  console.log(`Bristol-related logs: ${bristolLogs.length}`);

  if (versionMarkerLogs.length > 0) {
    console.log('\\n✅ NEW VERSION OF TemplateBuilderForm LOADED:');
    versionMarkerLogs.forEach(log => console.log(`  - ${log}`));
  } else {
    console.log('\\n❌ OLD VERSION OF TemplateBuilderForm (cached)');
  }

  if (councilSelectLogs.length > 0) {
    console.log('\\n📋 CouncilDepartmentSelect Logs:');
    councilSelectLogs.slice(0, 10).forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    if (councilSelectLogs.length > 10) {
      console.log(`  ... and ${councilSelectLogs.length - 10} more`);
    }
  }

  const hasRenderStart = councilSelectLogs.some(log => log.includes('RENDER START'));
  const hasTestUseEffect = councilSelectLogs.some(log => log.includes('TEST useEffect'));
  const hasDatabaseLoad = councilSelectLogs.some(log => log.includes('DATABASE LOAD useEffect'));
  const hasQueryExecuting = councilSelectLogs.some(log => log.includes('Executing query'));
  const hasDataReturned = councilSelectLogs.some(log => log.includes('Query complete'));

  console.log('\\n📊 useEffect Analysis:');
  console.log(`  - Component rendered: ${hasRenderStart}`);
  console.log(`  - TEST useEffect ran: ${hasTestUseEffect}`);
  console.log(`  - DATABASE LOAD useEffect ran: ${hasDatabaseLoad}`);
  console.log(`  - Query executing: ${hasQueryExecuting}`);
  console.log(`  - Data returned: ${hasDataReturned}`);

  // Create a final summary
  const summary = {
    versionLoaded: versionMarkerLogs.length > 0,
    componentRendered: hasRenderStart,
    useEffectWorks: hasTestUseEffect,
    databaseLoadTriggered: hasDatabaseLoad,
    queryExecuted: hasQueryExecuting,
    dataReceived: hasDataReturned,
  };

  console.log('\\n========== SUMMARY ==========');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\\nScreenshots saved to:');
  console.log('  /tmp/manual-step-1.png');
  console.log('  /tmp/manual-step-2.png');
  console.log('  /tmp/manual-template-form.png');
  console.log('  /tmp/manual-after-typing-bristol.png');
});
