#!/usr/bin/env npx tsx

import puppeteer from 'puppeteer';
import { supabase } from '../src/lib/supabase';

async function testWizardSubmission() {
  console.log('🧪 Testing Wizard Step 4 Submission');
  console.log('=====================================');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/notices/submit') || response.url().includes('/api/notices')) {
        console.log(`📡 API Response: ${response.url()} - Status: ${response.status()}`);
      }
    });

    // Step 1: Navigate to wizard
    console.log('📍 Step 1: Navigate to /publish/step-1');
    await page.goto('http://localhost:5173/publish/step-1', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);

    // Select "New Premises Licence"
    console.log('📝 Selecting "New Premises Licence"');
    await page.waitForSelector('button:has-text("Premises Licence - New Application")', { timeout: 5000 });
    await page.click('button:has-text("Premises Licence - New Application")');
    await page.waitForTimeout(1000);

    // Click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);

    // Step 2: Verify defaults to template
    console.log('📍 Step 2: Upload Method');
    await page.waitForSelector('input[value="template"]', { timeout: 5000 });
    const isTemplateSelected = await page.$eval('input[value="template"]', el => (el as HTMLInputElement).checked);
    console.log(`✅ Template method is default: ${isTemplateSelected}`);

    // Fill contact email
    await page.type('input[type="email"]', 'test@example.com');

    // Click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);

    // Step 3: Fill in form details
    console.log('📍 Step 3: Fill Notice Details');

    // Fill applicant name
    await page.waitForSelector('input[placeholder*="applicant"]', { timeout: 5000 });
    await page.type('input[placeholder*="applicant"]', 'Test Applicant Ltd');

    // Fill premises name
    await page.type('input[placeholder*="premises name"]', 'The Test Tavern');

    // Fill address
    await page.type('input[placeholder*="address line 1"]', '123 Test Street');
    await page.type('input[placeholder*="town"]', 'Testington');
    await page.type('input[placeholder*="postcode"]', 'TE5 7ST');

    // Select council - Sampletonborough
    const councilSelect = await page.$('select[name*="council"], select[id*="council"]');
    if (councilSelect) {
      await councilSelect.select('Sampletonborough Council');
      console.log('✅ Selected Sampletonborough Council');
    } else {
      console.log('⚠️ Council dropdown not found');
    }

    // Select activities
    const alcoholCheckbox = await page.$('input[type="checkbox"][value*="alcohol"]');
    if (alcoholCheckbox) {
      await alcoholCheckbox.click();
      console.log('✅ Selected Sale of Alcohol');
    }

    // Click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);

    // Step 4: Review and Submit
    console.log('📍 Step 4: Review & Submit');
    await page.waitForSelector('h2:has-text("Review")', { timeout: 5000 });

    // Look for submit button
    const submitButton = await page.$('button:has-text("Submit"), button:has-text("Confirm and Pay"), button:has-text("Publish")');
    if (submitButton) {
      console.log('✅ Found submit button');

      // Click submit
      console.log('🚀 Clicking submit button...');
      await submitButton.click();

      // Wait for response
      await page.waitForTimeout(5000);

      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL after submit: ${currentUrl}`);

      // Check if redirected to confirmation
      if (currentUrl.includes('confirmation')) {
        console.log('✅ Successfully redirected to confirmation page');
      } else if (currentUrl.includes('step-4')) {
        console.log('❌ Still on step 4 - submission may have failed');

        // Check for error messages
        const errorText = await page.$eval('body', el => el.textContent);
        if (errorText?.includes('error') || errorText?.includes('fail')) {
          console.log('❌ Error message found on page');
        }
      }

      // Check database for new notice
      console.log('🔍 Checking database for new notice...');
      const { data: notices, error } = await supabase
        .from('notices')
        .select('id, notice_type, status, premises')
        .order('created_at', { ascending: false })
        .limit(1);

      if (notices && notices.length > 0) {
        console.log('✅ Latest notice in database:', {
          id: notices[0].id,
          type: notices[0].notice_type,
          status: notices[0].status,
          premises: notices[0].premises
        });
      } else {
        console.log('❌ No notices found in database');
      }

    } else {
      console.log('❌ Submit button not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n📊 Test Complete');
    console.log('Press Ctrl+C to exit');
    // Keep browser open for inspection
    await new Promise(() => {}); // Keep process alive
  }
}

testWizardSubmission().catch(console.error);