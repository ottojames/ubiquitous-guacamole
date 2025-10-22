const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('Setting up authenticated session...');

  // First get the session from Supabase
  const client = createClient(
    'https://puemqhpqxgrvrukyrfkm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZW1xaHBxeGdydnJ1a3lyZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTE5NTIsImV4cCI6MjA3MDQ4Nzk1Mn0.nL0AW6pWGGfpS64mKd4wuqVfudOtiW4M7_wydIjzMsc',
    { auth: { persistSession: false } }
  );

  const { data, error } = await client.auth.signInWithPassword({
    email: 'dev@testcouncil.gov.uk',
    password: 'DevPassword123!'
  });

  if (error) {
    console.error('Auth error:', error);
    return;
  }

  const sessionData = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    token_type: data.session.token_type,
    user: data.user
  };

  console.log('Session obtained for:', data.user.email);

  // Now launch browser and inject session
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to homepage first to set domain
    console.log('1. Setting up browser session...');
    await page.goto('http://localhost:5173/');

    // Inject the session into localStorage
    await page.evaluate((sessionJson) => {
      localStorage.setItem('sb-puemqhpqxgrvrukyrfkm-auth-token', sessionJson);
      localStorage.setItem('civic-notices-auth', sessionJson);
    }, JSON.stringify(sessionData));

    console.log('2. Session injected into localStorage');

    // Now navigate to the dashboard
    console.log('3. Navigating to dashboard...');
    await page.goto('http://localhost:5173/c/test-council/licensing/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('4. Current URL:', page.url());

    if (page.url().includes('/dashboard')) {
      console.log('\n✅ SUCCESS! You are logged into the dashboard!');
      console.log('Keep this browser window open to explore the portal.');
      console.log('\nAvailable pages:');
      console.log('  - Dashboard: http://localhost:5173/c/test-council/licensing/dashboard');
      console.log('  - Notices: http://localhost:5173/c/test-council/licensing/notices');
      console.log('  - Team: http://localhost:5173/c/test-council/licensing/team');
      console.log('  - Templates: http://localhost:5173/c/test-council/licensing/templates');
      console.log('  - Settings: http://localhost:5173/c/test-council/licensing/settings');
      console.log('  - Audit Log: http://localhost:5173/c/test-council/licensing/audit');

      // Keep browser open
      await new Promise(() => {});
    } else {
      console.log('⚠️ Not on dashboard:', page.url());
      await page.screenshot({ path: '/tmp/current-page.png', fullPage: true });
      console.log('Screenshot saved to /tmp/current-page.png');
      await browser.close();
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    await browser.close();
  }
})();
