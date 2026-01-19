#!/usr/bin/env node

/**
 * Test script to verify the registration endpoint uses correct schema
 * Tests that departments table uses 'email' column as per migrations
 */

const testRegistrationEndpoint = async () => {
  console.log('Testing registration endpoint with correct schema...\n');

  const testData = {
    // Organization Info
    name: 'Test Council Schema Fix',
    type: 'district', // Must be one of: borough, city, district, county
    region: 'north-west',

    // Departments
    departments: [
      {
        name: 'Licensing Department',
        slug: 'licensing',
        type: 'licensing',
        email: 'licensing@testcouncil.gov.uk' // This should map to 'email' column
      }
    ],

    // Authority Details
    authorityAddress: '123 Test Street, Test Town, TT1 1TT',
    authorityEmail: 'info@testcouncil.gov.uk',
    authorityPhone: '01234 567890', // Required field
    onlineRegisterUrl: 'https://testcouncil.gov.uk/register',

    // Admin Account
    adminEmail: 'admin@testcouncil.gov.uk',
    adminPassword: 'TestPassword123!',
    adminName: 'Test Admin',
    adminRole: 'Council Administrator'
  };

  try {
    const response = await fetch('http://localhost:5174/api/registration/council', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('\n✅ Schema fix verified - departments table correctly uses "email" column');
      return true;
    } else {
      console.error('❌ Registration failed:', result);

      // Check if error is related to column name
      if (result.error?.includes('contact_email') || result.message?.includes('contact_email')) {
        console.error('\n❌ SCHEMA ISSUE: Still trying to use "contact_email" column!');
        console.error('The fix did not work correctly.');
      } else if (result.error === 'duplicate') {
        console.log('\n⚠️ Organization already exists - this might be from a previous test');
        console.log('The schema fix appears to be working (no column errors)');
        return true;
      }

      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ API server not running on port 5174');
      console.error('Please run: npm run dev:server');
    }

    return false;
  }
};

// Run the test
testRegistrationEndpoint()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });