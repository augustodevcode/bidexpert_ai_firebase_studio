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
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/assets');
    await expect(page.getByRole('heading', { name: 'Gerenciar Ativos' })).toBeVisible();
  });

  test('Cenário: should perform a full CRUD cycle for an Asset (Bem)', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Ativo' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible();

    // Preencher o formulário
    await page.getByLabel('Título/Nome do Bem').fill(testAssetName);
    await page.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-category"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gerenciar Ativos' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por título...').fill(testAssetName);
    const newRow = page.getByRole('row', { name: new RegExp(testAssetName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/assets\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Ativo' })).toBeVisible();
    await page.getByLabel('Título/Nome do Bem').fill(updatedAssetName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Ativo atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/assets');
    await expect(page.getByText(updatedAssetName)).toBeVisible();

    // --- DELETE ---
    await page.getByRole('row', { name: new RegExp(updatedAssetName, 'i') }).getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Ativo excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedAssetName)).not.toBeVisible();
  });
});
