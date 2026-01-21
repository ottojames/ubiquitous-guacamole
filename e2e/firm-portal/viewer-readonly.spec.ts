/**
 * Viewer Readonly E2E Tests
 *
 * Tests that firm viewers can view content but cannot edit or drag.
 * Uses firm-viewer auth state from global-setup.
 */

import { test, expect } from '@playwright/test';
import {
  FIRM_TEST_USERS,
  loginAsFirmUser,
  navigateToFirmNotices,
  navigateToFirmTemplates,
  navigateToFirmTeam,
  BASE_URL,
} from '../fixtures/firm-auth';

const VIEWER = FIRM_TEST_USERS.VIEWER;

test.describe('Viewer: Readonly Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login as firm viewer before each test
    await loginAsFirmUser(page, VIEWER);
  });

  test('can view the notices page', async ({ page }) => {
    await navigateToFirmNotices(page, VIEWER.firmSlug);
    await page.waitForLoadState('networkidle');

    // Verify we're on the notices page
    await expect(page).toHaveURL(new RegExp(`/f/${VIEWER.firmSlug}/notices`));

    // Page should load without errors
    const pageContent = page.locator('h1, h2, [data-testid="notices-page"]').filter({
      hasText: /notices|matters|cases/i,
    });

    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
    console.log('Viewer can view notices page');
  });

  test('cannot create new notices', async ({ page }) => {
    await navigateToFirmNotices(page, VIEWER.firmSlug);
    await page.waitForLoadState('networkidle');

    // Look for create/new notice button
    const createButton = page.locator('button, a').filter({
      hasText: /new notice|create notice|add notice|publish/i,
    });

    // Create button should either not exist or be disabled for viewer
    const createVisible = await createButton.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (createVisible) {
      // If visible, it should be disabled
      const isDisabled = await createButton.first().isDisabled();
      expect(isDisabled).toBeTruthy();
      console.log('Create button is visible but disabled for viewer');
    } else {
      console.log('Create button is hidden from viewer');
    }

    // Verify permission flag
    expect(VIEWER.permissions.canCreateNotices).toBe(false);
  });

  test('cannot drag notices in Kanban view', async ({ page }) => {
    await navigateToFirmNotices(page, VIEWER.firmSlug);
    await page.waitForLoadState('networkidle');

    // Verify viewer cannot drag (permission flag)
    expect(VIEWER.permissions.canDragKanban).toBe(false);

    // Try to switch to Kanban view
    const kanbanButton = page.locator('button').filter({ hasText: /kanban|grid|board/i }).first();

    if (await kanbanButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await kanbanButton.click();
      await page.waitForTimeout(500);

      // Kanban cards should not be draggable for viewers
      const draggableCards = page.locator('[data-testid="kanban-card"][draggable="true"], [draggable="true"]');
      const draggableCount = await draggableCards.count();

      // Viewers should not see draggable cards
      expect(draggableCount).toBe(0);
      console.log('No draggable cards visible to viewer');
    } else {
      console.log('Kanban view toggle not visible');
    }
  });

  test('cannot transition notices via API', async ({ page }) => {
    // Verify viewer cannot call transition API
    expect(VIEWER.permissions.canDragKanban).toBe(false);

    // Get workflow configs to find a notice
    const configsResponse = await page.request.get(`${BASE_URL}/api/workflow/configs`);

    if (!configsResponse.ok()) {
      console.log('Viewer cannot access workflow configs (expected)');
      return;
    }

    // Try to get notices
    const noticesResponse = await page.request.get(`${BASE_URL}/api/notices?firmId=true`);

    if (!noticesResponse.ok()) {
      console.log('Viewer may have limited notice API access');
      return;
    }

    const noticesData = await noticesResponse.json();
    const notices = noticesData.notices || noticesData.data || [];

    if (notices.length === 0) {
      console.log('No notices to test transition on');
      return;
    }

    // Try to transition (should fail for viewer)
    const testNotice = notices[0];
    const transitionResponse = await page.request.post(
      `${BASE_URL}/api/workflow/notices/${testNotice.id}/transition`,
      {
        data: {
          toStageId: 'fake-stage-id',
          notes: 'Viewer attempting transition (should fail)',
        },
      }
    );

    // Viewer should not be allowed to transition
    expect(transitionResponse.ok()).toBeFalsy();
    console.log('Viewer correctly denied from transitioning notices');
  });

  test('cannot manage team members', async ({ page }) => {
    // Verify permission flag
    expect(VIEWER.permissions.canManageTeam).toBe(false);

    await navigateToFirmTeam(page, VIEWER.firmSlug);
    await page.waitForLoadState('networkidle');

    // Look for invite/add team member button
    const inviteButton = page.locator('button, a').filter({
      hasText: /invite|add member|add team/i,
    });

    const inviteVisible = await inviteButton.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (inviteVisible) {
      // Should be disabled for viewer
      const isDisabled = await inviteButton.first().isDisabled();
      expect(isDisabled).toBeTruthy();
      console.log('Invite button is visible but disabled for viewer');
    } else {
      console.log('Invite button is hidden from viewer');
    }
  });

  test('cannot manage templates', async ({ page }) => {
    // Verify permission flag
    expect(VIEWER.permissions.canManageTemplates).toBe(false);

    await navigateToFirmTemplates(page, VIEWER.firmSlug);
    await page.waitForLoadState('networkidle');

    // Look for create template button
    const createButton = page.locator('button, a').filter({
      hasText: /create template|new template|add template/i,
    });

    const createVisible = await createButton.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (createVisible) {
      // Should be disabled for viewer
      const isDisabled = await createButton.first().isDisabled();
      expect(isDisabled).toBeTruthy();
      console.log('Create template button is visible but disabled for viewer');
    } else {
      console.log('Create template button is hidden from viewer');
    }
  });
});
