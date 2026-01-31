/**
 * @fileoverview Fluxo E2E da tela de Identidade Visual e Temas.
 * BDD: Administrador acessa e interage com configurações de tema.
 * TDD: Garantir navegação e interação básica sem falhas.
 */

import { test } from '@playwright/test';

test.use({ launchOptions: { headless: false } });

test.describe('Admin - Identidade Visual e Temas', () => {
  test('acessa a página e abre a biblioteca de mídia', async ({ page }) => {
    await page.goto('/admin/settings/themes');
    await page.waitForSelector('[data-ai-id="settings-theme-colors-section"]');
    await page.click('[data-ai-id="settings-theme-logo-select-button"]');
    await page.waitForSelector('text=Adicionar Mídia');
    await page.keyboard.press('Escape');
  });
});
