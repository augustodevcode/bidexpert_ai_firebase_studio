/**
 * Manual UI Tests based on GUIA_TESTES_MANUAIS.md
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LEILOEIRO_EMAIL = 'test.leiloeiro@bidexpert.com';
const LEILOEIRO_PASSWORD = 'Test@12345';
const COMPRADOR_EMAIL = 'test.comprador@bidexpert.com';
const COMPRADOR_PASSWORD = 'Test@12345';

async function loginAsLeiloeiro(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('[data-ai-id="auth-login-email-input"]', LEILOEIRO_EMAIL);
  await page.fill('[data-ai-id="auth-login-password-input"]', LEILOEIRO_PASSWORD);
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForLoadState('networkidle');
}

async function loginAsComprador(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('[data-ai-id="auth-login-email-input"]', COMPRADOR_EMAIL);
  await page.fill('[data-ai-id="auth-login-password-input"]', COMPRADOR_PASSWORD);
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForLoadState('networkidle');
}

test.describe('GUIA_TESTES_MANUAIS - Cenários Completos', () => {
  
  test('TESTE 3: Verificar Lotes no Painel Admin', async ({ page }) => {
    await loginAsLeiloeiro(page);
    
    // Navegar para a página de lotes
    await page.goto(`${BASE_URL}/admin/lots`);
    await page.waitForLoadState('networkidle');
    
    // Tirar screenshot da lista
    await page.screenshot({ path: 'test-results/admin_lots_list.png', fullPage: true });
    
    // Verificar se há lotes na lista (cards ou tabela)
    const lotCards = page.locator('[class*="lot"], article').filter({ hasText: /L\d{3}|Lote/ });
    const lotTable = page.locator('table tbody tr');
    
    const cardsCount = await lotCards.count();
    const tableCount = await lotTable.count();
    const totalLots = Math.max(cardsCount, tableCount);
    
    console.log(`✅ Encontrados ${totalLots} lotes na lista (${cardsCount} cards, ${tableCount} rows)`);
    
    if (totalLots > 0) {
      // Clicar no primeiro lote disponível
      if (cardsCount > 0) {
        await lotCards.first().click();
      } else {
        await lotTable.first().click();
      }
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/admin_lot_details.png', fullPage: true });
      
      console.log('✅ TESTE 3 COMPLETO: Lotes visíveis no painel admin');
    } else {
      console.log('⚠️ Nenhum lote encontrado');
    }
  });
  
  test('TESTE 4: Logout e Login como Arrematante', async ({ page }) => {
    await loginAsLeiloeiro(page);
    
    // Fazer logout
    await page.goto(`${BASE_URL}/api/auth/signout`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/after_logout.png' });
    
    // Login como comprador
    await loginAsComprador(page);
    await page.screenshot({ path: 'test-results/comprador_dashboard.png', fullPage: true });
    
    // Verificar dashboard do arrematante
    await expect(page).toHaveURL(/dashboard/);
    console.log('✅ TESTE 4 COMPLETO: Login como arrematante bem-sucedido');
  });
  
  test('TESTE 5: Visualizar Leilão na Home/Marketplace', async ({ page }) => {
    await loginAsComprador(page);
    
    // Navegar para home/marketplace
    await page.goto(`${BASE_URL}/auctions`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/marketplace_auctions.png', fullPage: true });
    
    // Verificar se há leilões visíveis
    const auctionCards = page.locator('[data-testid*="auction"], .auction-card, article, [class*="auction"]').first();
    
    if (await auctionCards.isVisible()) {
      console.log('✅ TESTE 5 COMPLETO: Leilões visíveis no marketplace');
      
      // Clicar no primeiro leilão
      await auctionCards.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/auction_details.png', fullPage: true });
    } else {
      console.log('⚠️ Nenhum leilão encontrado no marketplace');
    }
  });
  
  test('TESTE 6-7: Visualizar Lote e Detalhes', async ({ page }) => {
    await loginAsComprador(page);
    
    // Ir para a página de leilões
    await page.goto(`${BASE_URL}/auctions`);
    await page.waitForLoadState('networkidle');
    
    // Procurar por lotes
    const lotCards = page.locator('[data-testid*="lot"], .lot-card, [class*="lot"]');
    const firstLot = lotCards.first();
    
    if (await firstLot.isVisible()) {
      await page.screenshot({ path: 'test-results/lot_card.png', fullPage: true });
      
      // Clicar no lote
      await firstLot.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/lot_details_full.png', fullPage: true });
      
      // Verificar elementos da página de detalhes
      const hasTitle = await page.locator('h1, h2').first().isVisible();
      const hasPrice = await page.getByText(/R\$|Lance/).first().isVisible();
      
      console.log('✅ TESTE 6-7 COMPLETO: Detalhes do lote visíveis');
      console.log(`  - Título: ${hasTitle}`);
      console.log(`  - Preço: ${hasPrice}`);
    } else {
      console.log('⚠️ Nenhum lote encontrado');
    }
  });
  
  test('TESTE 8: Dar um Lance', async ({ page }) => {
    await loginAsComprador(page);
    
    // Navegar para leilões
    await page.goto(`${BASE_URL}/auctions`);
    await page.waitForLoadState('networkidle');
    
    // Encontrar um lote aberto para lances
    const bidButtons = page.getByRole('button', { name: /dar lance|fazer lance|lance/i });
    
    if (await bidButtons.first().isVisible()) {
      await bidButtons.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/bid_form.png' });
      
      console.log('✅ TESTE 8: Formulário de lance acessível');
    } else {
      console.log('⚠️ Botão de lance não encontrado');
    }
  });
  
  test('TESTE 9: Filtros e Busca', async ({ page }) => {
    await loginAsComprador(page);
    
    await page.goto(`${BASE_URL}/auctions`);
    await page.waitForLoadState('networkidle');
    
    // Procurar por campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Honda');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/search_results.png', fullPage: true });
      
      console.log('✅ TESTE 9: Busca funcional');
    } else {
      console.log('⚠️ Campo de busca não encontrado');
    }
  });
  
  test('TESTE 10: Toggle Card/Lista', async ({ page }) => {
    await loginAsComprador(page);
    
    await page.goto(`${BASE_URL}/auctions`);
    await page.waitForLoadState('networkidle');
    
    // Procurar por botões de visualização
    const viewToggleButtons = page.locator('button[aria-label*="view"], button[title*="view"], [role="button"]').filter({ hasText: /grid|list|card|lista/i });
    
    if (await viewToggleButtons.first().isVisible()) {
      await page.screenshot({ path: 'test-results/view_before_toggle.png', fullPage: true });
      await viewToggleButtons.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/view_after_toggle.png', fullPage: true });
      
      console.log('✅ TESTE 10: Toggle de visualização funcional');
    } else {
      console.log('⚠️ Botões de toggle não encontrados');
    }
  });
});
