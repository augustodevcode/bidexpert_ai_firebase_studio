// tests/ui/admin-crud-judicial-branch.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testBranchName = `Vara Playwright ${testRunId}`;
const updatedBranchName = `Vara Editada ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Vara Judicial (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/judicial-branches');
    await expect(page.getByRole('heading', { name: 'Gerenciar Varas Judiciais' })).toBeVisible({timeout: 20000});
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial Branch', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Nova Vara' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Vara Judicial' })).toBeVisible({ timeout: 15000 });

    // Selecionar Comarca
    await page.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-district"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();

    // Preencher o formulário
    await page.getByLabel('Nome da Vara').fill(testBranchName);
    await page.getByLabel('Nome do Contato (Opcional)').fill('Contato da Vara');
    
    await page.getByRole('button', { name: 'Criar Vara' }).click();
    
    await expect(page.getByText('Vara criada com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Varas Judiciais' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por nome da vara...').fill(testBranchName);
    const newRow = page.getByRole('row', { name: new RegExp(testBranchName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-branches\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Vara Judicial' })).toBeVisible();
    await page.getByLabel('Nome da Vara').fill(updatedBranchName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Vara atualizada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-branches');
    await expect(page.getByText(updatedBranchName)).toBeVisible();

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedBranchName, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Vara excluída com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedBranchName)).not.toBeVisible();
  });
});
