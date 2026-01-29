import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Upload File Test', () => {
  test.beforeAll(() => {
    // Create test file
    const testFilePath = path.join(__dirname, '../test-fixtures/sample.pdf');
    const dir = path.dirname(testFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('should successfully upload a PDF file', async ({ page }) => {
    // Navigate to publish page
    await page.goto('http://localhost:5173/publish');
    await page.waitForLoadState('networkidle');

    // Step 1: Select notice type
    const noticeTypeButton = page.locator('button').filter({ hasText: /premises.*licence/i }).first();
    if (await noticeTypeButton.isVisible()) {
      await noticeTypeButton.click();
      await page.waitForTimeout(500);

      // Click continue to go to step 2
      const continueBtn = page.locator('button').filter({ hasText: /continue/i });
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Find the file input
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for network responses
    let uploadResponse: any = null;
    page.on('response', response => {
      if (response.url().includes('/api/upload')) {
        uploadResponse = {
          status: response.status(),
          url: response.url()
        };
      }
    });

    // Upload the file
    const testFilePath = path.join(__dirname, '../test-fixtures/sample.pdf');
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check for errors
    console.log('Upload response:', uploadResponse);
    console.log('Console errors:', consoleErrors);

    // Verify upload response
    if (uploadResponse) {
      expect(uploadResponse.status).toBe(200);
      console.log('✓ Upload successful with status 200');
    } else {
      throw new Error('No upload response received');
    }

    // Check for 500 errors in console
    const has500Error = consoleErrors.some(err => err.includes('500') || err.includes('Internal Server Error'));
    if (has500Error) {
      console.error('❌ Found 500 error in console:', consoleErrors);
      throw new Error('500 Internal Server Error detected');
    } else {
      console.log('✓ No 500 errors found');
    }
  });
});
