// tests/ui/admin-crud-auctioneer.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAuctioneerName = `Leiloeiro Playwright ${testRunId}`;
const updatedContactName = `Contato Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Leiloeiro (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log('[Admin CRUD Auctioneer] Logging in as Admin...');
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD Auctioneer] Login successful. Navigating to auctioneers page...');

    await page.goto('/admin/auctioneers');
    await expect(page.getByRole('heading', { name: 'Listagem de Leiloeiros' })).toBeVisible();
    console.log('[Admin CRUD Auctioneer] Arrived at auctioneers page.');
  });

  test('Cenário: should perform a full CRUD cycle for an Auctioneer', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD Auctioneer] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Leiloeiro' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Leiloeiro' })).toBeVisible();

    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Leiloeiro/Empresa').fill(testAuctioneerName);
    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Contato (Opcional)').fill('Contato Leiloeiro');
    await page.locator('[data-ai-id="admin-new-auctioneer-page"]').getByRole('button', { name: 'Salvar' }).click();
    
    await expect(page.getByText('Leiloeiro criado com sucesso.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Listagem de Leiloeiros' })).toBeVisible();
    console.log('[Admin CRUD Auctioneer] CREATE step finished successfully.');

    // --- READ ---
    console.log('[Admin CRUD Auctioneer] Starting READ step...');
    await page.getByPlaceholder('Buscar por nome...').fill(testAuctioneerName);
    const newRow = page.getByRole('row', { name: new RegExp(testAuctioneerName, 'i') });
    await expect(newRow).toBeVisible();
    console.log('[Admin CRUD Auctioneer] READ step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD Auctioneer] Starting UPDATE step...');
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/auctioneers\/.+\/edit/);
    await expect(page.getByRole('heading', { name: 'Editar Leiloeiro' })).toBeVisible();
    
    await page.getByRole('button', { name: 'Entrar em Modo de Edição' }).click();
    const contactInput = page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Contato (Opcional)');
    await contactInput.fill(updatedContactName);

    await page.locator('[data-ai-id="form-page-layout-card"]').getByRole('button', { name: 'Salvar', exact: true }).click();
    
    await expect(page.getByText('Leiloeiro atualizado.')).toBeVisible();
    await expect(page.getByLabel('Nome do Contato (Opcional)')).toHaveValue(updatedContactName);
    console.log('[Admin CRUD Auctioneer] UPDATE step finished successfully.');
    
    // --- DELETE ---
    console.log('[Admin CRUD Auctioneer] Starting DELETE step...');
    await page.locator('[data-ai-id="form-page-toolbar-view-mode"]').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    
    await expect(page.getByText('Leiloeiro excluído com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/auctioneers');
    
    await page.getByPlaceholder('Buscar por nome...').fill(testAuctioneerName);
    await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
    console.log('[Admin CRUD Auctioneer] DELETE step finished successfully.');
  });
});
