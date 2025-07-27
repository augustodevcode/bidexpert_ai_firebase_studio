// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { getAuctions } from '@/app/admin/auctions/actions';

test.describe('Homepage Smoke Test', () => {
    
  console.log(`
    ================================================================
    [E2E TEST PLAN - Homepage Smoke Test]
    ================================================================
    
    Este teste valida que a página inicial carrega corretamente e
    exibe suas seções principais.
    
    CRITÉRIOS DE ACEITE A SEREM VERIFICADOS:
    
    1.  **Carregamento da Página**: A página inicial deve carregar sem erros fatais.
    2.  **Título Principal**: O título/logo principal do site ("BidExpert") deve estar visível no header.
    3.  **Seção de Lotes**: Uma seção de lotes deve ser renderizada.
    4.  **Seção de Leilões**: Uma seção de leilões deve ser renderizada.
    
    ================================================================
    `);

  test.beforeEach(async ({ page }) => {
    // This script runs in the browser context, before the page loads.
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Now, navigate to the page. The init script will run before any of the page's scripts.
    console.log('[Homepage Test] Navigating to homepage...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const pageTitle = await page.title();
    console.log(`[Homepage Test] Page loaded. URL: ${page.url()}, Title: "${pageTitle}"`);
    await expect(page).toHaveTitle(/BidExpert/);
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    const title = page.locator('header').getByRole('link', { name: /BidExpert/i }).first();
    await expect(title).toBeVisible({ timeout: 20000 });
    console.log('- Verified: Homepage main title is visible.');
    await page.screenshot({ path: 'test-results/homepage-loaded.png' });
  });
  
  test('should display featured lots or recent lots section', async ({ page }) => {
    const lotsSectionTitle = page.locator('h2').filter({ 
      hasText: /lotes.*(destaque|recentes)/i 
    }).first();
    
    await expect(lotsSectionTitle).toBeVisible({ timeout: 20000 });
    console.log('- Verified: Lots section title is visible.');
  
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="lot-card-"]').first();
    await expect(firstLotCard).toBeVisible({ timeout: 10000 });
    console.log('- Verified: At least one lot card is visible.');
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    const auctionsSectionTitle = page.locator('h2').filter({ 
      hasText: /leilões.*(destaque|recentes)/i 
    }).first();
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 20000 });
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('[data-ai-id^="auction-card-"]').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 10000 });
    console.log('- Verified: At least one auction card is visible.');
  });

});
