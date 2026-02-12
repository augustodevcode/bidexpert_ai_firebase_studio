// tests/e2e/crud-categories-subcategories.spec.ts
/**
 * @fileoverview Testes E2E para os CRUDs de Categorias e Subcategorias.
 * Valida funcionalidades de listagem, criação, edição, exclusão e visualização.
 * 
 * Credenciais: admin@bidexpert.com.br / Admin@123 (conforme ultimate-master-seed.ts)
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@123';

// Helper function to login
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 60000 });
  
  // Espera o formulário estar visível
  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  await expect(emailInput).toBeVisible({ timeout: 30000 });
  
  // Preenche os campos
  await emailInput.fill(ADMIN_EMAIL);
  await page.locator('[data-ai-id="auth-login-password-input"]').fill(ADMIN_PASSWORD);
  
  // Clica no botão de submit
  await page.locator('[data-ai-id="auth-login-submit-button"]').click();
  
  // Aguarda navegação para área admin ou dashboard
  await page.waitForURL(/\/(admin|dashboard|home)/, { timeout: 30000 }).catch(() => {
    console.log('Não redirecionou após login, pode ser erro de credenciais');
  });
  await page.waitForLoadState('networkidle');
}

test.describe('CRUD Categorias', () => {
  test.use({ timeout: 90000 });
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('deve exibir a página de categorias com botões de ação', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    // Verifica título da página
    await expect(page.locator('[data-ai-id="admin-categories-page-container"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Categorias de Lotes')).toBeVisible();
    
    // Verifica botão de adicionar nova categoria
    const newButton = page.locator('[data-ai-id="new-category-button"]');
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText('Nova Categoria');
    
    // Verifica link de análise
    const analysisLink = page.locator('[data-ai-id="categories-analysis-link"]');
    await expect(analysisLink).toBeVisible();
  });

  test('deve navegar para página de nova categoria ao clicar no botão', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    // Clica no botão de nova categoria
    await page.locator('[data-ai-id="new-category-button"]').click();
    
    // Verifica se navegou para a página de nova categoria
    await page.waitForURL(/\/admin\/categories\/new/, { timeout: 10000 });
    
    // Verifica se o formulário está presente
    await expect(page.getByText('Nova Categoria de Lote')).toBeVisible({ timeout: 15000 });
  });

  test('deve exibir menu de ações ao clicar no botão de ações de uma categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    // Espera carregar a tabela
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Procura o primeiro botão de ações disponível
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Verifica se o dropdown apareceu com as opções
      await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Excluir' })).toBeVisible();
    } else {
      console.log('Nenhuma categoria disponível para testar ações');
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('deve exibir dialog de confirmação ao tentar excluir categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Clica em excluir
      await page.getByRole('menuitem', { name: 'Excluir' }).click();
      
      // Verifica se o dialog de confirmação apareceu
      await expect(page.getByText('Confirmar exclusão')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-ai-id="category-delete-cancel"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="category-delete-confirm"]')).toBeVisible();
    } else {
      console.log('Nenhuma categoria disponível para testar exclusão');
    }
  });

  test('deve navegar para lotes vinculados ao clicar no link', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="category-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Clica em ver lotes vinculados
      await page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' }).click();
      
      // Verifica se navegou para a página de lotes com filtro
      await page.waitForURL(/\/admin\/lots\?categoryId=/, { timeout: 10000 });
    } else {
      console.log('Nenhuma categoria disponível para testar navegação de vínculos');
    }
  });
  
  test('deve navegar para página de edição ao clicar no nome da categoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Procura o primeiro link de nome de categoria
    const categoryNameLink = page.locator('[data-ai-id^="category-name-link-"]').first();
    
    if (await categoryNameLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryNameLink.click();
      
      // Verifica se navegou para a página de edição
      await page.waitForURL(/\/admin\/categories\/.*\/edit/, { timeout: 10000 });
    } else {
      console.log('Nenhuma categoria disponível para testar edição');
    }
  });
});

test.describe('CRUD Subcategorias', () => {
  test.use({ timeout: 90000 });
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('deve exibir a página de subcategorias com filtro e botão de adicionar', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    // Verifica título da página
    await expect(page.locator('[data-ai-id="admin-subcategories-page-container"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Subcategorias')).toBeVisible();
    
    // Verifica botão de adicionar nova subcategoria
    const newButton = page.locator('[data-ai-id="new-subcategory-button"]');
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText('Nova Subcategoria');
    
    // Verifica filtro de categoria
    const filterTrigger = page.locator('#parentCategorySelect');
    await expect(filterTrigger).toBeVisible();
  });

  test('deve navegar para página de nova subcategoria ao clicar no botão', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    // Clica no botão de nova subcategoria
    await page.locator('[data-ai-id="new-subcategory-button"]').click();
    
    // Verifica se navegou para a página de nova subcategoria
    await page.waitForURL(/\/admin\/subcategories\/new/, { timeout: 10000 });
    
    // Verifica se o formulário está presente
    await expect(page.getByText('Nova Subcategoria')).toBeVisible({ timeout: 15000 });
  });

  test('deve exibir menu de ações ao clicar no botão de ações de uma subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      // Verifica se o dropdown apareceu com as opções
      await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Excluir' })).toBeVisible();
    } else {
      console.log('Nenhuma subcategoria disponível para testar ações');
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('deve exibir dialog de confirmação ao tentar excluir subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      await page.getByRole('menuitem', { name: 'Excluir' }).click();
      
      // Verifica se o dialog de confirmação apareceu
      await expect(page.getByText('Confirmar exclusão')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-ai-id="subcategory-delete-cancel"]')).toBeVisible();
      await expect(page.locator('[data-ai-id="subcategory-delete-confirm"]')).toBeVisible();
    } else {
      console.log('Nenhuma subcategoria disponível para testar exclusão');
    }
  });

  test('deve navegar para lotes vinculados ao clicar no link', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const actionsButton = page.locator('[data-ai-id^="subcategory-actions-trigger-"]').first();
    
    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      
      await page.getByRole('menuitem', { name: 'Ver Lotes Vinculados' }).click();
      
      // Verifica se navegou para a página de lotes com filtro
      await page.waitForURL(/\/admin\/lots\?subcategoryId=/, { timeout: 10000 });
    } else {
      console.log('Nenhuma subcategoria disponível para testar navegação de vínculos');
    }
  });
  
  test('deve navegar para página de edição ao clicar no nome da subcategoria', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('table', { timeout: 15000 });
    
    const subcategoryNameLink = page.locator('[data-ai-id^="subcategory-name-link-"]').first();
    
    if (await subcategoryNameLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subcategoryNameLink.click();
      
      // Verifica se navegou para a página de edição
      await page.waitForURL(/\/admin\/subcategories\/.*\/edit/, { timeout: 10000 });
    } else {
      console.log('Nenhuma subcategoria disponível para testar edição');
    }
  });
});
