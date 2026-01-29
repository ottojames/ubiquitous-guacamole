import { test } from '@playwright/test';

test('Console logger - capture all CouncilDepartmentSelect logs', async ({ page }) => {
  const logs: string[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log('📢 CONSOLE:', text);
    logs.push(text);
  });

  console.log('=== TEST START ===');
  console.log('Navigating to homepage...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\\n=== Navigating to /publish/step-1 ===');
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check what logs we captured
  const councilLogs = logs.filter(log => log.includes('[CouncilDepartmentSelect]'));
  console.log('\\n=== CAPTURED LOGS ===');
  console.log(`Total console messages: ${logs.length}`);
  console.log(`CouncilDepartmentSelect messages: ${councilLogs.length}`);

  if (councilLogs.length > 0) {
    console.log('\\n=== CouncilDepartmentSelect Logs ===');
    councilLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
  }

  // Check for specific log patterns
  const hasRenderStart = councilLogs.some(log => log.includes('RENDER START'));
  const hasTestUseEffect = councilLogs.some(log => log.includes('TEST useEffect'));
  const hasDatabaseLoad = councilLogs.some(log => log.includes('DATABASE LOAD useEffect'));

  console.log('\\n=== Log Analysis ===');
  console.log(`Has "RENDER START": ${hasRenderStart}`);
  console.log(`Has "TEST useEffect": ${hasTestUseEffect}`);
  console.log(`Has "DATABASE LOAD useEffect": ${hasDatabaseLoad}`);

  // Wait a bit more to see if late logs appear
  console.log('\\n=== Waiting 5 more seconds for late logs ===');
  await page.waitForTimeout(5000);

  const newLogs = logs.filter(log => log.includes('[CouncilDepartmentSelect]'));
  console.log(`New CouncilDepartmentSelect logs: ${newLogs.length - councilLogs.length}`);
});
