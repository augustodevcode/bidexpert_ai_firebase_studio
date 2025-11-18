/**
 * Testes E2E para funcionalidade de impersonação de advogado por administrador.
 * Valida que administradores podem visualizar painéis de advogados.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@12345';

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
  const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');

  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click();

  await page.waitForLoadState('networkidle');
}

test.describe('Admin - Impersonação de Advogado', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin pode acessar o painel do advogado', async ({ page }) => {
    await page.goto(`${BASE_URL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('lawyer-dashboard-title')).toHaveText(/Painel Jurídico/i);
  });

  test('exibe seletor de impersonação para administradores', async ({ page }) => {
    await page.goto(`${BASE_URL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    
    // Verifica se o seletor de impersonação está visível
    const impersonationSelector = page.getByTestId('lawyer-impersonation-selector');
    await expect(impersonationSelector).toBeVisible({ timeout: 10_000 });
    
    // Verifica se tem o badge de Admin
    await expect(impersonationSelector).toContainText(/Admin/i);
  });

  test('admin pode selecionar um advogado para visualizar seu painel', async ({ page }) => {
    await page.goto(`${BASE_URL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    
    // Abre o seletor
    const selectTrigger = page.getByTestId('lawyer-select-trigger');
    await expect(selectTrigger).toBeVisible({ timeout: 10_000 });
    await selectTrigger.click();
    
    // Aguarda as opções aparecerem
    await page.waitForTimeout(1000);
    
    // Verifica se existe a opção "Meu próprio painel"
    const selfOption = page.getByTestId('lawyer-option-self');
    await expect(selfOption).toBeVisible({ timeout: 5_000 });
    
    // Verifica se existem outras opções de advogados
    // (assumindo que existem advogados no banco de dados de teste)
    const lawyerOptions = page.locator('[data-testid^="lawyer-option-"]').filter({ hasNot: page.getByTestId('lawyer-option-self') });
    const optionCount = await lawyerOptions.count();
    
    if (optionCount > 0) {
      // Seleciona o primeiro advogado da lista
      await lawyerOptions.first().click();
      
      // Aguarda a atualização do painel
      await page.waitForLoadState('networkidle');
      
      // Verifica se o painel ainda está visível
      await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible();
      
      // Verifica se há indicação de que está visualizando como admin
      await expect(page.getByText(/você está visualizando o painel como administrador/i)).toBeVisible({ timeout: 5_000 });
    }
  });

  test('admin pode voltar para seu próprio painel', async ({ page }) => {
    await page.goto(`${BASE_URL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    
    // Abre o seletor e seleciona um advogado (se houver)
    const selectTrigger = page.getByTestId('lawyer-select-trigger');
    await selectTrigger.click();
    await page.waitForTimeout(1000);
    
    const lawyerOptions = page.locator('[data-testid^="lawyer-option-"]').filter({ hasNot: page.getByTestId('lawyer-option-self') });
    const optionCount = await lawyerOptions.count();
    
    if (optionCount > 0) {
      await lawyerOptions.first().click();
      await page.waitForLoadState('networkidle');
      
      // Volta para o próprio painel
      await selectTrigger.click();
      await page.waitForTimeout(1000);
      
      const selfOption = page.getByTestId('lawyer-option-self');
      await selfOption.click();
      await page.waitForLoadState('networkidle');
      
      // Verifica que não está mais no modo de visualização
      await expect(page.getByText(/você está visualizando o painel como administrador/i)).not.toBeVisible();
    }
  });

  test('painel carrega métricas ao impersonar advogado', async ({ page }) => {
    await page.goto(`${BASE_URL}/lawyer/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    
    // Verifica se as métricas estão visíveis
    const metrics = [
      'lawyer-metric-active-cases',
      'lawyer-metric-hearings-week',
      'lawyer-metric-documents-pending',
      'lawyer-metric-portfolio-value',
    ];

    for (const testId of metrics) {
      const card = page.getByTestId(testId);
      await expect(card).toBeVisible();
    }
  });
});

test.describe('Admin - Permissões de Impersonação', () => {
  test('usuário não-admin não vê seletor de impersonação', async ({ page }) => {
    // Login como advogado regular
    const LAWYER_EMAIL = 'advogado@bidexpert.com.br';
    const LAWYER_PASSWORD = 'Test@12345';
    
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');
    
    await emailInput.fill(LAWYER_EMAIL);
    await passwordInput.fill(LAWYER_PASSWORD);
    await submitButton.click();
    
    await page.waitForURL(/\/lawyer\/dashboard/i, { timeout: 60_000 });
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
    
    // Verifica que o seletor de impersonação NÃO está visível
    await expect(page.getByTestId('lawyer-impersonation-selector')).not.toBeVisible();
  });
});
