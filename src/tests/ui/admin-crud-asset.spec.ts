// tests/ui/admin-crud-asset.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAssetName = `Ativo Playwright ${testRunId}`;
const updatedAssetName = `Ativo Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Ativo (Bem) (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/assets');
    await expect(page.locator('[data-ai-id="admin-assets-page-container"]')).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for an Asset (Bem)', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Ativo' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible({ timeout: 15000 });

    const assetForm = page.locator('[data-ai-id="asset-form"]');
    await assetForm.getByLabel('Título/Nome do Bem').fill(testAssetName);
    
    // Selecionar Categoria
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-category"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    
    await assetForm.getByRole('button', { name: 'Criar Ativo' }).click();
    
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Ativos' })).toBeVisible();

    // --- READ ---
    await page.locator('[data-ai-id="search-results-frame-search-input"]').fill(testAssetName);
    const newRow = page.getByRole('row', { name: new RegExp(testAssetName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/assets\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Ativo' })).toBeVisible();
    await page.locator('[data-ai-id="asset-form"]').getByLabel('Título/Nome do Bem').fill(updatedAssetName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Ativo atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/assets');
    await expect(page.getByText(updatedAssetName)).toBeVisible();

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedAssetName, 'i') });
    
    // Acionar a exclusão que abre o confirm
    await rowToDelete.getByRole('button', { name: 'Excluir' }).click();
    
    // O Playwright irá interagir com o alert `confirm` nativo
    // Nota: Como não temos um diálogo customizado, o `page.on('dialog')` é a abordagem correta.
    page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Você tem certeza que deseja excluir este item?');
        await dialog.accept();
    });
    
    await rowToDelete.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByText('Ativo excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedAssetName)).not.toBeVisible();
  });
});
