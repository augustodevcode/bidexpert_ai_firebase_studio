// tests/ui-e2e/crud-modes.spec.ts
import { test, expect, type Page } from '@playwright/test';

test.describe('Cenário E2E: Validação do Modo de Edição Dinâmico (Modal vs. Sheet)', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo e faz login
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
  });

  test('deve alternar entre os modos de edição modal e sheet via configurações', async ({ page }) => {
    // 1. Ir para Configurações e mudar para o modo "Sheet"
    await page.goto('/admin/settings/general');
    await expect(page.getByRole('heading', { name: 'Configurações Gerais' })).toBeVisible();
    await page.locator('label:has-text("Painel Lateral (Sheet)")').click();
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('Configurações salvas.')).toBeVisible();
    
    console.log('[E2E CRUD Modes] Configuração alterada para "Sheet".');

    // 2. Ir para uma página de CRUD (Comitentes) e verificar se abre o Sheet
    await page.goto('/admin/sellers');
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible();
    await page.getByRole('button', { name: 'Novo Comitente' }).click();
    
    // O conteúdo do Sheet é renderizado dentro de um elemento com role 'dialog' pelo shadcn/ui
    const sheetDialog = page.locator('div[role="dialog"]');
    await expect(sheetDialog).toBeVisible({timeout: 10000});
    await expect(sheetDialog.getByRole('heading', { name: 'Novo Comitente' })).toBeVisible();
    
    // Verificar se o formulário está dentro do sheet
    await expect(sheetDialog.locator('[data-ai-id="seller-form"]')).toBeVisible();
    console.log('[E2E CRUD Modes] Verificado: Formulário abriu corretamente em modo "Sheet".');

    // Fechar o sheet
    await page.locator('button[aria-label="Close"]').click();
    await expect(sheetDialog).not.toBeVisible();

    // 3. Voltar para Configurações e mudar para o modo "Modal"
    await page.goto('/admin/settings/general');
    await expect(page.getByRole('heading', { name: 'Configurações Gerais' })).toBeVisible();
    await page.locator('label:has-text("Modal (Janela)")').click();
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('Configurações salvas.')).toBeVisible();
    
    console.log('[E2E CRUD Modes] Configuração alterada para "Modal".');
    
    // 4. Voltar para Comitentes e verificar se abre o Modal
    await page.goto('/admin/sellers');
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible();
    await page.getByRole('button', { name: 'Novo Comitente' }).click();

    // O conteúdo do Dialog também usa o role 'dialog'
    const modalDialog = page.locator('div[role="dialog"]');
    await expect(modalDialog).toBeVisible({timeout: 10000});
    await expect(modalDialog.getByRole('heading', { name: 'Novo Comitente' })).toBeVisible();
    
    await expect(modalDialog.locator('[data-ai-id="seller-form"]')).toBeVisible();
    console.log('[E2E CRUD Modes] Verificado: Formulário abriu corretamente em modo "Modal".');
    
    // Fechar o modal
    await modalDialog.locator('button[aria-label="Close"]').click();
    await expect(modalDialog).not.toBeVisible();
    
    console.log('[E2E CRUD Modes] Teste concluído com sucesso!');
  });
});
