/**
 * @fileoverview Valida o overlay de hover nos cards de lotes e leilões com ações rápidas.
 */

import { expect, test } from '@playwright/test';

test.describe('Card hover actions', () => {
  test('deve exibir ações rápidas no hover do card de lote', async ({ page }) => {
    await page.goto('http://dev.localhost:9006');

    const lotCard = page.locator('[data-testid="lot-card"]').first();
    await expect(lotCard).toBeVisible({ timeout: 20000 });

    const media = lotCard.locator('.wrapper-card-media').first();
    const overlay = media.locator('[data-ai-id="lot-card-actions-overlay"]');

    await expect.poll(async () => {
      return overlay.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).opacity));
    }).toBeLessThan(0.2);

    await media.hover();

    await expect.poll(async () => {
      return overlay.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).opacity));
    }).toBeGreaterThan(0.8);

    await expect(media.locator('[data-ai-id="lot-card-preview-btn"]')).toBeVisible();
    await expect(media.locator('[data-ai-id="lot-card-favorite-btn"]')).toBeVisible();
  });

  test('deve exibir ações rápidas no hover do card de leilão', async ({ page }) => {
    await page.goto('http://dev.localhost:9006/auctions');

    const auctionCard = page.locator('[data-testid="auction-card"]').first();
    await expect(auctionCard).toBeVisible({ timeout: 20000 });

    const media = auctionCard.locator('.wrapper-card-media').first();
    const overlay = media.locator('[data-ai-id="auction-card-actions-overlay"]');

    await expect.poll(async () => {
      return overlay.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).opacity));
    }).toBeLessThan(0.2);

    await media.hover();

    await expect.poll(async () => {
      return overlay.evaluate((el) => Number.parseFloat(window.getComputedStyle(el).opacity));
    }).toBeGreaterThan(0.8);

    await expect(media.locator('[data-ai-id="auction-card-preview-btn"]')).toBeVisible();
    await expect(media.locator('[data-ai-id="auction-card-favorite-btn"]')).toBeVisible();
  });
});
