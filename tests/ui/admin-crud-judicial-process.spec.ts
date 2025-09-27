// tests/ui/admin-crud-judicial-process.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testProcessNumber = `111-UI-${testRunId}`;
const updatedProcessNumber = `222-UI-${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Processo Judicial (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/judicial-processes');
    await expect(page.getByRole('heading', { name: 'Gerenciar Processos Judiciais' })).toBeVisible();
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial Process', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Processo' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Processo Judicial' })).toBeVisible();

    // Preencher o formulário
    await page.getByLabel('Número do Processo*').fill(testProcessNumber);
    await page.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-court"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    await page.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-district"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    await page.locator('[data-ai-id="entity-selector-trigger-branch"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-branch"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    
    // Adicionar uma parte
    await page.getByLabel('Nome', { exact: true }).fill(`Autor Teste ${testRunId}`);
    
    await page.getByRole('button', { name: 'Criar Processo' }).click();
    
    await expect(page.getByText('Processo judicial criado com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gerenciar Processos Judiciais' })).toBeVisible();

    // --- READ ---
    await page.getByPlaceholder('Buscar por nº do processo...').fill(testProcessNumber);
    const newRow = page.getByRole('row', { name: new RegExp(testProcessNumber, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-processes\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Processo Judicial' })).toBeVisible();
    await page.getByLabel('Número do Processo*').fill(updatedProcessNumber);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Processo judicial atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-processes');
    await expect(page.getByText(updatedProcessNumber)).toBeVisible();

    // --- DELETE ---
    await page.getByRole('row', { name: new RegExp(updatedProcessNumber, 'i') }).getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Processo judicial excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedProcessNumber)).not.toBeVisible();
  });
});
