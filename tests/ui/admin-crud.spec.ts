// tests/ui/admin-crud.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testSellerName = `Comitente Playwright ${testRunId}`;
const updatedContactName = `Contato Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Comitente (UI)', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // 1. Autenticar como Admin
    console.log('[Admin CRUD Test] Navigating to login...');
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    
    // Aguarda o redirecionamento para o dashboard
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD Test] Login successful. Navigating to sellers page...');

    // 2. Navegar para a página de Comitentes
    await page.goto('/admin/sellers');
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible({ timeout: 20000 });
    console.log('[Admin CRUD Test] Arrived at sellers page.');
  });

  test('Cenário 1.2: should perform a full CRUD cycle for a Seller', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD Test] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Comitente' }).click();
    await expect(page.locator('[data-ai-id="admin-new-seller-page"]')).toBeVisible({ timeout: 15000 });

    // Preencher o formulário
    await page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Comitente/Empresa').fill(testSellerName);
    await page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Contato (Opcional)').fill('Contato Inicial');
    await page.locator('[data-ai-id="seller-form"]').getByLabel('Email (Opcional)').fill(`comitente-${testRunId}@teste.com`);
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    
    // Esperar pelo redirecionamento e toast de sucesso
    await expect(page.getByText('Comitente criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible();
    console.log('[Admin CRUD Test] CREATE step finished successfully.');

    // --- READ ---
    console.log('[Admin CRUD Test] Starting READ step...');
    // Usar o campo de busca para encontrar o novo comitente
    await page.locator('[data-ai-id="search-results-frame-search-input"]').fill(testSellerName);
    const newSellerRow = page.getByRole('row', { name: new RegExp(testSellerName, 'i') });
    await expect(newSellerRow).toBeVisible();
    console.log('[Admin CRUD Test] READ step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD Test] Starting UPDATE step...');
    // Clicar no botão de editar
    await newSellerRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/sellers\/.+\/edit/);
    
    const formLayout = page.locator('[data-ai-id="form-page-layout-card"]');
    await expect(formLayout.getByRole('heading', { name: 'Visualizar Comitente' })).toBeVisible();
    
    // Entrar no modo de edição e alterar um campo
    await formLayout.locator('[data-ai-id="form-page-btn-edit-mode"]').click();
    const contactInput = page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Contato (Opcional)');
    await contactInput.fill(updatedContactName);

    // Salvar
    await formLayout.locator('[data-ai-id="form-page-btn-save"]').click();
    
    // Verificar o toast de sucesso e o retorno para o modo de visualização
    await expect(page.getByText('Comitente atualizado.')).toBeVisible();
    await expect(page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Contato (Opcional)')).toHaveValue(updatedContactName); // Verifica se o campo foi atualizado na UI
    console.log('[Admin CRUD Test] UPDATE step finished successfully.');
    
    // --- DELETE ---
    console.log('[Admin CRUD Test] Starting DELETE step...');
    await formLayout.locator('[data-ai-id="form-page-btn-delete-trigger"]').click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.locator('[data-ai-id="form-page-btn-delete-confirm"]').click();
    
    // Verificar o toast de sucesso e se foi redirecionado para a lista
    await expect(page.getByText('Comitente excluído com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/sellers');
    
    // Verificar se o item não está mais na lista
    await page.locator('[data-ai-id="search-results-frame-search-input"]').fill(testSellerName);
    await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
    console.log('[Admin CRUD Test] DELETE step finished successfully.');
  });
});
