// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

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
    3.  **Seção de Lotes**: A seção "Lotes em Destaque" ou "Lotes Recentes" deve ser renderizada.
    4.  **Seção de Leilões**: A seção "Leilões em Destaque" ou "Leilões Recentes" deve ser renderizada.
    
    ================================================================
    `);

  test.beforeEach(async ({ page }) => {
    // This script runs in the browser context, before the page loads.
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Now, navigate to the page. The init script will run before any of the page's scripts.
    await page.goto('/');
    console.log('[Homepage Test] Navigated to homepage.');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    const title = page.locator('header').getByRole('link', { name: /BidExpert/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Homepage main title is visible.');
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    const lotsSectionTitle = page.getByRole('heading', { name: 'Lotes em Destaque' }).or(page.getByRole('heading', { name: 'Lotes Recentes' }));
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Lots section title is visible.');
  
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstLotCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one lot card is visible.');
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    const auctionsSectionTitle = page.getByRole('heading', { name: 'Leilões em Destaque' }).or(page.getByRole('heading', { name: 'Leilões Recentes' }));
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 15000 });
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one auction card is visible.');
  });

});
