/**
 * @fileoverview Regressão E2E para os modos operacionais do loteamento.
 */

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? process.env.BASE_URL ?? 'http://demo.localhost:9027';

test('modo do loteamento persiste com auto-save e reaplica presets operacionais', async ({ page }) => {
  test.setTimeout(240_000);

  await page.goto(`${BASE_URL}/admin/lotting`, {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  });

  await expect(page.locator('[data-ai-id="lotting-mode-card"]')).toBeVisible({ timeout: 30_000 });

  const aiMode = page.getByRole('radio', { name: /modo ia assistida/i });
  const spreadsheetMode = page.getByRole('radio', { name: /modo planilha operacional/i });
  const autosaveBadge = page.locator('[data-ai-id="lotting-autosave-badge"]');
  const highlightedToggle = page.locator('[data-ai-id="lotting-toggle-ai"]');
  const includeGroupedToggle = page.locator('[data-ai-id="lotting-toggle-include-grouped"]');

  await aiMode.click();
  await expect(aiMode).toHaveAttribute('aria-checked', 'true');
  await expect(highlightedToggle).toHaveAttribute('aria-checked', 'true');
  await expect(autosaveBadge).toContainText(/salvas|salvando|auto-save/i);

  await spreadsheetMode.click();
  await expect(spreadsheetMode).toHaveAttribute('aria-checked', 'true');
  await expect(includeGroupedToggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-ai-id="lotting-mode-summary"]')).toContainText(/revisão em massa/i);

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('radio', { name: /modo planilha operacional/i })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-ai-id="lotting-autosave-badge"]')).toContainText(/salvas|auto-save/i);
});