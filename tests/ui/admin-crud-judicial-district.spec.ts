// tests/ui/admin-crud-judicial-district.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testDistrictName = `Comarca Playwright ${testRunId}`;
const updatedDistrictName = `Comarca Editada ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Comarca (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/judicial-districts');
    await expect(page.getByRole('heading', { name: 'Gerenciar Comarcas' })).toBeVisible();
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial District', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Nova Comarca' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Comarca' })).toBeVisible();

    // Preencher o formulário
    await page.getByLabel('Nome da Comarca').fill(testDistrictName);
    
    // Selecionar Tribunal
    await page.getByRole('button', { name: 'Selecione o tribunal' }).click();
    await page.locator('[data-ai-id="entity-selector-modal-court"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();

    // Selecionar Estado
    await page.getByRole('button', { name: 'Selecione o estado' }).click();
    await page.locator('[data-ai-id="entity-selector-modal-state"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();

    await page.getByRole('button', { name: 'Criar Comarca' }).click();
    
    await expect(page.getByText('Comarca criada com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gerenciar Comarcas' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por nome da comarca...').fill(testDistrictName);
    const newRow = page.getByRole('row', { name: new RegExp(testDistrictName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-districts\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Comarca' })).toBeVisible();
    await page.getByLabel('Nome da Comarca').fill(updatedDistrictName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Comarca atualizada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-districts');
    await expect(page.getByText(updatedDistrictName)).toBeVisible();

    // --- DELETE ---
    await page.getByRole('row', { name: new RegExp(updatedDistrictName, 'i') }).getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Comarca excluída com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedDistrictName)).not.toBeVisible();
  });
});
