/**
 * @fileoverview Guarda de competitividade para header público e dashboard do arrematante.
 *
 * BDD:
 * - Dado o login público do tenant demo
 *   Quando a página carrega
 *   Então o header desktop deve renderizar apenas um link principal para /lots
 *
 * - Dado um usuário autenticado no dashboard
 *   Quando a visão geral é carregada com recomendações
 *   Então a página não deve emitir warnings de duplicidade de key nem de serialização Decimal
 */

import { test, expect } from './fixtures/browser-telemetry.fixture';

import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9007';

test.describe('Competitividade do header e dashboard', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.close();
  });

  test('header público não duplica /lots e dashboard não vaza warnings críticos', async ({ page, browserTelemetry }) => {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    const publicLotsLinks = page.locator('[data-ai-id="nav-desktop-link-lotes"]');
    await expect(publicLotsLinks.first()).toBeVisible();
    await expect(publicLotsLinks).toHaveCount(1);

    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.locator('[data-ai-id="user-dashboard-overview-page"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="user-dashboard-stats-grid"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="user-dashboard-recommendations-card"]')).toBeVisible();

    const criticalBrowserMessages = browserTelemetry.filter((entry) =>
      /Encountered two children with the same key|Only plain objects can be passed to Client Components|Decimal objects are not supported/.test(entry.message),
    );

    expect(criticalBrowserMessages).toEqual([]);
  });
});