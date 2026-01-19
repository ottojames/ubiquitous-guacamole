#!/usr/bin/env node

const fetch = require('node-fetch');

async function testCouncilRegistration() {
  const testData = {
    name: 'Test Borough Council', // Changed from councilName
    type: 'district',
    region: 'london',
    departments: [
      {
        name: 'Licensing Department',
        slug: 'licensing',
        type: 'licensing',
        email: 'licensing@testborough.gov.uk'
      },
      {
        name: 'Planning Department',
        slug: 'planning',
        type: 'planning',
        email: 'planning@testborough.gov.uk'
      }
    ],
    authorityAddress: '123 Test Street, Test Town, T1 2ST',
    authorityEmail: 'council@testborough.gov.uk',
    authorityPhone: '01234 567890',
    onlineRegisterUrl: 'https://testborough.gov.uk/register',
    adminEmail: `test${Date.now()}@testborough.gov.uk`,
    adminPassword: 'TestPass123!',
    adminName: 'Test Admin', // Changed from adminFullName
    adminRole: 'admin' // Added required field
  };

  try {
    console.log('🧪 Testing council registration with departments...');
    console.log('📧 Departments being sent:', testData.departments);

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
      console.log('Organization ID:', result.organization?.id);
      console.log('Redirect path:', result.redirectPath);
      console.log('\n🎉 Database schema fix verified - departments with email field now work!');
      return true;
    } else {
      console.error('❌ Registration failed:', result);
      if (result.error && result.error.includes('contact_email')) {
        console.error('⚠️  Still has schema issue with contact_email field');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing registration:', error.message);
    return false;
  }
}

// Run the test
testCouncilRegistration().then(success => {
  process.exit(success ? 0 : 1);
});