/**
 * @fileoverview Regressão E2E do map-search com evidência visual obrigatória:
 * lista com lotes, filtros funcionando, hover no item e fechamento do modal.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const SHOTS_DIR = path.join('tests', 'e2e', 'screenshots', 'map-search-regression');

test.describe('Map Search modal regression', () => {
  test('must show lots, filter results and close modal', async ({ page }) => {
    test.setTimeout(420_000);

    await page.goto('/map-search', { waitUntil: 'domcontentloaded', timeout: 240_000 });
    await expect(page).toHaveURL(/\/map-search/, { timeout: 60_000 });

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 60_000 });

    const closeButton = page.locator('[data-ai-id="map-search-close-modal"]');
    await expect(closeButton).toBeVisible({ timeout: 20_000 });

    const list = page.locator('[data-ai-id="map-search-list"]');
    await expect(list).toBeVisible({ timeout: 20_000 });

    const cards = page.locator('[data-ai-id="map-search-list-item"]');
    await expect(cards.first()).toBeVisible({ timeout: 120_000 });

    await page.screenshot({
      path: path.join(SHOTS_DIR, '01-lista-com-lotes.png'),
      fullPage: true,
    });

    const countLabel = page.locator('[data-ai-id="map-search-count"]');
    await expect(countLabel).toContainText('resultado', { timeout: 20_000 });

    const searchInput = page.locator('[data-ai-id="map-search-input"]');
    await searchInput.fill('zzzz-sem-resultado-qa');
    await expect(countLabel).toContainText('0 resultado', { timeout: 60_000 });

    await page.screenshot({
      path: path.join(SHOTS_DIR, '02-filtro-aplicado-zero-resultado.png'),
      fullPage: true,
    });

    await searchInput.fill('');
    await expect(cards.first()).toBeVisible({ timeout: 120_000 });

    await cards.first().hover();
    await page.waitForTimeout(1200);

    await page.screenshot({
      path: path.join(SHOTS_DIR, '03-hover-item-mapa.png'),
      fullPage: true,
    });

    await closeButton.click();
    await expect(dialog).not.toBeVisible({ timeout: 20_000 });

    await page.screenshot({
      path: path.join(SHOTS_DIR, '04-modal-fechado-volta-site.png'),
      fullPage: true,
    });
  });
});
