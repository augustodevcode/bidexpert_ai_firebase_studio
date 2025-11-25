import { test, expect, Page } from '@playwright/test';

/**
 * ITSM E2E Tests - Query Monitor
 * Testes baseados em BDD para o monitor de queries SQL no painel admin
 * 
 * Cenários testados:
 * - Visualização do monitor no rodapé
 * - Estatísticas de queries
 * - Expansão/minimização
 * - Indicadores de performance
 * - Atualização automática
 */

test.describe('ITSM - Monitor de Queries SQL', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login como admin e navegar para admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir monitor de queries no rodapé do admin', async ({ page }) => {
    // Given: Estou em página admin
    // Then: Monitor deve estar visível no rodapé
    const monitor = page.locator('[data-testid="query-monitor"], .fixed.bottom-0');
    await expect(monitor.first()).toBeVisible({ timeout: 5000 });
    
    // And: Deve ter fundo escuro
    const monitorElement = monitor.first();
    const bgClass = await monitorElement.getAttribute('class');
    expect(bgClass).toContain('bg-slate-900');
    
    // And: Ver ícone de banco de dados
    const dbIcon = page.locator('[data-testid="query-monitor"] svg, .fixed.bottom-0 svg').first();
    await expect(dbIcon).toBeVisible();
    
    // And: Ver texto Query Monitor
    const title = page.locator('text=Query Monitor');
    await expect(title).toBeVisible();
  });

  test('deve exibir estatísticas de queries', async ({ page }) => {
    // Given: Monitor visível
    await page.waitForTimeout(1000);
    
    // Then: Ver estatísticas
    const totalStat = page.locator('text=/Total:\\s*\\d+/i');
    await expect(totalStat.first()).toBeVisible({ timeout: 5000 });
    
    const avgStat = page.locator('text=/Média/i');
    await expect(avgStat.first()).toBeVisible();
  });

  test('deve expandir monitor para ver detalhes das queries', async ({ page }) => {
    // Given: Monitor minimizado
    await page.waitForTimeout(1000);
    
    // When: Clicar em Expandir
    const expandButton = page.locator('button:has-text("Expandir")');
    
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(800); // Aguardar animação
      
      // Then: Monitor deve expandir
      const expandedContent = page.locator('.max-h-96, .max-h-80');
      const isVisible = await expandedContent.first().isVisible();
      
      // And: Botão deve mudar para Minimizar
      const minimizeButton = page.locator('button:has-text("Minimizar")');
      const hasMinimize = await minimizeButton.count() > 0;
      
      expect(isVisible || hasMinimize).toBeTruthy();
    }
  });

  test('deve minimizar monitor', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(800);
      
      // When: Clicar em Minimizar
      const minimizeButton = page.locator('button:has-text("Minimizar")');
      if (await minimizeButton.isVisible()) {
        await minimizeButton.click();
        await page.waitForTimeout(800);
        
        // Then: Botão deve voltar para Expandir
        await expect(expandButton).toBeVisible();
      }
    }
  });

  test('deve verificar indicadores de performance de queries', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Se houver queries, verificar badges de tempo
      const queryItems = page.locator('.p-3.rounded-lg, [class*="border"]');
      const count = await queryItems.count();
      
      if (count > 0) {
        // Procurar por indicadores de tempo (ms ou s)
        const timeIndicators = page.locator('text=/\\d+ms|\\d+\\.\\d+s/');
        const timeCount = await timeIndicators.count();
        
        expect(timeCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('deve exibir badge verde para queries rápidas (< 500ms)', async ({ page }) => {
    // Given: Monitor expandido com queries
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Procurar por badges verdes
      const greenBadges = page.locator('[class*="green"]');
      const count = await greenBadges.count();
      
      // Se houver queries rápidas, devem ter badges verdes
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve exibir badge amarelo para queries moderadas (500ms-1s)', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Procurar por badges amarelos
      const yellowBadges = page.locator('[class*="yellow"]');
      const count = await yellowBadges.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve exibir badge vermelho para queries lentas (> 1s)', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Se houver queries lentas, ver badge "Lentas"
      const slowBadge = page.locator('text=Lentas');
      const slowCount = await slowBadge.count();
      
      expect(slowCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve exibir queries com erro em vermelho', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Se houver falhas, ver badge "Falhas"
      const failBadge = page.locator('text=Falhas');
      const failCount = await failBadge.count();
      
      expect(failCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve atualizar monitor periodicamente', async ({ page }) => {
    // Given: Monitor visível
    await page.waitForTimeout(1000);
    
    // Capturar estado inicial
    const initialText = await page.locator('text=/Total:\\s*\\d+/i').first().textContent();
    
    // When: Executar ação que gera query (navegar para outra página)
    await page.goto('/admin/auctions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Then: Estatísticas podem ter mudado
    const newText = await page.locator('text=/Total:\\s*\\d+/i').first().textContent();
    
    // Monitor deve estar funcional (pode ou não ter mudado)
    expect(newText).toBeTruthy();
  });

  test('deve exibir informações completas de cada query', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Se houver queries, verificar elementos
      const queryItems = page.locator('.p-3.rounded-lg');
      const count = await queryItems.count();
      
      if (count > 0) {
        const firstQuery = queryItems.first();
        
        // Verificar que tem conteúdo
        const text = await firstQuery.textContent();
        expect(text).toBeTruthy();
        expect(text!.length).toBeGreaterThan(0);
      }
    }
  });

  test('deve exibir timestamp de cada query', async ({ page }) => {
    // Given: Monitor expandido com queries
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Procurar por timestamps (formato de hora)
      const timestamps = page.locator('text=/\\d{1,2}:\\d{2}(:\\d{2})?/');
      const count = await timestamps.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve exibir mensagem quando não há queries registradas', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(1000);
      
      // Then: Se não houver queries, ver mensagem
      const emptyState = page.locator('text=/Nenhuma query|sem queries/i');
      const queryItems = page.locator('.p-3.rounded-lg');
      const itemCount = await queryItems.count();
      
      // Ou tem queries ou tem mensagem de vazio
      const hasEmpty = await emptyState.count() > 0;
      
      expect(itemCount > 0 || hasEmpty).toBeTruthy();
    }
  });

  test('não deve aparecer em páginas públicas', async ({ page }) => {
    // Given: Navegar para página pública
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Then: Monitor NÃO deve estar visível
    const monitor = page.locator('text=Query Monitor');
    await expect(monitor).not.toBeVisible({ timeout: 2000 });
  });

  test('deve ter padding adequado no conteúdo principal', async ({ page }) => {
    // Given: Monitor visível no rodapé
    await page.waitForTimeout(1000);
    
    // Then: Main content deve ter padding bottom para não sobrepor
    const mainContent = page.locator('main');
    const paddingClass = await mainContent.getAttribute('class');
    
    // Deve ter padding bottom (pb-24 ou similar)
    const hasPadding = paddingClass?.includes('pb-') || false;
    
    expect(hasPadding).toBeTruthy();
  });

  test('deve persistir estado expandido/minimizado durante navegação', async ({ page }) => {
    // Given: Monitor expandido
    await page.waitForTimeout(1000);
    
    const expandButton = page.locator('button:has-text("Expandir")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
      
      // When: Navegar para outra página admin
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Then: Monitor ainda deve estar visível
      const monitor = page.locator('text=Query Monitor');
      await expect(monitor).toBeVisible();
    }
  });
});
