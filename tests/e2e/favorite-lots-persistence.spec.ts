/**
 * @fileoverview Valida a persistência dos favoritos do investidor entre backend e cache local.
 *
 * BDD:
 * - Dado um investidor autenticado
 *   Quando ele favorita um lote público
 *   Então o lote deve aparecer em /dashboard/favorites
 *
 * - Dado que o cache local foi limpo
 *   Quando o dashboard de favoritos é recarregado
 *   Então o lote deve ser restaurado a partir da persistência backend
 */
import { test, expect } from './fixtures/browser-telemetry.fixture';

import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9010';
const LOT_SEARCH_URL = `${BASE_URL}/search?type=lots`;

test.describe('Persistência de favoritos', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.goto(LOT_SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.close();
  });

  test('dashboard restaura favoritos persistidos após limpar o cache local', async ({ page, browserTelemetry }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(LOT_SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.locator('[data-ai-id="lot-card-title"]').first()).toBeVisible({ timeout: 30_000 });
    const favoriteButton = page.locator('[data-ai-id="lot-card-favorite-btn"]').first();
    const favoriteTitle = (await page.locator('[data-ai-id="lot-card-title"]').first().textContent())?.trim();

    await expect(favoriteButton).toBeVisible();
    expect(favoriteTitle).toBeTruthy();

    if ((await favoriteButton.getAttribute('aria-label')) === 'Desfavoritar') {
      await favoriteButton.click();
      await expect(favoriteButton).toHaveAttribute('aria-label', 'Favoritar');
    }

    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-label', 'Desfavoritar');

    await page.goto(`${BASE_URL}/dashboard/favorites`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('[data-ai-id="my-favorites-page-container"]')).toBeVisible();
    await expect(page.getByText(favoriteTitle!, { exact: false }).first()).toBeVisible();

    await page.evaluate(() => {
      localStorage.removeItem('bidExpertFavoriteLotIds');
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
    await expect(page.locator('[data-ai-id="my-favorites-page-container"]')).toBeVisible();
    await expect(page.getByText(favoriteTitle!, { exact: false }).first()).toBeVisible();

    const criticalBrowserMessages = browserTelemetry.filter((entry) =>
      /500 \(Internal Server Error\)|Erro interno do servidor|ReferenceError|TypeError/.test(entry.message),
    );

    expect(criticalBrowserMessages).toEqual([]);
  });
});