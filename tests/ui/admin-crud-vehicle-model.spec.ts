// tests/ui/admin-crud-vehicle-model.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testMakeName = `Marca para Modelo ${testRunId}`;
const testModelName = `Modelo Playwright ${testRunId}`;
const updatedModelName = `Modelo Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Modelo de Veículo (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Vehicle Model', async ({ page }) => {
    
    // --- SETUP: Create a Make to associate with the model ---
    await page.goto('/admin/vehicle-makes');
    await page.getByRole('button', { name: 'Nova Marca' }).click();
    await page.getByLabel('Nome da Marca').fill(testMakeName);
    await page.getByRole('button', { name: 'Criar Marca' }).click();
    await expect(page.getByText('Marca criada com sucesso.')).toBeVisible();
    
    // --- CREATE ---
    await page.goto('/admin/vehicle-models');
    await expect(page.getByRole('heading', { name: 'Gerenciar Modelos de Veículos' })).toBeVisible();
    await page.getByRole('button', { name: 'Novo Modelo' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Modelo de Veículo' })).toBeVisible();

    // Selecionar a marca criada
    await page.getByRole('button', { name: 'Selecione a marca' }).click();
    await page.locator('div').filter({ hasText: new RegExp(`^${testMakeName}$`) }).locator('div').first().click();

    // Preencher o nome do modelo
    await page.getByLabel('Nome do Modelo').fill(testModelName);
    await page.getByRole('button', { name: 'Criar Modelo' }).click();
    
    await expect(page.getByText('Modelo criado com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gerenciar Modelos de Veículos' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por nome do modelo...').fill(testModelName);
    const newRow = page.getByRole('row', { name: new RegExp(testModelName, 'i') });
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText(testMakeName);

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/vehicle-models\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Modelo de Veículo' })).toBeVisible();
    await page.getByLabel('Nome do Modelo').fill(updatedModelName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Modelo atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/vehicle-models');
    await expect(page.getByText(updatedModelName)).toBeVisible();

    // --- DELETE ---
    await page.getByRole('row', { name: new RegExp(updatedModelName, 'i') }).getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Modelo excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedModelName)).not.toBeVisible();
  });
});
