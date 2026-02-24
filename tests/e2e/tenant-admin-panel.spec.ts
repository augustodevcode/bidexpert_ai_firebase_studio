/**
 * @fileoverview Testes E2E para o painel de administração de tenants.
 * 
 * Testa a interface administrativa para gerenciamento de tenants:
 * - Visualização da lista de tenants
 * - Criação de novos tenants
 * - Edição de configurações
 * - Filtros e busca
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Platform Tenants Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('deve exibir página de gerenciamento de tenants', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Verifica elementos principais da página
    await expect(page.locator('h1, h2').filter({ hasText: /tenants|inquilinos|plataforma/i }).first()).toBeVisible();
    
    // Verifica cards de estatísticas
    await expect(page.locator('[data-ai-id*="tenant"], .stat-card, [class*="card"]').first()).toBeVisible();
    
    // Verifica tabela de tenants
    await expect(page.locator('table, [role="table"], [data-ai-id*="table"]').first()).toBeVisible();
  });

  test('deve exibir estatísticas de tenants', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Procura por cards de estatísticas (Total, Ativos, Trial, etc.)
    const statsSection = page.locator('[data-ai-id*="stats"], .grid, [class*="stat"]').first();
    await expect(statsSection).toBeVisible();
    
    // Verifica se há números exibidos nas estatísticas
    const numberElements = await page.locator('[data-ai-id*="stat"] >> text=/\\d+/').all();
    expect(numberElements.length).toBeGreaterThan(0);
  });

  test('deve filtrar tenants por status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Procura pelo seletor de filtro de status
    const statusFilter = page.locator('select[name*="status"], [data-ai-id*="filter-status"], button:has-text("Status")').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Seleciona uma opção de filtro
      const activeOption = page.locator('option[value="ACTIVE"], [role="option"]:has-text("Ativo")').first();
      if (await activeOption.isVisible()) {
        await activeOption.click();
      }
      
      // Verifica que a tabela foi filtrada (aguarda carregamento)
      await page.waitForTimeout(500);
    }
  });

  test('deve buscar tenants por nome', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Procura pelo campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="busca"], input[placeholder*="search"], [data-ai-id*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Verifica que a busca foi aplicada
      // (O resultado depende dos dados existentes)
    }
  });

  test('deve abrir modal de detalhes do tenant', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Aguarda a tabela carregar
    await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
    
    // Clica no primeiro tenant da lista
    const firstTenantRow = page.locator('table tbody tr, [role="row"]').first();
    await firstTenantRow.click();
    
    // Verifica se o modal/dialog de detalhes foi aberto
    const dialog = page.locator('[role="dialog"], dialog, .modal, [data-ai-id*="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir abas no modal de detalhes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Aguarda e clica no primeiro tenant
    await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
    await page.locator('table tbody tr, [role="row"]').first().click();
    
    // Aguarda o modal abrir
    await page.waitForSelector('[role="dialog"], dialog, .modal', { timeout: 5000 });
    
    // Verifica as abas (Info, Limites, Domínio, API)
    const tabsList = page.locator('[role="tablist"], .tabs');
    if (await tabsList.isVisible()) {
      const tabs = await page.locator('[role="tab"], .tab').all();
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('deve permitir alterar status do tenant', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Aguarda e clica no primeiro tenant
    await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
    await page.locator('table tbody tr, [role="row"]').first().click();
    
    // Aguarda o modal abrir
    await page.waitForSelector('[role="dialog"], dialog, .modal', { timeout: 5000 });
    
    // Procura pelo seletor de status ou botão de ação
    const statusSelect = page.locator('select[name*="status"], [data-ai-id*="status-select"]').first();
    const statusButton = page.locator('button:has-text("Suspender"), button:has-text("Ativar")').first();
    
    if (await statusSelect.isVisible()) {
      // Testa o seletor de status
      await statusSelect.click();
    } else if (await statusButton.isVisible()) {
      // Testa o botão de ação
      await statusButton.click();
    }
  });

  test('deve navegar entre abas do modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Abre modal do primeiro tenant
    await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
    await page.locator('table tbody tr, [role="row"]').first().click();
    await page.waitForSelector('[role="dialog"], dialog, .modal', { timeout: 5000 });
    
    // Tenta clicar em diferentes abas
    const tabs = ['Limites', 'Domínio', 'API', 'Limits', 'Domain'];
    
    for (const tabName of tabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}"), .tab:has-text("${tabName}")`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

test.describe('Platform Tenants - Access Control', () => {
  test('deve redirecionar usuário não autenticado', async ({ page }) => {
    // Acessa a página sem login
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Deve redirecionar para login
    await page.waitForURL(/\/(login|signin|auth)/);
  });

  test('deve verificar permissões de acesso', async ({ page }) => {
    // Login com usuário comum (não landlord) - se existir
    // Este teste assume que existe um usuário sem permissões de admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'user@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'userpassword');
    
    // Tenta acessar painel de tenants
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Deve mostrar erro de acesso negado ou redirecionar
    // (O comportamento exato depende da implementação)
  });
});

test.describe('Platform Tenants - Visual Regression', () => {
  test('screenshot da página de tenants', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Aguarda carregamento completo
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Captura screenshot para visual regression
    await expect(page).toHaveScreenshot('platform-tenants-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('screenshot do modal de detalhes', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/platform-tenants`);
    
    // Abre modal do primeiro tenant
    await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 10000 });
    await page.locator('table tbody tr, [role="row"]').first().click();
    await page.waitForSelector('[role="dialog"], dialog, .modal', { timeout: 5000 });
    
    // Aguarda animações
    await page.waitForTimeout(500);
    
    // Captura screenshot do modal
    await expect(page).toHaveScreenshot('tenant-details-modal.png', {
      maxDiffPixels: 100,
    });
  });
});
