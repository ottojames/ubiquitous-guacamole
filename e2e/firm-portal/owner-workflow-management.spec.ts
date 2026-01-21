/**
 * Owner Workflow Management E2E Tests
 *
 * Tests for firm owners managing departments and workflows.
 * Uses firm-owner auth state from global-setup.
 */

import { test, expect } from '@playwright/test';
import {
  FIRM_TEST_USERS,
  loginAsFirmUser,
  BASE_URL,
} from '../fixtures/firm-auth';

const OWNER = FIRM_TEST_USERS.OWNER;

test.describe('Owner: Department Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as firm owner before each test
    await loginAsFirmUser(page, OWNER);
  });

  test('can create a new department', async ({ page }) => {
    // Navigate to firm settings or departments page
    // (Departments are managed via API, accessed from Settings or Team page)
    await page.goto(`${BASE_URL}/f/${OWNER.firmSlug}/settings`);

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Look for departments section or create department button
    const departmentsSection = page.locator(
      'text=/departments|practice areas/i'
    );
    const createDeptButton = page.locator(
      'button:has-text("Add Department"), button:has-text("Create Department"), button:has-text("New Department")'
    );

    // Check if departments UI exists
    const hasDepartmentsUI =
      (await departmentsSection.isVisible({ timeout: 5000 }).catch(() => false)) ||
      (await createDeptButton.isVisible({ timeout: 5000 }).catch(() => false));

    if (!hasDepartmentsUI) {
      // Try navigating to team page where departments might be managed
      await page.goto(`${BASE_URL}/f/${OWNER.firmSlug}/team`);
      await page.waitForLoadState('networkidle');
    }

    // Test via API since UI may not be implemented yet
    const deptName = `Test Dept ${Date.now()}`;
    const response = await page.request.post(
      `${BASE_URL}/api/firm/departments`,
      {
        data: {
          name: deptName,
          description: 'Created via E2E test',
          color: '#3B82F6',
        },
      }
    );

    // Verify department was created
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.department).toBeDefined();
    expect(data.department.name).toBe(deptName);
    expect(data.department.slug).toBeTruthy();

    console.log(`Department created: ${data.department.name} (${data.department.id})`);
  });

  test('can list firm departments', async ({ page }) => {
    // Test via API
    const response = await page.request.get(
      `${BASE_URL}/api/firm/departments`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.departments).toBeDefined();
    expect(Array.isArray(data.departments)).toBeTruthy();

    console.log(`Found ${data.departments.length} departments`);
  });

  test('can update a department', async ({ page }) => {
    // First create a department
    const createResponse = await page.request.post(
      `${BASE_URL}/api/firm/departments`,
      {
        data: {
          name: `Update Test ${Date.now()}`,
          description: 'Will be updated',
        },
      }
    );

    expect(createResponse.ok()).toBeTruthy();
    const { department } = await createResponse.json();

    // Update the department
    const updateResponse = await page.request.patch(
      `${BASE_URL}/api/firm/departments/${department.id}`,
      {
        data: {
          description: 'Updated description',
          color: '#10B981',
        },
      }
    );

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.department.description).toBe('Updated description');
    expect(updated.department.color).toBe('#10B981');

    console.log(`Department updated: ${updated.department.id}`);
  });

  test('can archive (soft delete) a department', async ({ page }) => {
    // First create a department
    const createResponse = await page.request.post(
      `${BASE_URL}/api/firm/departments`,
      {
        data: {
          name: `Delete Test ${Date.now()}`,
        },
      }
    );

    expect(createResponse.ok()).toBeTruthy();
    const { department } = await createResponse.json();

    // Delete (archive) the department
    const deleteResponse = await page.request.delete(
      `${BASE_URL}/api/firm/departments/${department.id}`
    );

    expect(deleteResponse.status()).toBe(204);

    // Verify it no longer appears in active departments list
    const listResponse = await page.request.get(
      `${BASE_URL}/api/firm/departments`
    );
    const { departments } = await listResponse.json();
    const found = departments.find((d: { id: string }) => d.id === department.id);
    expect(found).toBeUndefined();

    console.log(`Department archived: ${department.id}`);
  });
});
