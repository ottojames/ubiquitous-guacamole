// @ts-nocheck
import { expect, test } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const PUBLISH_CONFIRM_PATH = `${BASE_URL}/next/publish/confirm`;

async function dispatchContext(page, builder) {
  await page.evaluate(builder);
}

test.describe('Publish confirm step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLISH_CONFIRM_PATH);
    await expect(page.locator('[data-confirm-root]')).toBeVisible();
  });

  test('submit disabled until form valid', async ({ page }) => {
    await dispatchContext(page, () => {
      const detail = {
        isValid: false,
        authorityUrl: 'https://example.gov.uk',
        selectedCouncil: { website: 'council.example.gov.uk' },
        previewHtml: '<p>Example preview</p>',
        validateAll: () => false,
        focusFirstError: () => {},
      };
      const root = document.querySelector('[data-confirm-root]');
      root?.dispatchEvent(new CustomEvent('publish-confirm:test-context', { detail }));
    });

    const submit = page.getByTestId('confirm-submit');
    await expect(submit).toBeDisabled();

    await dispatchContext(page, () => {
      const root = document.querySelector('[data-confirm-root]');
      root?.dispatchEvent(new CustomEvent('publish-confirm:test-context', { detail: { isValid: true } }));
    });

    await expect(submit).toBeEnabled();
  });

  test('shows domain mismatch warning', async ({ page }) => {
    await dispatchContext(page, () => {
      const detail = {
        isValid: true,
        authorityUrl: 'https://example.gov.uk/path?query=1',
        selectedCouncil: { website: 'council.example.org/services' },
        previewHtml: '<p>Example notice</p>',
      };
      const root = document.querySelector('[data-confirm-root]');
      root?.dispatchEvent(new CustomEvent('publish-confirm:test-context', { detail }));
    });

    const warnings = page.getByTestId('confirm-domain-warning');
    await expect(warnings).toHaveCount(2);
    await expect(warnings.first()).toBeVisible();
    await expect(warnings.nth(1)).toBeVisible();

    await expect(page.getByTestId('confirm-authority-url')).toHaveText('https://example.gov.uk/path?query=1');
    await expect(page.getByTestId('confirm-directory-url')).toHaveText('https://council.example.org');
    await expect(page.getByTestId('preview-authority-url')).toHaveText('https://example.gov.uk/path?query=1');
    await expect(page.getByTestId('preview-directory-url')).toHaveText('https://council.example.org');
  });

  test('blocks forced submit when invalid and focuses first error', async ({ page }) => {
    await dispatchContext(page, () => {
      window.__confirmValidateCalls = 0;
      const errorInput = document.createElement('input');
      errorInput.setAttribute('data-confirm-error', 'true');
      errorInput.setAttribute('aria-invalid', 'true');
      document.body.appendChild(errorInput);

      const detail = {
        isValid: false,
        previewHtml: '<p>Example preview</p>',
        validateAll: () => {
          window.__confirmValidateCalls = (window.__confirmValidateCalls || 0) + 1;
          return false;
        },
        focusFirstError: () => {
          errorInput.focus();
        },
      };
      const root = document.querySelector('[data-confirm-root]');
      root?.dispatchEvent(new CustomEvent('publish-confirm:test-context', { detail }));
    });

    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="confirm-submit"]') as HTMLButtonElement | null;
      if (!button) return;
      button.removeAttribute('disabled');
      button.setAttribute('aria-disabled', 'false');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    const validationCalls = await page.evaluate(() => window.__confirmValidateCalls ?? 0);
    expect(validationCalls).toBe(1);

    const activeAriaInvalid = await page.evaluate(() => document.activeElement?.getAttribute('aria-invalid'));
    expect(activeAriaInvalid).toBe('true');

    await expect(page).toHaveURL(PUBLISH_CONFIRM_PATH);

    await page.evaluate(() => {
      document.querySelector('[data-confirm-error]')?.remove();
      delete window.__confirmValidateCalls;
    });
  });
});
