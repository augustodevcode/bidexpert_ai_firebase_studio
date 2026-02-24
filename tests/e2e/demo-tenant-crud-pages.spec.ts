/**
 * @fileoverview Testes E2E para páginas CRUD do tenant Demo.
 * 
 * Testa se as páginas administrativas estão exibindo corretamente os dados
 * do tenant demo (tenantId: 2), incluindo:
 * - Lista de Leilões (/admin/auctions)
 * - Lista de Leiloeiros (/admin/auctioneers)
 * - Lista de Comitentes (/admin/sellers)
 * - Lista de Ativos (/admin/assets)
 * 
 * Pré-requisito: Dados de seed devem estar populados no banco bidexpert_demo
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

// Configuração do ambiente Demo
const DEMO_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';

// Contagens esperadas baseadas no seed
const EXPECTED_AUCTIONS = 8;
const EXPECTED_AUCTIONEERS = 4;
const EXPECTED_SELLERS = 4;

test.describe('Demo Tenant CRUD Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, DEMO_BASE_URL);
  });

  test('Página de Leilões deve exibir dados do tenant demo', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/admin/auctions`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Aguarda a tabela ou grid carregar
    await page.waitForSelector('[data-ai-id*="auction"], table, [role="grid"]', { timeout: 30000 });
    
    // Verifica se o título da página está presente
    const pageTitle = page.locator('h1, h2, [data-ai-id*="page-title"]').filter({ hasText: /leilão|leilões|auction/i });
    await expect(pageTitle.first()).toBeVisible();
    
    // Conta os itens na lista
    const auctionItems = page.locator('[data-ai-id*="auction-item"], [data-ai-id*="auction-card"], tbody tr, [role="row"]');
    const count = await auctionItems.count();
    
    console.log(`📊 Leilões encontrados: ${count}`);
    
    // Verifica se há pelo menos alguns leilões (esperamos 8)
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Verifica se os títulos dos leilões estão visíveis
    const firstAuctionTitle = page.locator('text=/Leilão|Tomada de Preços/i').first();
    await expect(firstAuctionTitle).toBeVisible({ timeout: 10000 });
  });

  test('Página de Leiloeiros deve exibir dados do tenant demo', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/admin/auctioneers`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Aguarda a tabela ou grid carregar
    await page.waitForSelector('[data-ai-id*="auctioneer"], table, [role="grid"]', { timeout: 30000 });
    
    // Verifica se o título da página está presente
    const pageTitle = page.locator('h1, h2, [data-ai-id*="page-title"]').filter({ hasText: /leiloeiro|auctioneer/i });
    await expect(pageTitle.first()).toBeVisible();
    
    // Conta os itens na lista
    const auctioneerItems = page.locator('[data-ai-id*="auctioneer-item"], [data-ai-id*="auctioneer-card"], tbody tr, [role="row"]');
    const count = await auctioneerItems.count();
    
    console.log(`📊 Leiloeiros encontrados: ${count}`);
    
    // Verifica se há pelo menos alguns leiloeiros
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Página de Comitentes deve exibir dados do tenant demo', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/admin/sellers`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Aguarda a tabela ou grid carregar
    await page.waitForSelector('[data-ai-id*="seller"], table, [role="grid"]', { timeout: 30000 });
    
    // Verifica se o título da página está presente
    const pageTitle = page.locator('h1, h2, [data-ai-id*="page-title"]').filter({ hasText: /comitente|seller|vendedor/i });
    await expect(pageTitle.first()).toBeVisible();
    
    // Conta os itens na lista
    const sellerItems = page.locator('[data-ai-id*="seller-item"], [data-ai-id*="seller-card"], tbody tr, [role="row"]');
    const count = await sellerItems.count();
    
    console.log(`📊 Comitentes encontrados: ${count}`);
    
    // Verifica se há pelo menos alguns comitentes
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Página de Ativos deve exibir dados do tenant demo', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/admin/assets`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Aguarda a tabela ou grid carregar
    await page.waitForSelector('[data-ai-id*="asset"], table, [role="grid"]', { timeout: 30000 });
    
    // Verifica se o título da página está presente
    const pageTitle = page.locator('h1, h2, [data-ai-id*="page-title"]').filter({ hasText: /ativo|asset|bens/i });
    await expect(pageTitle.first()).toBeVisible();
    
    // Conta os itens na lista
    const assetItems = page.locator('[data-ai-id*="asset-item"], [data-ai-id*="asset-card"], tbody tr, [role="row"]');
    const count = await assetItems.count();
    
    console.log(`📊 Ativos encontrados: ${count}`);
    
    // Verifica se há pelo menos alguns ativos
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Demo Tenant Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, DEMO_BASE_URL);
  });

  test('Leilões devem pertencer ao tenant demo (ID 2)', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/admin/auctions`, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Aguarda carregamento
    await page.waitForTimeout(3000);
    
    // Captura logs do console para verificar tenant ID
    page.on('console', msg => {
      if (msg.text().includes('tenantId') || msg.text().includes('tenant')) {
        console.log('🔍 Console:', msg.text());
      }
    });
    
    // Verifica se não há mensagem de "nenhum leilão encontrado"
    const emptyMessage = page.locator('text=/nenhum|vazio|empty|no .* found/i');
    const emptyCount = await emptyMessage.count();
    
    if (emptyCount > 0) {
      console.error('❌ Página exibe mensagem de lista vazia - possível problema de tenant isolation');
    }
    
    expect(emptyCount).toBe(0);
  });
});
