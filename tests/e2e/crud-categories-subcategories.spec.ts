// tests/e2e/crud-categories-subcategories.spec.ts
/**
 * @fileoverview Testes E2E para os CRUDs de Categorias e Subcategorias.
 * Valida funcionalidades de listagem, criaÃ§Ã£o, ediÃ§Ã£o, exclusÃ£o e visualizaÃ§Ã£o.
 * 
 * Credenciais: admin@bidexpert.com.br / Admin@123 (conforme ultimate-master-seed.ts)
 */
import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';

test.describe('CRUD Categorias', () => {
  test.setTimeout(90000);
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('deve exibir a pÃ¡gina de categorias com botÃµes de aÃ§Ã£o', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Verifica tÃ­tulo da pÃ¡gina
    await expect(page.locator('[data-ai-id="admin-categories-page-container"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ai-id="new-category-button"]')).toBeVisible();
    
    // Verifica botÃ£o de adicionar nova categoria
    const newButton = page.locator('[data-ai-id="new-category-button"]');
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText('Nova Categoria');
    
    // Verifica link de anÃ¡lise
    const analysisLink = page.locator('[data-ai-id="categories-analysis-link"]');
    await expect(analysisLink).toBeVisible();
  });

  test('deve navegar para pÃ¡gina de nova categoria ao clicar no botÃ£o', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Clica no botÃ£o de nova categoria
    await page.locator('[data-ai-id="new-category-button"]').click();
    
    // Verifica se o formulÃ¡rio da nova categoria estÃ¡ presente
    await page.waitForURL(/\/admin\/categories\/new/, { timeout: 30000 });
    await expect(page.getByRole('button', { name: /Criar Categoria|Salvar/i })).toBeVisible({ timeout: 60000 });
  });

  test('deve exibir menu de aÃ§Ãµes ao clicar no botÃ£o de aÃ§Ãµes de uma categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Espera carregar a tabela
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Procura o primeiro botÃ£o de aÃ§Ãµes disponÃ­vel
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Verifica se o dropdown apareceu com as opÃ§Ãµes
      await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Excluir' })).toBeVisible();
    } else {
      console.log('Nenhuma categoria disponÃ­vel para testar aÃ§Ãµes');
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('deve exibir dialog de confirmaÃ§Ã£o ao tentar excluir categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Clica em excluir
      await page.getByRole('menuitem', { name: 'Excluir' }).click();
      
      // Verifica se o dialog de confirmaÃ§Ã£o apareceu
      await expect(page.getByText('Confirmar exclusÃ£o')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-ai-id="category-delete-cancel"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="category-delete-confirm"]')).toBeVisible();
    } else {
      console.log('Nenhuma categoria disponÃ­vel para testar exclusÃ£o');
    }
  });

  test('deve navegar para lotes vinculados ao clicar no link', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Clica em ver lotes vinculados
      await page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' }).click();
      
      // Verifica se navegou para a pÃ¡gina de lotes com filtro
      await page.waitForURL(/\/admin\/lots\?categoryId=/, { timeout: 10000 });
    } else {
      console.log('Nenhuma categoria disponÃ­vel para testar navegaÃ§Ã£o de vÃ­nculos');
    }
  });
  
  test('deve navegar para pÃ¡gina de ediÃ§Ã£o ao clicar no nome da categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Procura o primeiro link de nome de categoria
    const categoryNameLink = page.locator('[data-ai-id^="category-name-link-"]').first();
    
    if (await categoryNameLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryNameLink.click();
      
      // Verifica se navegou para a pÃ¡gina de ediÃ§Ã£o
      await page.waitForURL(/\/admin\/categories\/.*\/edit/, { timeout: 10000 });
    } else {
      console.log('Nenhuma categoria disponÃ­vel para testar ediÃ§Ã£o');
    }
  });
});

test.describe('CRUD Subcategorias', () => {
  test.setTimeout(90000);
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('deve exibir a pÃ¡gina de subcategorias com filtro e botÃ£o de adicionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Verifica tÃ­tulo da pÃ¡gina
    await expect(page.locator('[data-ai-id="admin-subcategories-page-container"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ai-id="new-subcategory-button"]')).toBeVisible();
    
    // Verifica botÃ£o de adicionar nova subcategoria
    const newButton = page.locator('[data-ai-id="new-subcategory-button"]');
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText('Nova Subcategoria');
    
    // Verifica filtro de categoria
    const filterTrigger = page.locator('#parentCategorySelect');
    await expect(filterTrigger).toBeVisible();
  });

  test('deve navegar para pÃ¡gina de nova subcategoria ao clicar no botÃ£o', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Clica no botÃ£o de nova subcategoria
    await page.locator('[data-ai-id="new-subcategory-button"]').click();
    
    // Verifica se navegou para a pÃ¡gina de nova subcategoria
    await page.waitForURL(/\/admin\/subcategories\/new/, { timeout: 15000 });
    
    // Verifica se o formulÃ¡rio estÃ¡ presente
    await expect(page.getByRole('button', { name: /Criar Subcategoria|Salvar/i })).toBeVisible({ timeout: 15000 });
  });

  test('deve exibir menu de aÃ§Ãµes ao clicar no botÃ£o de aÃ§Ãµes de uma subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Verifica se o dropdown apareceu com as opÃ§Ãµes
      await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Excluir' })).toBeVisible();
    } else {
      console.log('Nenhuma subcategoria disponÃ­vel para testar aÃ§Ãµes');
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('deve exibir dialog de confirmaÃ§Ã£o ao tentar excluir subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      await page.getByRole('menuitem', { name: 'Excluir' }).click();
      
      // Verifica se o dialog de confirmaÃ§Ã£o apareceu
      await expect(page.getByText('Confirmar exclusÃ£o')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-ai-id="subcategory-delete-cancel"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="subcategory-delete-confirm"]')).toBeVisible();
    } else {
      console.log('Nenhuma subcategoria disponÃ­vel para testar exclusÃ£o');
    }
  });

  test('deve navegar para lotes vinculados ao clicar no link', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      await page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' }).click();
      
      // Verifica se navegou para a pÃ¡gina de lotes com filtro
      await page.waitForURL(/\/admin\/lots\?subcategoryId=/, { timeout: 10000 });
    } else {
      console.log('Nenhuma subcategoria disponÃ­vel para testar navegaÃ§Ã£o de vÃ­nculos');
    }
  });
  
  test('deve navegar para pÃ¡gina de ediÃ§Ã£o ao clicar no nome da subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const subcategoryNameLink = page.locator('[data-ai-id^="subcategory-name-link-"]').first();
    
    if (await subcategoryNameLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subcategoryNameLink.click();
      
      // Verifica se navegou para a pÃ¡gina de ediÃ§Ã£o
      await page.waitForURL(/\/admin\/subcategories\/.*\/edit/, { timeout: 10000 });
    } else {
      console.log('Nenhuma subcategoria disponÃ­vel para testar ediÃ§Ã£o');
    }
  });
});
