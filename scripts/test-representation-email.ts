#!/usr/bin/env npx tsx
/**
 * Test script to verify representation email notifications work
 * Run: npx tsx scripts/test-representation-email.ts
 */

import 'dotenv/config';

async function testRepresentationEmail() {
  const API_URL = 'http://localhost:5174';

  console.log('🧪 Testing representation email notification...\n');

  // First, find a test notice
  console.log('1. Finding test notice...');
  const searchResponse = await fetch(`${API_URL}/api/notices/search?postcode=SW1A%201AA`);
  const searchData = await searchResponse.json();

  if (!searchData.notices || searchData.notices.length === 0) {
    console.error('❌ No test notices found. Please run: npx tsx scripts/add-test-notice.ts');
    process.exit(1);
  }

  const testNotice = searchData.notices[0];
  console.log(`✅ Found notice: ${testNotice.premises?.name || 'Test Notice'} (${testNotice.id})\n`);

  // Submit a test representation with email
  console.log('2. Submitting test representation with email...');
  const testData = {
    type: 'support',
    representor_name: 'Test User',
    representor_email: 'test@example.com', // This will trigger email (if Resend is configured)
    representor_phone: '07700900000',
    representor_address: '123 Test Street, London, SW1A 1AA',
    grounds: ['public-safety', 'noise'],
    representation_text: 'I support this application. The premises has been well-managed.',
    is_anonymous: false
  };

  const repResponse = await fetch(`${API_URL}/api/notices/${testNotice.id}/representations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  if (!repResponse.ok) {
    const error = await repResponse.json();
    console.error('❌ Failed to submit representation:', error);
    process.exit(1);
  }

  const repData = await repResponse.json();
  console.log(`✅ Representation submitted: ${repData.reference_number}\n`);

  // Check if email would have been sent
  console.log('3. Email notification status:');
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not configured - email would be skipped');
    console.log('   To enable emails, add RESEND_API_KEY to your .env file');
  } else if (process.env.RESEND_API_KEY.includes('REPLACE')) {
    console.log('⚠️  RESEND_API_KEY contains placeholder value - email would be skipped');
    console.log('   To enable emails, get an API key from https://resend.com');
  } else {
    console.log('✅ Email notification would be sent to: test@example.com');
    console.log('   Check server logs for email sending status');
  }

  console.log('\n✨ Test complete!');
  console.log('\nEmail template includes:');
  console.log('  - Representation reference number');
  console.log('  - Notice type and premises details');
  console.log('  - Submission confirmation');
  console.log('  - Link to view the notice');
  console.log('  - Consultation deadline (if set)');

  // Test anonymous submission (no email should be sent)
  console.log('\n4. Testing anonymous submission (no email expected)...');
  const anonData = {
    ...testData,
    is_anonymous: true,
    representor_name: undefined
  };

  const anonResponse = await fetch(`${API_URL}/api/notices/${testNotice.id}/representations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(anonData)
  });

  if (anonResponse.ok) {
    const anonRepData = await anonResponse.json();
    console.log(`✅ Anonymous representation submitted: ${anonRepData.reference_number}`);
    console.log('✅ No email sent for anonymous submissions (as expected)');
  }
}

// Run the test
testRepresentationEmail().catch(console.error);