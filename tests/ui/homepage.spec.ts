// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {
    
  test.beforeEach(async ({ page }) => {
    // Garante que o setup seja considerado completo para não haver redirecionamento
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Navega para a página inicial
    await page.goto('/');
    // Aguarda até que a rede esteja ociosa, indicando que o carregamento principal terminou
    await page.waitForLoadState('networkidle');
  });

  test('Cenário Smoke: should load the homepage and display the main title', async ({ page }) => {
    // Aumentar o timeout para este expect específico para dar tempo para a renderização inicial
    await expect(page.locator('header').getByRole('link', { name: /BidExpert/i }).first()).toBeVisible({ timeout: 20000 });
    console.log('- Verified: Homepage main title is visible.');
  });

  test('Cenário Smoke: should display featured lots or recent lots section', async ({ page }) => {
    // Espera pelo título da seção de lotes
    const lotsSectionTitle = page.getByRole('heading', { name: /Lotes em Destaque/i }).or(page.getByRole('heading', { name: /Lotes Recentes/i }));
    await expect(lotsSectionTitle).toBeVisible({ timeout: 20000 });
    console.log('- Verified: Lots section title is visible.');
  
    // Verifica se existe pelo menos um card de lote visível dentro da seção
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="lot-card-"]').first();
    await expect(firstLotCard).toBeVisible({ timeout: 10000 });
    console.log('- Verified: At least one lot card is visible.');
  });
  
  test('Cenário Smoke: should display featured auctions or recent auctions section', async ({ page }) => {
    // Espera pelo título da seção de leilões
    const auctionsSectionTitle = page.getByRole('heading', { name: /Leilões em Destaque/i }).or(page.getByRole('heading', { name: /Leilões Recentes/i }));
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 20000 });
    
    // Verifica se existe pelo menos um card de leilão visível
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="auction-card-"]').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 10000 });
    console.log('- Verified: At least one auction card is visible.');
  });
});
