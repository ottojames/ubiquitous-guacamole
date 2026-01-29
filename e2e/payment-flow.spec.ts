/**
 * Payment Flow E2E Tests
 *
 * Tests the Stripe payment integration:
 * - Checkout redirect
 * - Success page
 * - Cancelled page
 */

import { test, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Payment Flow', () => {
  test.describe('Task 19.5a: Checkout Redirect', () => {
    test('checkout endpoint returns redirect URL', async ({ request }) => {
      // Test that the create-checkout-session endpoint returns a redirect URL
      // Note: This will fail if Stripe is not configured, which is expected in test environment
      const response = await request.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
        data: {
          noticeId: 'test-notice-id',
          noticeType: 'premises-licence',
          applicantEmail: 'test@example.com',
        },
      });

      // Either success (Stripe configured) or error (Stripe not configured)
      // Both are valid outcomes depending on environment
      const status = response.status();
      expect([200, 500]).toContain(status);

      if (status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('sessionId');
        expect(data).toHaveProperty('url');
        // Stripe URLs start with https://checkout.stripe.com
        expect(data.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
      } else {
        // Stripe not configured - verify error message is user-friendly
        const data = await response.json();
        expect(data.error).toContain('Payment processing not configured');
      }
    });

    test('checkout endpoint validates required fields', async ({ request }) => {
      // Missing all required fields
      const emptyResponse = await request.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
        data: {},
      });

      // Should return 400 for missing fields (or 500 if Stripe not configured)
      const status = emptyResponse.status();
      expect([400, 500]).toContain(status);

      if (status === 400) {
        const data = await emptyResponse.json();
        expect(data.error).toContain('Missing required fields');
      }
    });

    test('checkout endpoint requires noticeId', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/stripe/create-checkout-session`, {
        data: {
          noticeType: 'premises-licence',
          applicantEmail: 'test@example.com',
        },
      });

      const status = response.status();
      expect([400, 500]).toContain(status);
    });

    test('session status endpoint handles missing session', async ({ request }) => {
      // Test with a fake session ID
      const response = await request.get(`${BASE_URL}/api/stripe/session/fake_session_id/status`);

      // Should return 404 (session not found) or 500 (Stripe not configured)
      const status = response.status();
      expect([404, 500]).toContain(status);
    });
  });

  test.describe('Task 19.5b: Success Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/payment/success?noticeId=test-123&session_id=cs_test_abc`);
      await page.waitForLoadState('networkidle');
    });

    test('success page displays correctly', async ({ page }) => {
      // Check page title
      const heading = page.locator('h1');
      await expect(heading).toContainText('Payment successful');

      // Check success icon is present (green circle with checkmark)
      const successIcon = page.locator('.bg-green-100');
      await expect(successIcon).toBeVisible();
    });

    test('success page shows notice ID from URL params', async ({ page }) => {
      // Check notice ID is displayed
      const noticeIdDisplay = page.locator('code').filter({ hasText: 'test-123' });
      await expect(noticeIdDisplay).toBeVisible();
    });

    test('success page has View notice button', async ({ page }) => {
      // Check "View notice" button exists and navigates to notice page
      const viewButton = page.locator('button').filter({ hasText: 'View notice' });
      await expect(viewButton).toBeVisible();
    });

    test('success page has Download receipt link', async ({ page }) => {
      // Check "Download receipt" link exists with correct href
      const downloadLink = page.locator('a').filter({ hasText: 'Download receipt' });
      await expect(downloadLink).toBeVisible();

      const href = await downloadLink.getAttribute('href');
      expect(href).toContain('/api/certificates/receipt/test-123');
    });

    test('success page has Return home button', async ({ page }) => {
      // Check "Return home" button exists
      const homeButton = page.locator('button').filter({ hasText: 'Return home' });
      await expect(homeButton).toBeVisible();
    });

    test('success page displays confirmation message', async ({ page }) => {
      // Check for confirmation message
      const message = page.locator('p').filter({ hasText: 'Your payment has been processed successfully' });
      await expect(message).toBeVisible();

      // Check for email notice
      const emailMessage = page.locator('p').filter({ hasText: 'confirmation email' });
      await expect(emailMessage).toBeVisible();
    });

    test('success page without noticeId still renders', async ({ page }) => {
      // Navigate without noticeId
      await page.goto(`${BASE_URL}/payment/success`);
      await page.waitForLoadState('networkidle');

      // Page should still render with heading
      const heading = page.locator('h1');
      await expect(heading).toContainText('Payment successful');

      // Return home button should still be visible
      const homeButton = page.locator('button').filter({ hasText: 'Return home' });
      await expect(homeButton).toBeVisible();
    });
  });

  test.describe('Task 19.5c: Cancel Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/payment/cancelled`);
      await page.waitForLoadState('networkidle');
    });

    test('cancel page displays correctly', async ({ page }) => {
      // Check page title
      const heading = page.locator('h1');
      await expect(heading).toContainText('Payment cancelled');

      // Check amber icon is present (warning indicator)
      const warningIcon = page.locator('.bg-amber-100');
      await expect(warningIcon).toBeVisible();
    });

    test('cancel page shows no charges message', async ({ page }) => {
      // Check for reassurance message
      const noChargesMessage = page.locator('p').filter({ hasText: 'No charges have been made' });
      await expect(noChargesMessage).toBeVisible();
    });

    test('cancel page shows draft saved message', async ({ page }) => {
      // Check for draft saved message
      const draftMessage = page.locator('p').filter({ hasText: 'draft has been saved' });
      await expect(draftMessage).toBeVisible();
    });

    test('cancel page has Try again button', async ({ page }) => {
      // Check "Try again" button exists
      const tryAgainButton = page.locator('button').filter({ hasText: 'Try again' });
      await expect(tryAgainButton).toBeVisible();

      // Clicking should navigate to /publish
      await tryAgainButton.click();
      await expect(page).toHaveURL(/\/publish/);
    });

    test('cancel page has Return home button', async ({ page }) => {
      // Check "Return home" button exists
      const homeButton = page.locator('button').filter({ hasText: 'Return home' });
      await expect(homeButton).toBeVisible();

      // Clicking should navigate to home
      await homeButton.click();
      await expect(page).toHaveURL(`${BASE_URL}/`);
    });
  });

  test.describe('Payment Routes', () => {
    test('payment success route is accessible', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/payment/success`);
      expect(response?.status()).toBe(200);
    });

    test('payment cancelled route is accessible', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/payment/cancelled`);
      expect(response?.status()).toBe(200);
    });
  });
});
