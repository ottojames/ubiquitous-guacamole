import { test, expect } from '@playwright/test';

test.describe('Login page URL-based navigation', () => {
  test('should show portal selection at /login', async ({ page }) => {
    await page.goto('/login');

    // Should see portal selection cards
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Council Portal' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Professional Portal' })).toBeVisible();
  });

  test('should navigate to council login at /login/council', async ({ page }) => {
    await page.goto('/login/council');

    // Should see council login form
    await expect(page.getByRole('heading', { name: 'Council Portal' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('should navigate to professional login at /login/professional', async ({ page }) => {
    await page.goto('/login/professional');

    // Should see professional login form
    await expect(page.getByRole('heading', { name: 'Professional Portal' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('clicking Council Portal button navigates to /login/council', async ({ page }) => {
    await page.goto('/login');

    // Click the Council Portal button
    await page.getByRole('button', { name: /Council Portal/i }).click();

    // Should navigate to /login/council
    await expect(page).toHaveURL('/login/council');
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('clicking Professional Portal button navigates to /login/professional', async ({ page }) => {
    await page.goto('/login');

    // Click the Professional Portal button
    await page.getByRole('button', { name: /Professional Portal/i }).click();

    // Should navigate to /login/professional
    await expect(page).toHaveURL('/login/professional');
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('browser back button returns to portal selection from council login', async ({ page }) => {
    await page.goto('/login');

    // Click council portal
    await page.getByRole('button', { name: /Council Portal/i }).click();
    await expect(page).toHaveURL('/login/council');

    // Press browser back
    await page.goBack();

    // Should be back at portal selection
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('browser back button returns to portal selection from professional login', async ({ page }) => {
    await page.goto('/login');

    // Click professional portal
    await page.getByRole('button', { name: /Professional Portal/i }).click();
    await expect(page).toHaveURL('/login/professional');

    // Press browser back
    await page.goBack();

    // Should be back at portal selection
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('Back to portal selection button works', async ({ page }) => {
    await page.goto('/login/council');

    // Click the back button
    await page.getByRole('button', { name: /Back to portal selection/i }).click();

    // Should navigate back to /login
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('form state resets when navigating between portal types', async ({ page }) => {
    await page.goto('/login/council');

    // Enter some text in the form
    await page.getByLabel('Email address').fill('test@example.com');
    await page.locator('input#password').fill('TestPassword123!');

    // Navigate to professional portal
    await page.goto('/login/professional');

    // Form should be empty
    await expect(page.getByLabel('Email address')).toHaveValue('');
    await expect(page.locator('input#password')).toHaveValue('');
  });
});
