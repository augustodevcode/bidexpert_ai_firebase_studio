// tests/ui/admin-crud.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testSellerName = `Comitente Playwright ${testRunId}`;
const updatedContactName = `Contato Editado ${testRunId}`;

test.describe('Admin CRUD Operations E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // 1. Autenticar como Admin
    console.log('[Admin CRUD Test] Navigating to login...');
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Aguarda o redirecionamento para o dashboard
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD Test] Login successful. Navigating to sellers page...');

    // 2. Navegar para a página de Comitentes
    await page.goto('/admin/sellers');
    await expect(page.getByRole('heading', { name: 'Listagem de Comitentes' })).toBeVisible();
    console.log('[Admin CRUD Test] Arrived at sellers page.');
  });

  test('Cenário 1.2: should perform a full CRUD cycle for a Seller', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD Test] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Comitente' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Comitente' })).toBeVisible();

    // Preencher o formulário
    await page.getByLabel('Nome do Comitente/Empresa').fill(testSellerName);
    await page.getByLabel('Nome do Contato (Opcional)').fill('Contato Inicial');
    await page.getByLabel('Email (Opcional)').fill(`comitente-${testRunId}@teste.com`);
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Esperar pelo redirecionamento e toast de sucesso
    await expect(page.getByText('Comitente criado com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listagem de Comitentes' })).toBeVisible();
    console.log('[Admin CRUD Test] CREATE step finished successfully.');

    // --- READ ---
    console.log('[Admin CRUD Test] Starting READ step...');
    // Usar o campo de busca para encontrar o novo comitente
    await page.getByPlaceholder('Buscar por nome ou email...').fill(testSellerName);
    const newSellerRow = page.getByRole('row', { name: testSellerName });
    await expect(newSellerRow).toBeVisible();
    console.log('[Admin CRUD Test] READ step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD Test] Starting UPDATE step...');
    // Clicar no botão de editar
    await newSellerRow.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Comitente' })).toBeVisible();
    
    // Entrar no modo de edição e alterar um campo
    await page.getByRole('button', { name: 'Entrar em Modo de Edição' }).click();
    const contactInput = page.getByLabel('Nome do Contato (Opcional)');
    await contactInput.fill(updatedContactName);

    // Salvar
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    
    // Verificar o toast de sucesso e o retorno para a listagem
    await expect(page.getByText('Comitente atualizado.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listagem de Comitentes' })).toBeVisible();

    // Verificar se a alteração foi persistida
    await page.getByPlaceholder('Buscar por nome ou email...').fill(testSellerName);
    await expect(page.getByRole('row', { name: testSellerName })).toBeVisible(); // A linha ainda deve ser visível
    
    // Ir para a página de edição novamente para verificar o valor
    await page.getByRole('row', { name: testSellerName }).getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByLabel('Nome do Contato (Opcional)')).toHaveValue(updatedContactName);
    console.log('[Admin CRUD Test] UPDATE step finished successfully.');
    
    // Voltar para a lista para a etapa de exclusão
    await page.goto('/admin/sellers');
    await expect(page.getByRole('heading', { name: 'Listagem de Comitentes' })).toBeVisible();


    // --- DELETE ---
    console.log('[Admin CRUD Test] Starting DELETE step...');
    await page.getByPlaceholder('Buscar por nome ou email...').fill(testSellerName);
    const rowToDelete = page.getByRole('row', { name: testSellerName });
    await expect(rowToDelete).toBeVisible();
    
    // Clicar no botão de excluir e confirmar no diálogo
    await rowToDelete.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    
    // Verificar o toast de sucesso e se o item desapareceu da lista
    await expect(page.getByText('Comitente excluído com sucesso.')).toBeVisible();
    await expect(rowToDelete).not.toBeVisible();
    console.log('[Admin CRUD Test] DELETE step finished successfully.');
  });
});
