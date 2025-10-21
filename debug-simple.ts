import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('notice-option-licensing-premises-new').click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check all inputs with name attribute
  const inputs = await page.$$eval('input[name], select[name], textarea[name]', els =>
    els.map(el => ({
      name: el.getAttribute('name'),
      visible: (el as HTMLElement).offsetParent !== null,
      type: el.getAttribute('type')
    }))
  );

  console.log('\n🔍 All inputs with name attribute:');
  inputs.forEach(i => console.log(`  ${i.visible ? '✓' : '✗'} name="${i.name}" type="${i.type}"`));

  console.log('\n✓ Looking specifically for:');
  console.log(`  - applicantname: ${inputs.some(i => i.name === 'applicantname' && i.visible) ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  - premisesname: ${inputs.some(i => i.name === 'premisesname' && i.visible) ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  - authorityname: ${inputs.some(i => i.name === 'authorityname' && i.visible) ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  - application_date: ${inputs.some(i => i.name === 'application_date' && i.visible) ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  - deadline_date: ${inputs.some(i => i.name === 'deadline_date' && i.visible) ? 'FOUND' : 'NOT FOUND'}`);

  await page.waitForTimeout(5000);
  await browser.close();
}

main();
