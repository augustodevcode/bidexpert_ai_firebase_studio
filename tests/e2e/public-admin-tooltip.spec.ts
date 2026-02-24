/**
 * @fileoverview Testes E2E do Admin ToolTip em títulos de seções públicas.
 *
 * Valida que usuários com permissão de edição visualizam, ao passar o mouse
 * sobre nomes de seções, a explicação de regra de negócio da query/filtro.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';

test.describe('Admin ToolTip em páginas públicas', () => {
  test('deve exibir tooltip de regra de negócio na home ao hover dos títulos', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 120_000 });

    const featuredLotsTitle = page.locator('[data-ai-id="homepage-featured-lots-title"]').first();
    await expect(featuredLotsTitle).toBeVisible({ timeout: 30_000 });
    await featuredLotsTitle.hover();

    const featuredLotsTooltip = page.locator('[data-ai-id="public-section-admin-tooltip-homepage-featured-lots"]');
    await expect(featuredLotsTooltip).toBeVisible({ timeout: 10_000 });
    await expect(featuredLotsTooltip).toContainText('ABERTO_PARA_LANCES');

    const featuredAuctionsTitle = page.locator('[data-ai-id="homepage-featured-auctions-title"]').first();
    await expect(featuredAuctionsTitle).toBeVisible({ timeout: 30_000 });
    await featuredAuctionsTitle.hover();

    const featuredAuctionsTooltip = page.locator('[data-ai-id="public-section-admin-tooltip-homepage-featured-auctions"]');
    await expect(featuredAuctionsTooltip).toBeVisible({ timeout: 10_000 });
    await expect(featuredAuctionsTooltip).toContainText('isFeaturedOnMarketplace');
  });

  test('deve exibir tooltip no título da seção de lotes do detalhe do leilão', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 120_000 });

    const firstAuctionLink = page.locator('a[href^="/auctions/"]').first();
    await expect(firstAuctionLink).toBeVisible({ timeout: 60_000 });
    await firstAuctionLink.click();
    await page.waitForLoadState('networkidle');

    const lotsSectionTitle = page.locator('[data-ai-id="auction-details-lots-section-title"]');
    await expect(lotsSectionTitle).toBeVisible({ timeout: 30_000 });
    await lotsSectionTitle.hover();

    const lotsSectionTooltip = page.locator('[data-ai-id="public-section-admin-tooltip-auction-details-lots"]');
    await expect(lotsSectionTooltip).toBeVisible({ timeout: 10_000 });
    await expect(lotsSectionTooltip).toContainText('filtros');
  });
});
