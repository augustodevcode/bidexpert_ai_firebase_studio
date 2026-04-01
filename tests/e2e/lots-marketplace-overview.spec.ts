/**
 * @fileoverview Guarda competitiva da taxonomia e sinais de confiança da vitrine pública `/lots`.
 *
 * BDD:
 * - Dado que existem lotes públicos em diferentes modalidades
 *   Quando a página `/lots` é renderizada
 *   Então a taxonomia de modalidades deve aparecer antes da grade principal
 *   E a trilha de confiança deve destacar sinais objetivos da vitrine
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9007';

test.describe('Vitrine pública /lots', () => {
  test('expõe taxonomia de modalidades e trilha de confiança', async ({ page }) => {
    await page.goto(`${BASE_URL}/lots`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const overview = page.locator('[data-ai-id="lots-marketplace-overview"]');
    await expect(overview).toBeVisible({ timeout: 60_000 });

    await expect(page.locator('[data-ai-id="lots-marketplace-chip-judicial"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-chip-extrajudicial"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-chip-venda-direta"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-chip-tomada-de-precos"]')).toBeVisible();

    const trustRail = page.locator('[data-ai-id="lots-marketplace-trust-rail"]');
    await expect(trustRail).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-trust-open-lots"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-trust-process-traceability"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-trust-active-consignors"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lots-marketplace-trust-advanced-discovery"]')).toBeVisible();

    const location = page.locator('[data-ai-id="card-v2-location"]').first();
    await expect(location).toBeVisible();
  });
});