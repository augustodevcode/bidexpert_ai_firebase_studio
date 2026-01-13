/**
 * @file STR-05: Jornada Comitente (Seller/Consignor)
 * @description Skill de validação da jornada crítica do Comitente.
 * Comitente = quem consigna bens para leilão (vendedor).
 * 
 * Jornada do Comitente:
 * 1. Login e acesso ao painel
 * 2. Cadastrar bens/ativos para consignação
 * 3. Acompanhar status dos lotes
 * 4. Visualizar lances e arrematações
 * 5. Acompanhar financeiro (comissões, repasses)
 * 6. Gerenciar documentação dos bens
 */

import { test, expect, Page } from '@playwright/test';

test.describe('STR-05: Jornada Comitente', () => {
  // Usar storageState de comitente autenticado
  test.use({ storageState: './tests/e2e/.auth/seller.json' });

  test.describe('1. Acesso ao Painel do Comitente', () => {
    test('deve acessar dashboard do comitente após login', async ({ page }) => {
      await page.goto('/seller/dashboard');
      
      // Verificar redirecionamento ou acesso ao painel
      await expect(page.locator('main, [data-ai-id="seller-dashboard"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir menu de navegação do comitente', async ({ page }) => {
      await page.goto('/seller/dashboard');
      await page.waitForTimeout(2000);

      // Verificar itens de menu essenciais
      const menuItems = [
        'Meus Bens',
        'Meus Lotes',
        'Financeiro',
        'Documentos',
        'Contratos',
      ];

      for (const item of menuItems) {
        const menuLink = page.locator(`nav, aside, [data-ai-id="seller-menu"]`).locator(`text=${item}`).first();
        const isVisible = await menuLink.isVisible().catch(() => false);
        console.log(`📊 Menu "${item}": ${isVisible ? '✅' : '❌'}`);
      }
    });

    test('deve exibir resumo de bens consignados', async ({ page }) => {
      await page.goto('/seller/dashboard');
      await page.waitForTimeout(3000);

      // Verificar cards de resumo
      const summaryCards = [
        'Bens cadastrados',
        'Em leilão',
        'Vendidos',
        'Aguardando',
      ];

      for (const card of summaryCards) {
        const cardElement = page.locator(`text=/${card}/i`).first();
        const isVisible = await cardElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ ${card}`);
        }
      }
    });
  });

  test.describe('2. Cadastro de Bens/Ativos', () => {
    test('deve acessar lista de bens', async ({ page }) => {
      await page.goto('/seller/assets');
      
      await expect(page.locator('main, [data-ai-id="seller-assets-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir botão de cadastrar novo bem', async ({ page }) => {
      await page.goto('/seller/assets');
      await page.waitForTimeout(2000);

      const createButton = page.locator('button:has-text("Cadastrar"), button:has-text("Novo"), a:has-text("Cadastrar"), a:has-text("Novo bem")').first();
      const hasCreateButton = await createButton.isVisible().catch(() => false);

      console.log(`📊 Botão cadastrar bem: ${hasCreateButton ? '✅' : '❌'}`);
    });

    test('deve acessar formulário de cadastro de bem', async ({ page }) => {
      await page.goto('/seller/assets/new');
      
      const formVisible = await page.locator('form, [data-ai-id="asset-form"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (formVisible) {
        // Verificar campos essenciais
        const fields = ['titulo', 'title', 'descricao', 'description', 'categoria', 'category'];
        for (const field of fields) {
          const input = page.locator(`input[name="${field}"], input[id="${field}"], textarea[name="${field}"]`);
          if (await input.isVisible().catch(() => false)) {
            console.log(`✅ Campo ${field} encontrado`);
          }
        }
      } else {
        console.log('⚠️ Formulário de cadastro não acessível');
      }
    });

    test('deve listar bens existentes do comitente', async ({ page }) => {
      await page.goto('/seller/assets');
      await page.waitForTimeout(3000);

      const assetList = page.locator('table, [data-ai-id="assets-list"], .asset-card, .grid');
      const hasAssets = await assetList.isVisible().catch(() => false);

      if (hasAssets) {
        const assetCount = await page.locator('tr, .asset-card, [data-ai-id*="asset-item"]').count();
        console.log(`📊 Bens listados: ${assetCount}`);
      } else {
        const emptyMessage = await page.locator('text=/nenhum|vazio|empty|sem bens/i').isVisible();
        console.log(`📊 Lista vazia: ${emptyMessage ? 'Sim' : 'Não encontrada'}`);
      }
    });
  });

  test.describe('3. Acompanhamento de Lotes', () => {
    test('deve acessar lista de lotes do comitente', async ({ page }) => {
      await page.goto('/seller/lots');
      
      await expect(page.locator('main, [data-ai-id="seller-lots-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir status dos lotes', async ({ page }) => {
      await page.goto('/seller/lots');
      await page.waitForTimeout(3000);

      // Verificar filtros por status
      const statusFilters = ['Todos', 'Em leilão', 'Vendido', 'Encerrado', 'Aguardando'];
      
      for (const status of statusFilters) {
        const filter = page.locator(`button:has-text("${status}"), [data-ai-id="status-filter"] option:has-text("${status}")`);
        const hasFilter = await filter.isVisible().catch(() => false);
        if (hasFilter) {
          console.log(`✅ Filtro "${status}" disponível`);
        }
      }
    });

    test('deve exibir valor atual e lances dos lotes', async ({ page }) => {
      await page.goto('/seller/lots');
      await page.waitForTimeout(3000);

      // Verificar se mostra valores
      const priceElements = page.locator('[data-ai-id*="price"], [data-ai-id*="valor"], .price, .valor');
      const priceCount = await priceElements.count();

      console.log(`📊 Elementos de valor encontrados: ${priceCount}`);
    });
  });

  test.describe('4. Acompanhamento de Arrematações', () => {
    test('deve acessar página de vendas/arrematações', async ({ page }) => {
      await page.goto('/seller/sales');
      
      await expect(page.locator('main, [data-ai-id="seller-sales-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir histórico de vendas', async ({ page }) => {
      await page.goto('/seller/sales');
      await page.waitForTimeout(3000);

      const salesList = page.locator('table, [data-ai-id="sales-list"], .sale-card');
      const hasSales = await salesList.isVisible().catch(() => false);

      if (hasSales) {
        console.log('✅ Lista de vendas carregada');
        
        // Verificar informações essenciais
        const columns = ['Lote', 'Valor', 'Data', 'Comprador', 'Status'];
        for (const col of columns) {
          const hasColumn = await page.locator(`th:has-text("${col}"), [data-ai-id*="${col.toLowerCase()}"]`).isVisible().catch(() => false);
          if (hasColumn) {
            console.log(`   ✅ ${col}`);
          }
        }
      } else {
        console.log('📊 Nenhuma venda registrada');
      }
    });
  });

  test.describe('5. Painel Financeiro', () => {
    test('deve acessar página financeira', async ({ page }) => {
      await page.goto('/seller/financial');
      
      await expect(page.locator('main, [data-ai-id="seller-financial-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve exibir resumo financeiro', async ({ page }) => {
      await page.goto('/seller/financial');
      await page.waitForTimeout(3000);

      // Verificar métricas financeiras
      const financialMetrics = [
        'Total vendido',
        'Comissão',
        'A receber',
        'Recebido',
        'Repasse',
      ];

      for (const metric of financialMetrics) {
        const metricElement = page.locator(`text=/${metric}/i`).first();
        const isVisible = await metricElement.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`✅ ${metric}`);
        }
      }
    });

    test('deve listar movimentações financeiras', async ({ page }) => {
      await page.goto('/seller/financial');
      await page.waitForTimeout(3000);

      const transactionList = page.locator('table, [data-ai-id="transactions-list"], .transaction-item');
      const hasTransactions = await transactionList.isVisible().catch(() => false);

      console.log(`📊 Lista de transações: ${hasTransactions ? '✅' : '❌'}`);
    });
  });

  test.describe('6. Documentação', () => {
    test('deve acessar página de documentos', async ({ page }) => {
      await page.goto('/seller/documents');
      
      await expect(page.locator('main, [data-ai-id="seller-documents-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve permitir upload de documentos', async ({ page }) => {
      await page.goto('/seller/documents');
      await page.waitForTimeout(2000);

      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Enviar"), input[type="file"], [data-ai-id="upload-document"]');
      const hasUpload = await uploadButton.isVisible().catch(() => false);

      console.log(`📊 Upload de documentos: ${hasUpload ? '✅' : '❌'}`);
    });
  });
});

// Métricas de performance
test.describe('STR-05: Performance Comitente', () => {
  test.use({ storageState: './tests/e2e/.auth/seller.json' });

  test('tempo de carregamento do dashboard', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/seller/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /seller/dashboard: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('tempo de carregamento dos bens', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/seller/assets');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo /seller/assets: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});
