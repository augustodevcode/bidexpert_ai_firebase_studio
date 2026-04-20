import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';

test.describe('Massa de Dados & Form-fill UI (Gemini)', () => {
  test.setTimeout(180_000);

  test('01 - Criar Vara', async ({ page }) => {
    console.log('[Gemini-Massa] Iniciando login em ' + BASE_URL);
    await loginAsAdmin(page, BASE_URL);

    console.log('[Gemini-Massa] Aguardando redirect do auth...');
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');

    console.log('[Gemini-Massa] Navegando para admin/courts...');
    await page.goto(BASE_URL + '/admin/courts', { waitUntil: 'domcontentloaded' });
    
    // Espera a página carregar
    await expect(page.getByRole('heading', { name: /Tribunais/i })).toBeVisible({ timeout: 60000 });

    // Clicar em Novo Tribunal
    console.log('[Gemini-Massa] Clicando em Novo Tribunal...');
    await page.getByRole('button', { name: /Novo Tribunal/i }).click();

    // Preencher a Vara
    console.log('[Gemini-Massa] Preenchendo dados da Vara...');
    const nameInput = page.getByLabel(/Nome do Tribunal/i).first();
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('1ª Vara Gemini - ' + Date.now());
    
    // Click Select Estado — EntitySelector opens a DataTable dialog
    console.log('[Gemini-Massa] Selecionando estado...');
    const stateCombobox = page.locator('[data-ai-id="entity-selector-trigger-Estado"]');
    if (await stateCombobox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await stateCombobox.click();
      // Wait for EntitySelector dialog table to render
      const entityModal = page.locator('[data-ai-id="entity-selector-modal-Estado"]');
      await expect(entityModal).toBeVisible({ timeout: 10_000 });
      // Click the first "Selecionar" button in the table rows
      const selectBtn = entityModal.getByRole('button', { name: /Selecionar/i }).first();
      if (await selectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await selectBtn.click();
      } else {
        // Fallback: close dialog if no items found
        console.log('[Gemini-Massa] Nenhum estado encontrado, fechando seletor...');
        await page.keyboard.press('Escape');
      }
      // Wait for EntitySelector dialog to close
      await expect(entityModal).not.toBeVisible({ timeout: 5_000 }).catch(() => {});
    }
    
    // Salvar
    console.log('[Gemini-Massa] Clicando em Salvar...');
    await page.getByRole('button', { name: /Salvar/i }).click();

    // Aguarda toast de sucesso (use exact match to avoid strict-mode violation)
    await expect(page.getByText('Sucesso!', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  });
});

