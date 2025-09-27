// tests/ui/admin-crud-vehicle-make.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testMakeName = `Marca Playwright ${testRunId}`;
const updatedMakeName = `Marca Editada ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Marca de Veículo (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 20000 });

    await page.goto('/admin/vehicle-makes');
    await expect(page.getByRole('heading', { name: 'Gerenciar Marcas de Veículos' })).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Vehicle Make', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Nova Marca' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Marca de Veículo' })).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Nome da Marca').fill(testMakeName);
    await page.getByRole('button', { name: 'Criar Marca' }).click();
    
    await expect(page.getByText('Marca criada com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Marcas de Veículos' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por nome da marca...').fill(testMakeName);
    const newRow = page.getByRole('row', { name: new RegExp(testMakeName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/vehicle-makes\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Marca de Veículo' })).toBeVisible();
    await page.getByLabel('Nome da Marca').fill(updatedMakeName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Marca atualizada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/vehicle-makes');
    await expect(page.getByText(updatedMakeName)).toBeVisible();

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedMakeName, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Marca excluída com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedMakeName)).not.toBeVisible();
  });
});
