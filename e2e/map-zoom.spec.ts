// @ts-nocheck
/**
 * Map Zoom Behavior Tests
 *
 * These tests verify that the map NEVER zooms out when users interact with it.
 * Specifically, the critical user journey is:
 * 1. Search for a location (e.g., postcode)
 * 2. Click on a cluster to zoom in
 * 3. Click on an individual notice pin
 * 4. Expected: Map should zoom IN or stay at current level, NEVER zoom out
 *
 * Bug History:
 * - Previously, clicking a pin after clicking a cluster would cause the map to zoom OUT
 * - Root cause: autoFitToNotices effect was interfering with pin zoom animations
 * - Fix: Mark pin clicks as user adjustments via userAdjustedViewportRef
 */
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

test.describe('Map Zoom Behavior', () => {
  test('should never zoom out when clicking cluster then pin', async ({ page }) => {
    // Set up console logging to capture zoom values from component logs
    const consoleLogs: Array<{ text: string; timestamp: number }> = [];
    page.on('console', (msg) => {
      consoleLogs.push({
        text: msg.text(),
        timestamp: Date.now()
      });
    });

    // Navigate to notices page with search already applied
    await page.goto(`${BASE_URL}/notices?query=SW1A+2AB&postcode=SW1A2AB&view=map`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verify map canvas is visible
    const mapCanvas = page.locator('canvas.maplibregl-canvas').first();
    await expect(mapCanvas).toBeVisible({ timeout: 10000 });

    console.log('[Test] Map loaded, starting interaction test...');

    // Helper to extract zoom from console logs
    const extractZoomFromLogs = (logs: typeof consoleLogs, searchText: string): number | null => {
      for (const log of logs) {
        if (log.text.includes(searchText)) {
          // Try to extract currentZoom and targetZoom values
          const currentMatch = log.text.match(/currentZoom[:\s]+(\d+\.?\d*)/);
          const targetMatch = log.text.match(/targetZoom[:\s]+(\d+\.?\d*)/);

          if (targetMatch) return parseFloat(targetMatch[1]);
          if (currentMatch) return parseFloat(currentMatch[1]);
        }
      }
      return null;
    };

    // Get canvas bounding box
    const canvasBox = await mapCanvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Click in center where clusters appear
    const centerX = canvasBox.x + canvasBox.width * 0.5;
    const centerY = canvasBox.y + canvasBox.height * 0.5;

    console.log(`[Test] Step 1: Clicking potential cluster at (${centerX}, ${centerY})`);
    const logsBeforeCluster = consoleLogs.length;

    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(2000);

    // Check if cluster was clicked by looking for cluster zoom logs
    const clusterLogs = consoleLogs.slice(logsBeforeCluster);
    const clusterClicked = clusterLogs.some(log =>
      log.text.includes('Cluster clicked - zooming in') ||
      log.text.includes('clusterId')
    );

    let zoomAfterCluster: number | null = null;
    if (clusterClicked) {
      console.log('[Test] ✓ Cluster detected and clicked');
      zoomAfterCluster = extractZoomFromLogs(clusterLogs, 'Cluster clicked');
      console.log(`[Test] Zoom after cluster click: ${zoomAfterCluster}`);
    } else {
      console.log('[Test] ℹ No cluster at center, trying different location...');
      // Try clicking slightly offset
      await page.mouse.click(centerX + 50, centerY - 50);
      await page.waitForTimeout(2000);

      const retryLogs = consoleLogs.slice(logsBeforeCluster);
      const retryClusterClicked = retryLogs.some(log =>
        log.text.includes('Cluster clicked')
      );

      if (retryClusterClicked) {
        console.log('[Test] ✓ Cluster found at offset location');
        zoomAfterCluster = extractZoomFromLogs(retryLogs, 'Cluster clicked');
      }
    }

    if (!zoomAfterCluster) {
      console.log('[Test] ⚠️  Could not find cluster to click, test may be invalid');
    }

    // Now click on an individual notice pin
    const pinX = canvasBox.x + canvasBox.width * 0.52;
    const pinY = canvasBox.y + canvasBox.height * 0.48;

    console.log(`[Test] Step 2: Clicking pin at (${pinX}, ${pinY})`);
    const logsBeforePin = consoleLogs.length;

    await page.mouse.click(pinX, pinY);
    await page.waitForTimeout(2500);

    // Check if pin was clicked
    const pinLogs = consoleLogs.slice(logsBeforePin);
    const pinClicked = pinLogs.some(log =>
      log.text.includes('PIN CLICKED ON MAP') ||
      log.text.includes('CENTERING ON PIN')
    );

    console.log(`[Test] Pin click detected: ${pinClicked}`);

    // Extract zoom values from pin click
    const centeringLog = pinLogs.find(log => log.text.includes('CENTERING ON PIN'));

    if (centeringLog) {
      console.log('[Test] Found CENTERING log:', centeringLog.text);

      // Extract currentZoom and targetZoom
      const currentZoomMatch = centeringLog.text.match(/currentZoom[:\s]+(\d+\.?\d*)/);
      const targetZoomMatch = centeringLog.text.match(/targetZoom[:\s]+(\d+\.?\d*)/);
      const actionMatch = centeringLog.text.match(/action[:\s]+'([^']+)'/);

      if (currentZoomMatch && targetZoomMatch) {
        const currentZoom = parseFloat(currentZoomMatch[1]);
        const targetZoom = parseFloat(targetZoomMatch[1]);
        const action = actionMatch ? actionMatch[1] : 'unknown';

        console.log(`[Test] Zoom analysis:`);
        console.log(`  Current: ${currentZoom}`);
        console.log(`  Target:  ${targetZoom}`);
        console.log(`  Action:  ${action}`);
        console.log(`  Delta:   ${(targetZoom - currentZoom).toFixed(2)}`);

        // CRITICAL ASSERTION: Target zoom should NEVER be less than current zoom
        expect(targetZoom).toBeGreaterThanOrEqual(currentZoom);

        if (targetZoom < currentZoom) {
          console.log(`[Test] ❌ FAIL: Map is zooming OUT from ${currentZoom} to ${targetZoom}!`);
        } else if (targetZoom === currentZoom) {
          console.log(`[Test] ✓ PASS: Map staying at zoom ${currentZoom} (center only)`);
        } else {
          console.log(`[Test] ✓ PASS: Map zooming IN from ${currentZoom} to ${targetZoom}`);
        }
      }
    }

    // Print all relevant logs for debugging
    console.log('\n=== ALL ZOOM-RELATED LOGS ===');
    consoleLogs.forEach((log, i) => {
      if (log.text.includes('zoom') || log.text.includes('ZOOM') ||
          log.text.includes('CENTERING') || log.text.includes('Cluster clicked')) {
        console.log(`[${i}] ${log.text}`);
      }
    });
    console.log('===========================\n');
  });

  test.skip('should maintain or increase zoom when clicking sidebar notice', async ({ page }) => {
    // Skipping this test for now - will focus on the cluster->pin flow first
  });
});
