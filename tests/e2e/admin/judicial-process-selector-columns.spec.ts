/**
 * @fileoverview Regressão E2E do modal compartilhado de Processo Judicial.
 */

import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://demo.localhost:9006';

test('admin auction form mostra colunas ampliadas no selector de processo judicial', async ({ page }) => {
  test.setTimeout(240_000);

  await loginAsAdmin(page, BASE_URL);

  await page.request.get(`${BASE_URL}/admin/auctions/new`, {
    failOnStatusCode: false,
    timeout: 180_000,
  });

  await page.goto(`${BASE_URL}/admin/auctions/new`, {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  });

  const trigger = page.locator('[data-ai-id="entity-selector-trigger-Processo Judicial"]');

  await expect(trigger).toBeVisible({ timeout: 30_000 });
  await trigger.click();

  await expect(page.locator('[data-ai-id="entity-selector-modal-Processo Judicial"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-process-number"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-seller"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-branch"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-district"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-court"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-assets"]')).toBeVisible();
  await expect(page.locator('[data-ai-id="judicial-process-selector-header-lots"]')).toBeVisible();

  await page.screenshot({
    path: 'test-results/judicial-process-selector-columns.png',
    fullPage: true,
  });
});