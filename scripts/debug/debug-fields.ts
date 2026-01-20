import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to step 1
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');

  // Select premises licence new
  await page.getByTestId('notice-option-licensing-premises-new').click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');

  // Choose upload method
  await page.locator('button:has-text("Upload notice")').click();
  await page.waitForTimeout(1000);

  // Get all input, select, and textarea elements with name attributes
  const fields = await page.$$eval('input[name], select[name], textarea[name]', elements =>
    elements.map(el => ({
      tag: el.tagName.toLowerCase(),
      name: el.getAttribute('name'),
      type: el.getAttribute('type'),
      visible: el.offsetParent !== null
    }))
  );

  console.log('\n📋 UPLOAD PATH - Fields found:');
  fields.forEach(f => {
    const visIcon = f.visible ? '✓' : '✗';
    console.log(`  ${visIcon} <${f.tag} name="${f.name}" type="${f.type}">`);
  });

  // Now test template path
  await page.goto('http://localhost:5173/publish/step-1');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('notice-option-licensing-premises-new').click();
  await page.locator('button:has-text("Continue")').click();
  await page.waitForLoadState('networkidle');

  // Choose template method
  const useTemplateBtn = page.locator('button:has-text("Use template")');
  await useTemplateBtn.click();
  await page.waitForTimeout(1000);

  const templateFields = await page.$$eval('input[name], select[name], textarea[name]', elements =>
    elements.map(el => ({
      tag: el.tagName.toLowerCase(),
      name: el.getAttribute('name'),
      type: el.getAttribute('type'),
      visible: el.offsetParent !== null
    }))
  );

  console.log('\n📋 TEMPLATE PATH - Fields found:');
  templateFields.forEach(f => {
    const visIcon = f.visible ? '✓' : '✗';
    console.log(`  ${visIcon} <${f.tag} name="${f.name}" type="${f.type}">`);
  });

  await browser.close();
}

main();
