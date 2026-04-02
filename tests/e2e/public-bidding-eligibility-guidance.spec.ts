/**
 * @fileoverview Valida a orientação inline de habilitação no painel público de lances.
 */

import { test, expect } from './fixtures/browser-telemetry.fixture';

import { ensureSeedExecuted, loginAs } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9010';

test.describe('Orientação inline de habilitação no detalhe público do lote', () => {
  test.setTimeout(120_000);

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.goto(`${BASE_URL}/auctions/239/lots/LOTE-0163`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.close();
  });

  test('usuário com documentação aprovada vê o passo de habilitação do leilão no painel de lances', async ({ page, browserTelemetry }) => {
    await ensureSeedExecuted(BASE_URL);
    await loginAs(page, 'analista', BASE_URL, { waitPattern: /\/dashboard/i });

    await page.goto(`${BASE_URL}/auctions/239/lots/LOTE-0163`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const blocker = page.locator('[data-ai-id="bidding-panel-auction-habilitation-required"]:visible').first();
    await expect(blocker).toBeVisible();
    await expect(blocker.locator('[data-ai-id="bidding-panel-habilitation-guidance"]').first()).toContainText('Documentação aprovada');
    await expect(blocker).toContainText('Falta apenas a habilitação específica');
    await expect(blocker.locator('[data-ai-id="bidding-panel-documents-review-link"]').first()).toHaveAttribute('href', '/dashboard/documents');
    await expect(blocker.locator('[data-ai-id="bidding-panel-habilitate-action"]').first()).toBeVisible();

    const criticalBrowserErrors = browserTelemetry.filter((entry) =>
      /TypeError|ReferenceError|hydration|HTTP 5\d\d/.test(entry.message),
    );

    expect(criticalBrowserErrors).toEqual([]);
  });
});