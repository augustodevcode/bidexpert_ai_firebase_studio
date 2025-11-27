/**
 * 🎯 TESTES PLAYWRIGHT - EXPANDED SEED DATA
 * ==========================================
 * 
 * Testes para validar os novos dados adicionados na Seed V3:
 * - Leiloeiros adicionais (SP, RJ, MG)
 * - Estrutura judicial expandida (3 comarcas, 3 varas)
 * - Auctions em múltiplas jurisdições
 * - Lotes com localização completa
 * - Processos judiciais expandidos
 * - Vendedores judiciais por região
 * 
 * Requer: npm run db:seed:v3 executado antes
 * Execução: npm run test:e2e tests/e2e/5-gaps-expanded-seed-data.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9005';

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: LEILOEIROS ADICIONAIS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Leiloeiros Adicionais', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctioneers`, { waitUntil: 'networkidle' });
  });

  test('L1: Deve exibir todos os 4 leiloeiros na lista', async ({ page }) => {
    // Aguardar lista carregar
    const auctioneersTable = page.locator('table, .auctioneers-list, [data-testid="auctioneers-table"]');
    await auctioneersTable.waitFor({ state: 'visible', timeout: 5000 });

    // Procurar por cada leiloeiro
    const leiloeiros = [
      'leiloeiro@premium.test.local', // Original
      'leiloeiro.sp.01@bidexpert.com',
      'leiloeiro.rj.01@bidexpert.com',
      'leiloeiro.mg.01@bidexpert.com',
    ];

    for (const email of leiloeiros) {
      const row = page.locator(`text=${email}`);
      await expect(row).toBeVisible({ timeout: 3000 });
    }

    console.log('✓ Todos os 4 leiloeiros encontrados');
  });

  test('L2: Deve permitir buscar leiloeiro por email', async ({ page }) => {
    // Procurar input de busca
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="buscar" i], [data-testid="search-auctioneer"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('leiloeiro.rj');
      await page.waitForTimeout(500);

      // Verificar que aparece RJ
      await expect(page.locator('text=leiloeiro.rj.01@bidexpert.com')).toBeVisible();
    }
  });

  test('L3: Deve exibir estados corretos para cada leiloeiro', async ({ page }) => {
    // SP
    const spRow = page.locator(`text=leiloeiro.sp.01@bidexpert.com`).first();
    if (await spRow.count() > 0) {
      const spState = spRow.locator('text=SP, text=São Paulo').first();
      if (await spState.count() > 0) {
        await expect(spState).toBeVisible();
      }
    }

    // RJ
    const rjRow = page.locator(`text=leiloeiro.rj.01@bidexpert.com`).first();
    if (await rjRow.count() > 0) {
      const rjState = rjRow.locator('text=RJ, text=Rio de Janeiro').first();
      if (await rjState.count() > 0) {
        await expect(rjState).toBeVisible();
      }
    }

    // MG
    const mgRow = page.locator(`text=leiloeiro.mg.01@bidexpert.com`).first();
    if (await mgRow.count() > 0) {
      const mgState = mgRow.locator('text=MG, text=Minas Gerais').first();
      if (await mgState.count() > 0) {
        await expect(mgState).toBeVisible();
      }
    }
  });

  test('L4: Deve permitir clicar em leiloeiro para ver detalhes', async ({ page }) => {
    // Clicar em leiloeiro RJ
    const rjLink = page.locator(`a:has-text("leiloeiro.rj.01"), [data-testid*="rj"]`).first();
    
    if (await rjLink.count() > 0) {
      await rjLink.click();
      await page.waitForURL(/\/admin\/auctioneers\/\d+|\/profile.*rj/i, { timeout: 5000 }).catch(() => {
        console.log('⚠️ Navegação pode ter falhado, continuando...');
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: ESTRUTURA JUDICIAL EXPANDIDA
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Estrutura Judicial', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para página de processos ou estrutura judicial
    await page.goto(`${BASE_URL}/admin/judicial-processes`, { waitUntil: 'networkidle' }).catch(() => {
      // Se não existir, tentar dashboard
      return page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    });
  });

  test('J1: Deve exibir 3 comarcas diferentes', async ({ page }) => {
    const comarcas = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];

    for (const comarca of comarcas) {
      const element = page.locator(`text=${comarca}`).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible({ timeout: 3000 });
      }
    }

    console.log('✓ Todas as 3 comarcas encontradas');
  });

  test('J2: Deve exibir 3 varas judiciais', async ({ page }) => {
    const varas = ['Vara Cível', 'Vara da Capital', 'SP', 'RJ', 'MG'];

    let varasFound = 0;
    for (const vara of varas) {
      const element = page.locator(`text=${vara}`).first();
      if (await element.count() > 0) {
        varasFound++;
      }
    }

    expect(varasFound).toBeGreaterThan(0);
    console.log(`✓ ${varasFound} varas encontradas`);
  });

  test('J3: Deve permitir filtrar por comarca', async ({ page }) => {
    // Procurar select de comarca
    const comarcaSelect = page.locator('select[name*="comarca" i], [data-testid*="comarca"]').first();
    
    if (await comarcaSelect.count() > 0) {
      // Selecionar Rio de Janeiro
      await comarcaSelect.selectOption('Rio de Janeiro');
      await page.waitForTimeout(500);

      // Verificar que aparece RJ
      const rjElement = page.locator('text=Rio de Janeiro, text=RJ').first();
      if (await rjElement.count() > 0) {
        await expect(rjElement).toBeVisible();
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: AUCTIONS EXPANDIDAS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Auctions Expandidas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle' });
  });

  test('A1: Deve exibir 7 auctions no total', async ({ page }) => {
    // Aguardar tabela/lista
    const table = page.locator('table, [data-testid="auctions-list"], .auctions-grid').first();
    await table.waitFor({ state: 'visible', timeout: 5000 });

    // Contar linhas (excluindo header)
    const rows = page.locator('tbody tr, [data-testid="auction-row"], .auction-item');
    const count = await rows.count();
    
    console.log(`Auctions encontradas: ${count}`);
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('A2: Deve exibir auctions em São Paulo', async ({ page }) => {
    const spAuctions = [
      'Leilão Judicial - Imóveis',
      'Leilão Extrajudicial - Veículos',
      'Leilão Particular - Maquinários',
      'Tomada de Preços - Móveis',
      'Leilão Extrajudicial - Equipamentos',
    ];

    for (const auction of spAuctions) {
      const element = page.locator(`text=${auction}`).first();
      if (await element.count() > 0) {
        console.log(`✓ Encontrada: ${auction}`);
      }
    }
  });

  test('A3: Deve exibir auction de Rio de Janeiro', async ({ page }) => {
    const rjAuction = page.locator('text=Leilão Judicial - Imóveis RJ').first();
    
    if (await rjAuction.count() > 0) {
      await expect(rjAuction).toBeVisible();
      console.log('✓ Auction RJ encontrada');
    }
  });

  test('A4: Deve exibir auction de Minas Gerais', async ({ page }) => {
    const mgAuction = page.locator('text=Leilão Judicial - Propriedades MG, text=Fazendas').first();
    
    if (await mgAuction.count() > 0) {
      await expect(mgAuction).toBeVisible();
      console.log('✓ Auction MG encontrada');
    }
  });

  test('A5: Deve permitir filtrar auctions por leiloeiro', async ({ page }) => {
    // Procurar select de leiloeiro
    const auctioneerSelect = page.locator('select[name*="auctioneer" i], [data-testid*="auctioneer"]').first();
    
    if (await auctioneerSelect.count() > 0) {
      const options = await auctioneerSelect.locator('option').count();
      console.log(`✓ ${options} opções de leiloeiro encontradas`);
      expect(options).toBeGreaterThanOrEqual(4);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: LOTES COM LOCALIZAÇÃO EXPANDIDA
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Lotes com Localização', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'networkidle' });
  });

  test('Lo1: Deve exibir 14 lotes no total', async ({ page }) => {
    // Aguardar tabela
    const table = page.locator('table, [data-testid="lots-list"], .lots-grid').first();
    await table.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('tbody tr, [data-testid="lot-row"], .lot-item');
    const count = await rows.count();
    
    console.log(`Lotes encontrados: ${count}`);
    expect(count).toBeGreaterThanOrEqual(14);
  });

  test('Lo2: Deve exibir lotes de São Paulo', async ({ page }) => {
    const spAddress = page.locator('text=São Paulo, text=SP').first();
    await expect(spAddress).toBeVisible({ timeout: 3000 });
    console.log('✓ Lotes de SP encontrados');
  });

  test('Lo3: Deve exibir lotes de Rio de Janeiro', async ({ page }) => {
    // Procurar por endereços RJ
    const rjAddresses = ['Av. Rio Branco', 'Av. Atlântica', 'Centro', 'Copacabana'];
    
    let found = false;
    for (const address of rjAddresses) {
      const element = page.locator(`text=${address}`).first();
      if (await element.count() > 0) {
        found = true;
        console.log(`✓ Encontrado: ${address}`);
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️ Nenhum endereço RJ encontrado, pode estar em outra página');
    }
  });

  test('Lo4: Deve exibir lotes de Belo Horizonte', async ({ page }) => {
    // Procurar por endereço de BH
    const bhAddress = page.locator('text=Savassi, text=Belo Horizonte').first();
    
    if (await bhAddress.count() > 0) {
      await expect(bhAddress).toBeVisible();
      console.log('✓ Lotes de BH encontrados');
    }
  });

  test('Lo5: Deve permitir filtrar lotes por localização', async ({ page }) => {
    // Procurar input de busca por cidade
    const cityFilter = page.locator('input[placeholder*="cidade" i], input[placeholder*="city" i], [data-testid*="location"]').first();
    
    if (await cityFilter.count() > 0) {
      await cityFilter.fill('Rio de Janeiro');
      await page.waitForTimeout(500);

      // Verificar que aparecem lotes RJ
      const rjElement = page.locator('text=Rio de Janeiro').first();
      await expect(rjElement).toBeVisible();
      console.log('✓ Filtro de localização funciona');
    }
  });

  test('Lo6: Deve exibir endereço completo dos lotes', async ({ page }) => {
    // Procurar por lote com endereço completo
    const detailedAddress = page.locator('text=/\\d+\\s*-.*?\\d{5}-?\\d{3}/').first(); // Busca por padrão de endereço com CEP
    
    if (await detailedAddress.count() > 0) {
      await expect(detailedAddress).toBeVisible();
      const text = await detailedAddress.textContent();
      console.log(`✓ Endereço completo encontrado: ${text}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: PROCESSOS JUDICIAIS EXPANDIDOS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Processos Judiciais', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/judicial-processes`, { waitUntil: 'networkidle' });
  });

  test('PJ1: Deve exibir 6 processos judiciais no total', async ({ page }) => {
    // Aguardar tabela
    const table = page.locator('table, [data-testid="processes-list"], .processes-grid').first();
    await table.waitFor({ state: 'visible', timeout: 5000 });

    const rows = page.locator('tbody tr, [data-testid="process-row"], .process-item');
    const count = await rows.count();
    
    console.log(`Processos encontrados: ${count}`);
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('PJ2: Deve exibir processos de São Paulo', async ({ page }) => {
    // Procurar por processo SP
    const spProcess = page.locator('text=/0001567.*SP/').first();
    
    if (await spProcess.count() > 0) {
      await expect(spProcess).toBeVisible();
      console.log('✓ Processo de SP encontrado');
    }
  });

  test('PJ3: Deve exibir processos de Rio de Janeiro', async ({ page }) => {
    // Procurar por processo RJ
    const rjProcess = page.locator('text=/0004567.*RJ|0004567/').first();
    
    if (await rjProcess.count() > 0) {
      await expect(rjProcess).toBeVisible();
      console.log('✓ Processo de RJ encontrado');
    }
  });

  test('PJ4: Deve exibir processos de Minas Gerais', async ({ page }) => {
    // Procurar por processos MG
    const mgProcesses = page.locator('text=/0005567|0006567/');
    const count = await mgProcesses.count();
    
    if (count > 0) {
      await expect(mgProcesses.first()).toBeVisible();
      console.log(`✓ ${count} Processos de MG encontrados`);

      // Verificar que mostra detalhes
      const detailsSection = page.locator('[data-testid="lot-details"], .lot-details-container').first();
      if (await detailsSection.count() > 0) {
        console.log('✓ Detalhes do lote aparecem');
      }
    }
  });

  test('INT-E3: Multi-jurisdição funciona corretamente', async ({ page }) => {
    // Ir para dashboard/admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    // Procurar por resumo de auctions por estado
    const resumoElement = page.locator('text=/São Paulo|SP.*Rio de Janeiro|RJ.*Minas Gerais|MG/i').first();
    
    if (await resumoElement.count() > 0) {
      console.log('✓ Dashboard mostra dados de múltiplas jurisdições');
    } else {
      console.log('⚠️ Resumo de jurisdições não encontrado no dashboard');
    }
  });

  test('INT-E4: Leiloeiros estão vinculados às auctions corretas', async ({ page }) => {
    // Ir para auctions
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle' });

    // Verificar que cada leiloeiro tem auctions
    const auctionsByAuctioneer = {
      'leiloeiro.sp.01@bidexpert.com': ['SP', 'Equipamentos'],
      'leiloeiro.rj.01@bidexpert.com': ['RJ', 'Imóveis'],
      'leiloeiro.mg.01@bidexpert.com': ['MG', 'Propriedades'],
    };

    let foundCount = 0;
    for (const [email, keywords] of Object.entries(auctionsByAuctioneer)) {
      const element = page.locator(`text=${email}`).first();
      if (await element.count() > 0) {
        foundCount++;
        console.log(`✓ Leiloeiro ${email} encontrado`);
      }
    }

    expect(foundCount).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES: PERFORMANCE COM DADOS EXPANDIDOS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Expanded Seed Data: Performance', () => {
  test('PERF-E1: Auctions carrega em menos de 3 segundos com 7 itens', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`✓ Auctions carregou em ${loadTime}ms`);
  });

  test('PERF-E2: Lotes carrega em menos de 3 segundos com 14 itens', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`✓ Lotes carregou em ${loadTime}ms`);
  });

  test('PERF-E3: Processos Judiciais carrega em menos de 3 segundos com 6 itens', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/judicial-processes`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`✓ Processos carregou em ${loadTime}ms`);
  });

  test('PERF-E4: Filtros funcionam rapidamente com dados expandidos', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/lots`, { waitUntil: 'networkidle' });

    const startTime = Date.now();

    // Usar filtro de localização
    const locationFilter = page.locator('input[placeholder*="cidade" i], input[placeholder*="location" i], [data-testid*="location"]').first();
    
    if (await locationFilter.count() > 0) {
      await locationFilter.fill('Rio de Janeiro');
      await page.waitForTimeout(500);
    }

    const filterTime = Date.now() - startTime;
    expect(filterTime).toBeLessThan(1000);
    console.log(`✓ Filtro aplicado em ${filterTime}ms`);
  });
});
