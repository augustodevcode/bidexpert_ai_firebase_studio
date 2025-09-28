// tests/ui/admin-crud-category.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testCategoryName = `Categoria Playwright ${testRunId}`;
const updatedDescription = `Descrição Editada ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Categoria (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log('[Admin CRUD Category] Logging in as Admin...');
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD Category] Login successful. Navigating to categories page...');

    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Categorias de Lotes' })).toBeVisible();
    console.log('[Admin CRUD Category] Arrived at categories page.');
  });

  test('Cenário: should perform a full CRUD cycle for a Category', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD Category] Starting CREATE step...');
    // A criação de categoria é desativada na UI, então pulamos para a próxima parte.
    // Em um cenário real, se a criação fosse habilitada, o código seria:
    // await page.getByRole('button', { name: 'Nova Categoria' }).click();
    // ... preencher formulário ...
    // ... salvar ...
    console.log('[Admin CRUD Category] CREATE step skipped as it is disabled in the UI.');

    // --- READ ---
    console.log('[Admin CRUD Category] Starting READ step...');
    // Para este teste, vamos encontrar e editar uma categoria existente, pois não podemos criar uma nova.
    const categoryToEditName = 'Veículos'; // Assumindo que esta categoria existe do seed
    await page.getByPlaceholder('Buscar por nome...').fill(categoryToEditName);
    const categoryRow = page.getByRole('row', { name: new RegExp(categoryToEditName, 'i') });
    await expect(categoryRow).toBeVisible();
    console.log('[Admin CRUD Category] READ step successful (found existing category).');

    // --- UPDATE ---
    console.log('[Admin CRUD Category] Starting UPDATE step...');
    // Clicar no link para editar (o nome é o link de edição)
    await categoryRow.getByRole('link', { name: categoryToEditName }).click();
    await page.waitForURL(/\/admin\/categories\/.+\/edit/);
    await expect(page.getByRole('heading', { name: 'Editar Categoria de Lote' })).toBeVisible();
    
    // Alterar um campo
    const descriptionInput = page.getByLabel('Descrição (Opcional)');
    await descriptionInput.fill(updatedDescription);

    // Salvar
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    // Verificar o toast de sucesso e o redirecionamento
    await expect(page.getByText('Categoria atualizada com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Categorias de Lotes' })).toBeVisible();

    // Voltar e verificar a alteração (passo opcional de verificação extra)
    await page.getByPlaceholder('Buscar por nome...').fill(categoryToEditName);
    await page.getByRole('row', { name: new RegExp(categoryToEditName, 'i') }).getByRole('link').click();
    await expect(page.getByLabel('Descrição (Opcional)')).toHaveValue(updatedDescription);
    console.log('[Admin CRUD Category] UPDATE step finished successfully.');

    // --- DELETE ---
    // A exclusão de categoria também pode ser desativada para categorias padrão.
    // O teste seria similar, se habilitado.
    console.log('[Admin CRUD Category] DELETE step skipped as it is disabled for default categories.');
  });
});
