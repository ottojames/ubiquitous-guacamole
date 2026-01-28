import { test } from '@playwright/test';

test('Screenshot publish page with expanded categories', async ({ page }) => {
  await page.goto('http://localhost:5173/publish');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/publish-overview.png', fullPage: true });

  // Expand Licensing
  const licensing = page.getByText('Licensing Act 2003').first();
  await licensing.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/publish-licensing-expanded.png', fullPage: true });

  // Collapse and expand Gambling
  await licensing.click();
  await page.waitForTimeout(200);
  const gambling = page.getByText('Gambling Act 2005').first();
  await gambling.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/publish-gambling-expanded.png', fullPage: true });
});
