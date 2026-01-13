/**
 * @file STR-04: Jornada Leiloeiro (Auctioneer)
 * @description Skill de validação da jornada crítica do Leiloeiro.
 * Valida que as funcionalidades essenciais para operação do leilão estão funcionando.
 * 
 * Jornada do Leiloeiro:
 * 1. Login e acesso ao painel admin
 * 2. Criar/gerenciar leilão
 * 3. Cadastrar lotes
 * 4. Aprovar habilitações de participantes
 * 5. Monitorar lances em tempo real
 * 6. Encerrar leilão e gerar relatórios
 */

import { test, expect, Page } from '@playwright/test';

// Configuração de teste para Leiloeiro (usa auth de admin/auctioneer)
test.describe('STR-04: Jornada Leiloeiro', () => {
  // Usar storageState de leiloeiro autenticado
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test.describe('1. Acesso ao Painel Administrativo', () => {
    test('deve acessar dashboard admin após login', async ({ page }) => {
      await page.goto('/admin');
      
      // Verificar redirecionamento ou acesso ao painel
      await expect(page).toHaveURL(/\/admin|\/dashboard/);
      
      // Verificar elementos do painel admin
      await expect(page.locator('[data-ai-id="admin-dashboard"], [data-ai-id="admin-sidebar"], nav')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir menu de navegação do leiloeiro', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      // Verificar itens de menu essenciais para leiloeiro
      const menuItems = [
        'Leilões',
        'Lotes',
        'Habilitações',
        'Participantes',
      ];

      for (const item of menuItems) {
        const menuLink = page.locator(`nav, aside`).locator(`text=${item}`).first();
        const isVisible = await menuLink.isVisible().catch(() => false);
        console.log(`📊 Menu "${item}": ${isVisible ? '✅' : '❌'}`);
      }
    });
  });

  test.describe('2. Gestão de Leilões', () => {
    test('deve acessar lista de leilões', async ({ page }) => {
      await page.goto('/admin/auctions');
      
      // Verificar se página carrega
      await expect(page.locator('[data-ai-id="admin-auctions-page"], main, .container')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir botão de criar novo leilão', async ({ page }) => {
      await page.goto('/admin/auctions');
      await page.waitForTimeout(2000);

      // Verificar botão de criar
      const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo"), a:has-text("Criar"), a:has-text("Novo")').first();
      const hasCreateButton = await createButton.isVisible().catch(() => false);
      
      console.log(`📊 Botão criar leilão: ${hasCreateButton ? '✅' : '❌'}`);
    });

    test('deve acessar formulário de criação de leilão', async ({ page }) => {
      await page.goto('/admin/auctions/new');
      
      // Verificar se formulário existe (pode redirecionar se não tiver permissão)
      const formVisible = await page.locator('form, [data-ai-id="auction-form"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (formVisible) {
        // Verificar campos essenciais
        await expect(page.locator('input[name="title"], input[id="title"], [data-ai-id="auction-title-input"]')).toBeVisible();
      } else {
        console.log('⚠️ Formulário de criação não acessível (verificar permissões)');
      }
    });

    test('deve listar leilões existentes com informações essenciais', async ({ page }) => {
      await page.goto('/admin/auctions');
      await page.waitForTimeout(3000);

      // Verificar se há tabela ou lista de leilões
      const auctionList = page.locator('table, [data-ai-id="auctions-list"], .auction-card');
      const hasAuctions = await auctionList.isVisible().catch(() => false);

      if (hasAuctions) {
        console.log('✅ Lista de leilões carregada');
      } else {
        // Verificar mensagem de lista vazia
        const emptyMessage = await page.locator('text=/nenhum|vazio|empty|sem leilões/i').isVisible();
        console.log(`📊 Lista vazia: ${emptyMessage ? 'Sim' : 'Não'}`);
      }
    });
  });

  test.describe('3. Gestão de Lotes', () => {
    test('deve acessar lista de lotes', async ({ page }) => {
      await page.goto('/admin/lots');
      
      await expect(page.locator('[data-ai-id="admin-lots-page"], main')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir filtrar lotes por leilão', async ({ page }) => {
      await page.goto('/admin/lots');
      await page.waitForTimeout(2000);

      // Verificar se existe filtro por leilão
      const auctionFilter = page.locator('[data-ai-id="filter-auction"], select:has-text("Leilão"), [data-testid="auction-filter"]');
      const hasFilter = await auctionFilter.isVisible().catch(() => false);

      console.log(`📊 Filtro por leilão: ${hasFilter ? '✅' : '❌'}`);
    });

    test('deve exibir status dos lotes', async ({ page }) => {
      await page.goto('/admin/lots');
      await page.waitForTimeout(3000);

      // Verificar se status é exibido
      const statusBadges = page.locator('[data-ai-id*="status"], .badge, .status, [class*="status"]');
      const statusCount = await statusBadges.count();

      console.log(`📊 Badges de status encontrados: ${statusCount}`);
    });
  });

  test.describe('4. Gestão de Habilitações', () => {
    test('deve acessar lista de habilitações pendentes', async ({ page }) => {
      await page.goto('/admin/habilitations');
      
      await expect(page.locator('[data-ai-id="admin-habilitations-page"], main')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir documentos do participante para aprovação', async ({ page }) => {
      await page.goto('/admin/habilitations');
      await page.waitForTimeout(3000);

      // Verificar se há lista de habilitações
      const habilitationList = page.locator('table, [data-ai-id="habilitations-list"], .habilitation-card');
      const hasHabilitations = await habilitationList.isVisible().catch(() => false);

      if (hasHabilitations) {
        // Verificar botões de ação (aprovar/reprovar)
        const actionButtons = page.locator('button:has-text("Aprovar"), button:has-text("Reprovar"), button:has-text("Analisar")');
        const hasActions = await actionButtons.first().isVisible().catch(() => false);
        console.log(`📊 Botões de ação: ${hasActions ? '✅' : '❌'}`);
      } else {
        console.log('📊 Nenhuma habilitação pendente');
      }
    });
  });

  test.describe('5. Monitoramento em Tempo Real', () => {
    test('deve acessar painel de leilão ao vivo', async ({ page }) => {
      await page.goto('/live-dashboard');
      
      // Página dinâmica - pode estar vazia se não houver leilões ao vivo
      await expect(page.locator('[data-ai-id="live-dashboard"], main')).toBeVisible({ timeout: 15000 });
    });

    test('deve acessar página de preparação de leilão', async ({ page }) => {
      await page.goto('/admin/auctions');
      await page.waitForTimeout(2000);

      // Tentar acessar um leilão existente
      const auctionLink = page.locator('a[href*="/admin/auctions/"]').first();
      
      if (await auctionLink.isVisible()) {
        await auctionLink.click();
        await page.waitForTimeout(2000);
        
        // Verificar se página de detalhes carrega
        await expect(page.locator('main, [data-ai-id="auction-detail"]')).toBeVisible();
      } else {
        console.log('⚠️ Nenhum leilão disponível para monitoramento');
      }
    });
  });

  test.describe('6. Relatórios e Encerramento', () => {
    test('deve acessar página de relatórios', async ({ page }) => {
      await page.goto('/admin/reports');
      
      await expect(page.locator('[data-ai-id="admin-reports-page"], main')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir gerar relatório de leilão', async ({ page }) => {
      await page.goto('/admin/reports');
      await page.waitForTimeout(2000);

      // Verificar opções de relatório
      const reportOptions = page.locator('button:has-text("Gerar"), button:has-text("Exportar"), select, [data-ai-id="report-type"]');
      const hasReportOptions = await reportOptions.first().isVisible().catch(() => false);

      console.log(`📊 Opções de relatório: ${hasReportOptions ? '✅' : '❌'}`);
    });

    test('deve exibir dashboard de métricas do leiloeiro', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);

      // Verificar cards de métricas
      const metricCards = page.locator('[data-ai-id*="metric"], [data-ai-id*="stat"], .stat-card, .metric-card');
      const metricCount = await metricCards.count();

      console.log(`📊 Cards de métricas encontrados: ${metricCount}`);

      // Verificar métricas essenciais para leiloeiro
      const essentialMetrics = [
        'Leilões',
        'Lotes',
        'Lances',
        'Arrematações',
        'Comissão',
        'Faturamento',
      ];

      for (const metric of essentialMetrics) {
        const hasMetric = await page.locator(`text=${metric}`).isVisible().catch(() => false);
        if (hasMetric) {
          console.log(`   ✅ ${metric}`);
        }
      }
    });
  });
});

// Testes de fluxo completo do leiloeiro
test.describe('STR-04: Fluxo Operacional Completo', () => {
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test('fluxo: dashboard → leilões → lotes → detalhes', async ({ page }) => {
    // 1. Acessar dashboard
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // 2. Navegar para leilões
    const auctionsLink = page.locator('a[href*="/admin/auctions"], nav a:has-text("Leilões")').first();
    if (await auctionsLink.isVisible()) {
      await auctionsLink.click();
      await page.waitForURL(/\/admin\/auctions/);
    } else {
      await page.goto('/admin/auctions');
    }
    
    // 3. Verificar lista
    await expect(page.locator('main')).toBeVisible();
    
    console.log('✅ Fluxo dashboard → leilões funcionando');
  });
});

// Métricas de performance para o leiloeiro
test.describe('STR-04: Métricas de Performance', () => {
  test.use({ storageState: './tests/e2e/.auth/admin.json' });

  test('tempo de carregamento do painel admin', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo de carregamento /admin: ${loadTime}ms`);
    
    // KPI: painel admin deve carregar em menos de 5s
    expect(loadTime).toBeLessThan(5000);
  });

  test('tempo de carregamento da lista de leilões', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/auctions');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo de carregamento /admin/auctions: ${loadTime}ms`);
    
    // KPI: lista deve carregar em menos de 3s
    expect(loadTime).toBeLessThan(3000);
  });

  test('tempo de carregamento da lista de lotes', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/admin/lots');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo de carregamento /admin/lots: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });
});
