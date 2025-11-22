import { test, expect } from '@playwright/test';

test.describe('Council Dropdown Debug', () => {
  test('should load Bristol Council from database', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[CouncilDepartmentSelect]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    // Navigate to publish flow
    await page.goto('http://localhost:5173/publish/step-1');

    // Select premises licence
    await page.click('text=Premises Licence');
    await page.click('button:has-text("Next")');

    // Wait for step 2
    await page.waitForURL(/step-2/);

    // Click template option
    await page.click('text=Build from template');

    // Wait for form to load
    await page.waitForSelector('text=Licensing authority name');

    // Take screenshot before interacting
    await page.screenshot({ path: '/tmp/before-click.png', fullPage: true });

    // Click the council input
    const councilInput = page.locator('input[name="authorityname"]');
    await councilInput.click();
    await page.waitForTimeout(1000); // Wait for dropdown

    // Take screenshot after clicking
    await page.screenshot({ path: '/tmp/after-click.png', fullPage: true });

    // Type 'bristol'
    await councilInput.fill('bristol');
    await page.waitForTimeout(1000);

    // Take screenshot after typing
    await page.screenshot({ path: '/tmp/after-typing.png', fullPage: true });

    // Check what's in the dropdown
    const dropdownOptions = await page.locator('[role="option"], [role="listbox"] > *').allTextContents();
    console.log('Dropdown options:', dropdownOptions);

    // Check if Bristol Council appears
    const bristolOption = page.locator('text=Bristol Council');
    const bristolExists = await bristolOption.count() > 0;

    console.log('Bristol Council found:', bristolExists);

    if (!bristolExists) {
      // Debug: Check what component is actually rendered
      const html = await page.content();
      console.log('Page HTML includes CouncilDepartmentSelect:', html.includes('CouncilDepartmentSelect'));
      console.log('Page HTML includes CouncilSelect:', html.includes('CouncilSelect'));

      // Check network requests
      const requests = [];
      page.on('request', req => {
        if (req.url().includes('supabase') || req.url().includes('departments')) {
          requests.push({ url: req.url(), method: req.method() });
        }
      });

      console.log('Supabase requests:', requests);
    }

    // Assertion
    expect(bristolExists).toBe(true);
  });

  test('verify database has Bristol Council', async ({ page }) => {
    // Check Supabase directly via API
    await page.goto('http://localhost:5173');

    const result = await page.evaluate(async () => {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          type,
          email,
          organization:organizations!inner (
            id,
            name
          )
        `)
        .eq('type', 'licensing')
        .ilike('organization.name', '%bristol%');

      return { data, error };
    });

    console.log('Direct Supabase query result:', JSON.stringify(result, null, 2));

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
  });
});
