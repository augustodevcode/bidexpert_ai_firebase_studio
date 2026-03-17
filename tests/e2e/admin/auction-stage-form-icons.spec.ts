import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession } from './admin-helpers';

test.describe('Admin auction stages form', () => {
  test('exibe ícones contextuais ao adicionar nova praça', async ({ page }, testInfo) => {
    test.skip(/noauth/i.test(testInfo.project.name), 'Fluxo administrativo exige sessão autenticada.');

    await ensureAdminSession(page);
    await page.goto(`${BASE_URL}/admin/auctions/new`, { waitUntil: 'domcontentloaded' });

    await page.locator('[data-ai-id="admin-auction-form-card"]').waitFor({ state: 'visible', timeout: 30000 });
    await expect(page.locator('[data-ai-id="admin-auction-form-card"]')).toContainText('Datas e Prazos');

    await expect(page.locator('[data-ai-id="auction-stage-form-icon-0"]')).toBeVisible();

    await page.getByRole('button', { name: /adicionar praça/i }).click();

    await expect(page.locator('[data-ai-id="auction-stage-form-icon-1"]')).toBeVisible();
    await expect(page.getByText('Em breve').last()).toBeVisible();
  });
});