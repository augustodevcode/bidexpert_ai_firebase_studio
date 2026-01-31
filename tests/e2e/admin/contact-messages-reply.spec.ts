/**
 * @fileoverview E2E: visualizar mensagem de contato e abrir resposta.
 * BDD: Garantir acesso ao texto completo e formulário de resposta.
 * TDD: Validar que o modal de resposta abre corretamente.
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './admin-helpers';

const BASE_URL = process.env.BASE_URL || 'http://demo.servidor:9005';

test.describe('Admin - Mensagens de Contato', () => {
  test('abrir visualização e formulário de resposta', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/contact-messages`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    const actionTrigger = page.locator('[data-ai-id^="contact-message-actions-trigger-"]').first();
    await actionTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await actionTrigger.click();

    const viewAction = page.locator('[data-ai-id^="contact-message-view-"]').first();
    await viewAction.waitFor({ state: 'visible', timeout: 10000 });
    await viewAction.click();

    const dialog = page.locator('[data-ai-id="contact-message-dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    await expect(page.locator('[data-ai-id="contact-message-body"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="contact-message-reply-form"]')).toBeVisible();
  });
});
