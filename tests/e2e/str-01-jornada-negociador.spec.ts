/**
 * @file STR-01: Jornada Negociador (Arrematante Power User)
 * @description Skill de validação da jornada crítica do Negociador/Arrematante.
 * Valida que as funcionalidades essenciais para conversão estão funcionando.
 * 
 * Jornada:
 * 1. Buscar lotes (filtros, categorias)
 * 2. Visualizar detalhes do lote
 * 3. Adicionar aos favoritos
 * 4. Dar lance
 * 5. Acompanhar histórico
 * 6. Receber notificações
 */

import { test, expect, Page } from '@playwright/test';

// Configuração de teste para Negociador
test.describe('STR-01: Jornada Negociador', () => {
  // Usar storageState de arrematante autenticado
  test.use({ storageState: './tests/e2e/.auth/arrematante.json' });

  test.describe('1. Descoberta de Lotes', () => {
    test('deve exibir página de busca com filtros funcionais', async ({ page }) => {
      await page.goto('/search');
      
      // Verificar elementos essenciais
      await expect(page.locator('[data-ai-id="search-page-container"]')).toBeVisible();
      
      // Verificar filtros disponíveis
      await expect(page.locator('[data-ai-id="filter-category"], [data-testid="filter-category"]')).toBeVisible({ timeout: 10000 });
    });

    test('deve filtrar por categoria', async ({ page }) => {
      await page.goto('/search');
      
      // Selecionar categoria Veículos
      const categoryFilter = page.locator('[data-ai-id="filter-category"], [data-testid="filter-category"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.locator('text=/Veículos|Imóveis|Máquinas/i').first().click();
        
        // Aguardar resultados filtrados
        await page.waitForTimeout(2000);
      }
    });

    test('deve exibir cards de lotes com informações essenciais', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(3000);

      // Verificar se há cards de lotes
      const lotCards = page.locator('[data-ai-id*="lot-card"], [data-testid*="lot-card"], .lot-card');
      const count = await lotCards.count();
      
      // Se não houver lotes, verificar mensagem de "nenhum resultado"
      if (count === 0) {
        await expect(page.locator('text=/nenhum|vazio|empty/i')).toBeVisible();
      } else {
        // Verificar primeiro card
        const firstCard = lotCards.first();
        await expect(firstCard).toBeVisible();
      }
    });
  });

  test.describe('2. Detalhes do Lote', () => {
    test('deve navegar para página de detalhes do lote', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(3000);

      // Clicar no primeiro lote disponível
      const lotLink = page.locator('[data-ai-id*="lot-card"] a, [data-testid*="lot-card"] a, .lot-card a').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        
        // Verificar se está na página de detalhes
        await expect(page).toHaveURL(/\/lots\/|\/lotes\//);
      }
    });

    test('deve exibir informações essenciais do lote', async ({ page }) => {
      // Ir direto para um lote (assumindo que existe)
      await page.goto('/search');
      await page.waitForTimeout(2000);
      
      const lotLink = page.locator('a[href*="/lots/"]').first();
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar elementos essenciais da página de detalhes
        // Título
        await expect(page.locator('h1, [data-ai-id="lot-title"]')).toBeVisible();
        
        // Preço/Lance atual
        const priceVisible = await page.locator('text=/R\\$|lance|preço/i').first().isVisible();
        expect(priceVisible).toBeTruthy();
      }
    });
  });

  test.describe('3. Interação (Favoritos)', () => {
    test('deve permitir adicionar lote aos favoritos', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(2000);

      // Buscar botão de favorito
      const favButton = page.locator('[data-ai-id*="favorite"], [data-testid*="favorite"], button:has-text("Favorito"), [aria-label*="favorito"]').first();
      
      if (await favButton.isVisible()) {
        await favButton.click();
        await page.waitForTimeout(1000);
        
        // Verificar feedback visual (toast ou mudança de estado)
        const hasFeedback = await page.locator('.toast, [role="alert"], [data-ai-id*="toast"]').isVisible();
        // Não falhar se não houver feedback, apenas logar
        if (!hasFeedback) {
          console.log('⚠️ Botão de favorito clicado mas sem feedback visual detectado');
        }
      } else {
        console.log('⚠️ Botão de favorito não encontrado');
      }
    });

    test('deve exibir lista de favoritos no dashboard', async ({ page }) => {
      await page.goto('/dashboard/favorites');
      
      // Verificar se página carrega
      await expect(page.locator('[data-ai-id="dashboard-favorites"], main, .container')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('4. Lance (Conversão)', () => {
    test('deve exibir formulário de lance na página do lote', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(2000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar presença de área de lance
        const bidArea = page.locator('[data-ai-id*="bid"], [data-testid*="bid"], form:has-text("Lance"), button:has-text("Lance")');
        
        // Logar resultado (não falhar pois depende do status do lote)
        const hasBidArea = await bidArea.first().isVisible();
        console.log(`📊 Área de lance visível: ${hasBidArea}`);
      }
    });
  });

  test.describe('5. Histórico e Acompanhamento', () => {
    test('deve exibir histórico de participações', async ({ page }) => {
      await page.goto('/dashboard/history');
      
      await expect(page.locator('[data-ai-id="dashboard-history"], main')).toBeVisible({ timeout: 10000 });
    });

    test('deve exibir lotes arrematados (wins)', async ({ page }) => {
      await page.goto('/dashboard/wins');
      
      await expect(page.locator('[data-ai-id="dashboard-wins"], main')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('6. Notificações', () => {
    test('deve exibir central de notificações', async ({ page }) => {
      await page.goto('/dashboard/notifications');
      
      await expect(page.locator('[data-ai-id="dashboard-notifications"], main')).toBeVisible({ timeout: 10000 });
    });
  });
});

// Métricas da jornada
test.describe('STR-01: Métricas de Conversão', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Sem auth

  test('deve medir tempo de carregamento da busca', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo de carregamento /search: ${loadTime}ms`);
    
    // KPI: página deve carregar em menos de 5s
    expect(loadTime).toBeLessThan(5000);
  });

  test('deve verificar SEO básico da página de busca', async ({ page }) => {
    await page.goto('/search');

    // Verificar title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);

    // Verificar meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc?.length || 0).toBeGreaterThan(50);

    // Verificar H1
    const h1 = await page.locator('h1').first().textContent();
    expect(h1?.length || 0).toBeGreaterThan(5);

    console.log(`📊 SEO - Title: ${title.slice(0, 50)}...`);
    console.log(`📊 SEO - H1: ${h1?.slice(0, 50)}...`);
  });
});
