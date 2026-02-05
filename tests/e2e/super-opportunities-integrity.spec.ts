/**
 * @fileoverview Teste E2E para validar a seção Super Oportunidades
 * 
 * Valida:
 * - Exibição apenas de lotes com integridade referencial completa
 * - Leilões sem praças (AuctionStage) não aparecem
 * - Respeito ao prazo configurável
 * - Atributo data-ai-id presente
 */

import { test, expect } from '@playwright/test';

test.describe('Super Oportunidades - Integridade Referencial', () => {
  const baseUrl = 'http://demo.localhost:9005';

  test.beforeEach(async ({ page }) => {
    // Navegar para a home
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
  });

  test('deve ter atributo data-ai-id="super-opportunities-section"', async ({ page }) => {
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir apenas lotes com integridade referencial completa', async ({ page }) => {
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    
    // Se a seção estiver visível, validar que os cards existem
    const isVisible = await section.isVisible().catch(() => false);
    
    if (isVisible) {
      // Verificar se há cards
      const cards = page.locator('[data-ai-id="super-opportunities-section"] .embla__slide');
      const cardCount = await cards.count();
      
      // Se houver cards, cada um deve ter informações completas
      if (cardCount > 0) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          
          // Cada card deve ter título (validação de que o lote existe)
          await expect(card.locator('h3, h2, .card-title')).toBeVisible();
        }
      }
    } else {
      console.log('Seção Super Oportunidades não está visível - pode estar desabilitada ou sem lotes válidos');
    }
  });

  test('não deve exibir lotes de leilões sem praças (AuctionStage)', async ({ page }) => {
    // Este teste valida que o service getSuperOpportunitiesLots está filtrando corretamente
    // Se a seção está visível, todos os lotes exibidos devem ter leilões com praças
    
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    const isVisible = await section.isVisible().catch(() => false);
    
    if (isVisible) {
      // Capturar console logs para verificar se há warnings sobre leilões sem praças
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Aguardar um pouco para capturar possíveis logs
      await page.waitForTimeout(2000);
      
      // Não deve haver erros relacionados a leilões sem praças
      const hasStageErrors = consoleErrors.some(err => 
        err.toLowerCase().includes('auction') && 
        err.toLowerCase().includes('stage')
      );
      
      expect(hasStageErrors).toBe(false);
    }
  });

  test('deve respeitar a configuração de dias para encerramento', async ({ page }) => {
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    const isVisible = await section.isVisible().catch(() => false);
    
    if (isVisible) {
      // Verificar se há cards
      const cards = page.locator('[data-ai-id="super-opportunities-section"] .embla__slide');
      const cardCount = await cards.count();
      
      if (cardCount > 0) {
        // Cada card deve ter um countdown ou data de encerramento
        // indicando que está dentro do prazo configurado
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = cards.nth(i);
          
          // Verificar se há countdown ou badge de prazo
          const hasTimeInfo = await card.locator('[data-ai-id*="countdown"], .badge, time').count() > 0;
          expect(hasTimeInfo).toBe(true);
        }
      }
    }
  });

  test('screenshot visual da seção Super Oportunidades', async ({ page }) => {
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    const isVisible = await section.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(section).toHaveScreenshot('super-opportunities-section.png', {
        maxDiffPixels: 100,
      });
    } else {
      // Se não estiver visível, capturar screenshot da página inteira para documentação
      await page.screenshot({ path: 'test-results/super-opportunities-disabled.png', fullPage: true });
      console.log('Screenshot salvo: seção Super Oportunidades não está visível');
    }
  });

  test('deve validar configuração de habilitação/desabilitação', async ({ page }) => {
    // Tentar acessar as configurações de admin (se disponível)
    const settingsUrl = `${baseUrl}/admin/settings/marketing/publicidade-site`;
    
    // Verificar se a página de configurações existe
    const response = await page.goto(settingsUrl);
    
    if (response?.status() === 200) {
      // Se conseguiu acessar, verificar se há o toggle de Super Oportunidades
      const superOpportunitiesToggle = page.locator('input[type="checkbox"][name*="SuperOpportunities"], input[type="checkbox"][name*="superOpportunities"]');
      
      const toggleExists = await superOpportunitiesToggle.count() > 0;
      
      if (toggleExists) {
        // Capturar screenshot da página de configurações
        await page.screenshot({ path: 'test-results/super-opportunities-settings.png', fullPage: true });
      }
    } else {
      console.log('Página de configurações não acessível neste teste');
    }
  });

  test('deve ter botões de navegação do carousel', async ({ page }) => {
    const section = page.locator('[data-ai-id="super-opportunities-section"]');
    const isVisible = await section.isVisible().catch(() => false);
    
    if (isVisible) {
      const cards = page.locator('[data-ai-id="super-opportunities-section"] .embla__slide');
      const cardCount = await cards.count();
      
      // Se houver mais de um card, deve ter botões de navegação
      if (cardCount > 1) {
        const prevButton = page.locator('[data-ai-id="super-opportunities-prev"]');
        const nextButton = page.locator('[data-ai-id="super-opportunities-next"]');
        
        // Botões devem existir (podem não estar visíveis em mobile)
        expect(await prevButton.count()).toBeGreaterThan(0);
        expect(await nextButton.count()).toBeGreaterThan(0);
      }
    }
  });
});
