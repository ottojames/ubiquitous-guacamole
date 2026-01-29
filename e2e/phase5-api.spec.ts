// @ts-nocheck
import { test, expect } from '@playwright/test';

/**
 * Phase 5: Direct Publishing Flow - API Tests
 * Tests the new backend endpoints created for direct publishing
 */

const BASE_URL = 'http://localhost:5174';

// Test API health
test('Phase 5: API health check passes', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/health`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.ok).toBe(true);
});

// Test auth required endpoints return 401
test('Phase 5: POST /api/notices/publish requires authentication', async ({ request }) => {
  const response = await request.post(`${BASE_URL}/api/notices/publish`, {
    data: {
      target_council_id: 'test-council-id',
      target_department_id: 'test-dept-id',
      notice_data: {},
      notice_type: 'premises-licence',
      title: 'Test Notice'
    }
  });

  // Should return 401 Unauthorized without auth header
  expect(response.status()).toBe(401);
});

test('Phase 5: GET /api/billing/account requires authentication', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/billing/account`);
  expect(response.status()).toBe(401);
});

test('Phase 5: POST /api/billing/pay requires authentication', async ({ request }) => {
  const response = await request.post(`${BASE_URL}/api/billing/pay`, {
    data: {
      amount: 100,
      payment_method: 'test'
    }
  });
  expect(response.status()).toBe(401);
});

test('Phase 5: GET /api/representations/:noticeId requires authentication', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/representations/test-notice-id`);
  expect(response.status()).toBe(401);
});

// Test error handling
test('Phase 5: API endpoints handle malformed requests gracefully', async ({ request }) => {
  const publishResponse = await request.post(`${BASE_URL}/api/notices/publish`, {
    headers: {
      'Authorization': 'Bearer invalid-token'
    },
    data: {}
  });

  // Should fail validation (400) or auth (401) but not crash (500)
  expect([400, 401]).toContain(publishResponse.status());
});
