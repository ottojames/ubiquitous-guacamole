#!/usr/bin/env npx tsx
/**
 * API Endpoint Test Suite
 * Tests all critical API endpoints for the Civic Notices platform
 */

import 'dotenv/config';

const API_URL = process.env.API_URL || 'http://localhost:5174';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  method: string,
  endpoint: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    expectedStatus?: number;
    validate?: (data: any) => boolean;
  } = {}
): Promise<TestResult> {
  const start = Date.now();
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const responseTime = Date.now() - start;
    const expectedStatus = options.expectedStatus || 200;

    if (response.status !== expectedStatus) {
      return {
        endpoint,
        method,
        status: 'FAIL',
        responseTime,
        error: `Expected status ${expectedStatus}, got ${response.status}`,
        details: await response.text()
      };
    }

    if (options.validate) {
      const data = await response.json();
      if (!options.validate(data)) {
        return {
          endpoint,
          method,
          status: 'FAIL',
          responseTime,
          error: 'Response validation failed',
          details: data
        };
      }
    }

    return {
      endpoint,
      method,
      status: 'PASS',
      responseTime
    };
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 'FAIL',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 API Endpoint Test Suite');
  console.log('==========================\n');

  // 1. Health Check
  console.log('📋 System Health');
  results.push(await testEndpoint('GET', '/api/health', {
    validate: (data) => data.status === 'ok'
  }));

  // 2. Notice Endpoints
  console.log('\n📄 Notice Endpoints');

  // Search notices
  results.push(await testEndpoint('GET', '/api/notices/search?postcode=SW1A1AA', {
    validate: (data) => Array.isArray(data.notices)
  }));

  // Get notice by ID (using test notice if exists)
  results.push(await testEndpoint('GET', '/api/notices/550e8400-e29b-41d4-a716-446655440001', {
    expectedStatus: 200  // May be 404 if test notice doesn't exist
  }));

  // Notice types
  results.push(await testEndpoint('GET', '/api/notices/types', {
    validate: (data) => Array.isArray(data)
  }));

  // 3. Address Endpoints
  console.log('\n📍 Address Endpoints');

  results.push(await testEndpoint('GET', '/api/addresses?q=10%20Downing%20Street', {
    validate: (data) => Array.isArray(data)
  }));

  results.push(await testEndpoint('GET', '/api/postcodes/SW1A1AA', {
    validate: (data) => data.postcode || data.error
  }));

  // 4. Council Endpoints
  console.log('\n🏛️ Council Endpoints');

  results.push(await testEndpoint('GET', '/api/councils', {
    validate: (data) => Array.isArray(data.councils || data)
  }));

  results.push(await testEndpoint('GET', '/api/councils/dropdown', {
    validate: (data) => Array.isArray(data)
  }));

  // 5. Representation Endpoints
  console.log('\n💬 Representation Endpoints');

  // Submit representation (test with invalid notice ID to avoid creating test data)
  results.push(await testEndpoint('POST', '/api/notices/test-notice-id/representations', {
    expectedStatus: 404,
    body: {
      type: 'support',
      representor_name: 'Test User',
      representor_email: 'test@example.com',
      representation_text: 'Test representation'
    }
  }));

  // 6. Upload Endpoints
  console.log('\n📤 Upload Endpoints');

  results.push(await testEndpoint('GET', '/api/upload/status', {
    expectedStatus: 401  // Should require auth
  }));

  // 7. Analytics Endpoints
  console.log('\n📊 Analytics Endpoints');

  results.push(await testEndpoint('GET', '/api/analytics/overview', {
    validate: (data) => typeof data === 'object'
  }));

  // 8. Blue Notice Endpoints
  console.log('\n📘 Blue Notice Endpoints');

  results.push(await testEndpoint('GET', '/api/blue-notices/test-id', {
    expectedStatus: 404  // Expected when notice doesn't exist
  }));

  // 9. Registration Endpoints
  console.log('\n✍️ Registration Endpoints');

  // Test registration validation
  results.push(await testEndpoint('POST', '/api/registration/council', {
    expectedStatus: 400,  // Should fail with missing data
    body: {}
  }));

  results.push(await testEndpoint('POST', '/api/registration/firm', {
    expectedStatus: 400,  // Should fail with missing data
    body: {}
  }));

  // Print results
  console.log('\n========================================');
  console.log('TEST RESULTS');
  console.log('========================================\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  // Print detailed results
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const time = `${result.responseTime}ms`.padEnd(8);
    console.log(`${icon} ${result.method.padEnd(6)} ${result.endpoint.padEnd(50)} ${time} ${result.error || ''}`);
  });

  // Print summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Pass Rate: ${Math.round((passed / results.length) * 100)}%`);

  // Calculate average response time
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  console.log(`Average Response Time: ${avgResponseTime}ms`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.error('❌ API server is not running on', API_URL);
    console.log('Please start the server with: npm run dev:server');
    process.exit(1);
  }
}

// Main
async function main() {
  await checkServer();
  await runTests();
}

main().catch(console.error);