// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {
    
  console.log(`
    ================================================================
    [E2E TEST PLAN - Homepage Smoke Test]
    ================================================================
    
    Este teste valida que a página inicial carrega corretamente e
    exibe suas seções principais com dados.
    
    CRITÉRIOS DE ACEITE A SEREM VERIFICADOS:
    
    1.  **Carregamento da Página**: A página inicial deve carregar sem erros de console.
    2.  **Título Principal**: O título/logo principal do site ("BidExpert") deve estar visível.
    3.  **Seção de Lotes**: A seção "Lotes em Destaque" ou "Lotes Recentes" deve ser renderizada e conter cards.
    4.  **Seção de Leilões**: A seção "Leilões em Destaque" ou "Leilões Recentes" deve ser renderizada e conter cards.
    
    ================================================================
    `);

  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo para não haver redirecionamento
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Navega para a página inicial
    await page.goto('/');
    console.log('[Homepage Test] Navigated to homepage.');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    const title = page.locator('header').getByRole('link', { name: /BidExpert/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Homepage main title is visible.');
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    // Espera pelo título da seção de lotes
    const lotsSectionTitle = page.getByRole('heading', { name: /Lotes em Destaque/i }).or(page.getByRole('heading', { name: /Lotes Recentes/i }));
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Lots section title is visible.');
  
    // Verifica se existe pelo menos um card de lote visível dentro da seção
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="lot-card-"]').first();
    await expect(firstLotCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one lot card is visible.');
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    // Espera pelo título da seção de leilões
    const auctionsSectionTitle = page.getByRole('heading', { name: /Leilões em Destaque/i }).or(page.getByRole('heading', { name: /Leilões Recentes/i }));
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 15000 });
    
    // Verifica se existe pelo menos um card de leilão visível
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="auction-card-"]').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one auction card is visible.');
  });

});
