/**
 * @fileoverview Valida visualmente os controles administrativos de modalidades de venda de leilões.
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession } from './admin-helpers';

test.describe('Admin auction sale modes', () => {
  test('shows ABA sale mode controls and proposal deadline conditionally', async ({ page }) => {
    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('[data-ai-id="admin-auction-form-card"]')).toBeVisible({ timeout: 60000 });

    const saleModesCard = page.locator('[data-ai-id="auction-sale-modes-card"]');
    await expect(saleModesCard).toBeVisible({ timeout: 60000 });
    await expect(saleModesCard.getByText('Permitir Sublote')).toBeVisible();
    await expect(saleModesCard.getByText('Habilitação por Lote')).toBeVisible();
    await expect(saleModesCard.getByText('Direito de Preferência')).toBeVisible();
    await expect(saleModesCard.getByText('Permitir Propostas')).toBeVisible();
    await expect(saleModesCard.getByText('Venda Direta')).toBeVisible();

    const proposalDeadlineField = page.locator('[data-ai-id="auction-proposal-deadline-field"]');
    await expect(proposalDeadlineField).toBeHidden();

    await page.locator('[data-ai-id="auction-sale-mode-allow-proposals-switch"]').click();
    await expect(proposalDeadlineField).toBeVisible();
    await page.locator('[data-ai-id="auction-proposal-deadline-input"]').fill('2026-05-06T18:00');

    await page.locator('[data-ai-id="auction-sale-mode-direct-sale-switch"]').click();
    await expect(proposalDeadlineField).toBeVisible();
  });
});