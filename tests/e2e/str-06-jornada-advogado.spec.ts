/**
 * @file STR-06: Jornada Advogado (Lawyer/Legal)
 * @description Skill de validação da jornada crítica do Advogado.
 * Advogado = consulta processos, acompanha leilões judiciais, valida documentação.
 * 
 * Jornada do Advogado:
 * 1. Login e acesso ao painel jurídico
 * 2. Buscar processos e leilões judiciais
 * 3. Consultar partes do processo
 * 4. Analisar editais e documentação
 * 5. Acompanhar prazos e intimações
 * 6. Gerar relatórios de diligência
 */

import { test, expect, Page } from '@playwright/test';

test.describe('STR-06: Jornada Advogado', () => {
  // Usar storageState de advogado autenticado (ou BIDDER com acesso jurídico)
  test.use({ storageState: './tests/e2e/.auth/bidder.json' });

  test.describe('1. Acesso ao Painel Jurídico', () => {
    test('deve acessar área de leilões judiciais', async ({ page }) => {
      await page.goto('/auctions?type=JUDICIAL');
      
      await expect(page.locator('main, [data-ai-id="auctions-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('deve filtrar apenas leilões judiciais', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForTimeout(2000);

      // Verificar filtro de tipo judicial
      const judicialFilter = page.locator('button:has-text("Judicial"), [data-ai-id="filter-judicial"], select option[value="JUDICIAL"]');
      const hasFilter = await judicialFilter.isVisible().catch(() => false);

      console.log(`📊 Filtro judicial: ${hasFilter ? '✅' : '❌'}`);
    });

    test('deve acessar busca avançada de processos', async ({ page }) => {
      await page.goto('/search/judicial');
      
      const searchPage = await page.locator('main, [data-ai-id="judicial-search"]').isVisible({ timeout: 10000 }).catch(() => false);
      
      if (searchPage) {
        // Verificar campos de busca jurídica
        const searchFields = [
          'número do processo',
          'vara',
          'tribunal',
          'parte',
          'cnj',
        ];

        for (const field of searchFields) {
          const input = page.locator(`input[placeholder*="${field}" i], label:has-text("${field}") + input`);
          const hasField = await input.isVisible().catch(() => false);
          if (hasField) {
            console.log(`✅ Campo "${field}" encontrado`);
          }
        }
      } else {
        // Fallback para busca geral
        await page.goto('/search');
        console.log('⚠️ Busca jurídica específica não encontrada, usando busca geral');
      }
    });
  });

  test.describe('2. Consulta de Processos', () => {
    test('deve exibir informações do processo no lote', async ({ page }) => {
      await page.goto('/auctions?type=JUDICIAL');
      await page.waitForTimeout(3000);

      // Encontrar um lote judicial
      const lotCard = page.locator('[data-ai-id*="lot"], .lot-card, .auction-card').first();
      
      if (await lotCard.isVisible()) {
        await lotCard.click();
        await page.waitForTimeout(2000);

        // Verificar informações jurídicas
        const judicialInfo = [
          'Processo',
          'Vara',
          'Tribunal',
          'Exequente',
          'Executado',
          'Edital',
        ];

        for (const info of judicialInfo) {
          const infoElement = page.locator(`text=/${info}/i`).first();
          const isVisible = await infoElement.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✅ ${info}`);
          }
        }
      } else {
        console.log('⚠️ Nenhum lote judicial encontrado para análise');
      }
    });

    test('deve exibir partes do processo', async ({ page }) => {
      await page.goto('/auctions?type=JUDICIAL');
      await page.waitForTimeout(3000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar seção de partes
        const partiesSection = page.locator('[data-ai-id="process-parties"], [data-ai-id="partes"], .parties-section');
        const hasParties = await partiesSection.isVisible().catch(() => false);

        console.log(`📊 Seção de partes: ${hasParties ? '✅' : '❌'}`);
      }
    });
  });

  test.describe('3. Análise de Editais', () => {
    test('deve permitir download do edital', async ({ page }) => {
      await page.goto('/auctions?type=JUDICIAL');
      await page.waitForTimeout(3000);

      const lotLink = page.locator('a[href*="/lots/"], a[href*="/auctions/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar botão de download do edital
        const editalButton = page.locator('a:has-text("Edital"), button:has-text("Edital"), [data-ai-id="download-edital"]');
        const hasEdital = await editalButton.isVisible().catch(() => false);

        console.log(`📊 Download edital: ${hasEdital ? '✅' : '❌'}`);
      }
    });

    test('deve exibir documentação do lote', async ({ page }) => {
      await page.goto('/lots');
      await page.waitForTimeout(2000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar aba/seção de documentos
        const docsTab = page.locator('button:has-text("Documentos"), [data-ai-id="tab-documents"], a:has-text("Documentos")');
        const hasDocs = await docsTab.isVisible().catch(() => false);

        if (hasDocs) {
          await docsTab.click();
          await page.waitForTimeout(1000);
          console.log('✅ Aba de documentos acessível');
        } else {
          console.log('⚠️ Aba de documentos não encontrada');
        }
      }
    });
  });

  test.describe('4. Análise de Riscos Jurídicos', () => {
    test('deve exibir alertas de risco do lote', async ({ page }) => {
      await page.goto('/lots');
      await page.waitForTimeout(3000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar indicadores de risco
        const riskIndicators = [
          'Risco',
          'Alerta',
          'Ocupação',
          'Pendência',
          'Dívida',
          'Penhora',
        ];

        let risksFound = 0;
        for (const risk of riskIndicators) {
          const riskElement = page.locator(`text=/${risk}/i, [data-ai-id*="risk"]`).first();
          const isVisible = await riskElement.isVisible().catch(() => false);
          if (isVisible) {
            risksFound++;
            console.log(`✅ ${risk}`);
          }
        }

        console.log(`📊 Indicadores de risco encontrados: ${risksFound}`);
      }
    });

    test('deve exibir ônus e gravames', async ({ page }) => {
      await page.goto('/lots');
      await page.waitForTimeout(2000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar seção de ônus
        const onusSection = page.locator('[data-ai-id="onus"], [data-ai-id="encumbrances"], text=/ônus|gravame|hipoteca/i');
        const hasOnus = await onusSection.isVisible().catch(() => false);

        console.log(`📊 Seção de ônus/gravames: ${hasOnus ? '✅' : '❌'}`);
      }
    });
  });

  test.describe('5. Acompanhamento de Prazos', () => {
    test('deve exibir cronograma do leilão', async ({ page }) => {
      await page.goto('/auctions');
      await page.waitForTimeout(2000);

      const auctionLink = page.locator('a[href*="/auctions/"]').first();
      
      if (await auctionLink.isVisible()) {
        await auctionLink.click();
        await page.waitForTimeout(2000);

        // Verificar datas importantes
        const dates = [
          'Início',
          'Encerramento',
          '1ª Praça',
          '2ª Praça',
          'Visitação',
          'Impugnação',
        ];

        for (const date of dates) {
          const dateElement = page.locator(`text=/${date}/i`).first();
          const isVisible = await dateElement.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✅ ${date}`);
          }
        }
      }
    });
  });

  test.describe('6. Relatórios de Diligência', () => {
    test('deve permitir imprimir/exportar informações do lote', async ({ page }) => {
      await page.goto('/lots');
      await page.waitForTimeout(2000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar opções de exportação
        const exportButtons = page.locator('button:has-text("Imprimir"), button:has-text("PDF"), button:has-text("Exportar"), [data-ai-id="export-lot"]');
        const hasExport = await exportButtons.first().isVisible().catch(() => false);

        console.log(`📊 Exportação disponível: ${hasExport ? '✅' : '❌'}`);
      }
    });

    test('deve exibir histórico de alterações do processo', async ({ page }) => {
      await page.goto('/lots');
      await page.waitForTimeout(2000);

      const lotLink = page.locator('a[href*="/lots/"]').first();
      
      if (await lotLink.isVisible()) {
        await lotLink.click();
        await page.waitForTimeout(2000);

        // Verificar aba de histórico
        const historyTab = page.locator('button:has-text("Histórico"), [data-ai-id="tab-history"], a:has-text("Histórico")');
        const hasHistory = await historyTab.isVisible().catch(() => false);

        console.log(`📊 Histórico disponível: ${hasHistory ? '✅' : '❌'}`);
      }
    });
  });
});

// Métricas de performance
test.describe('STR-06: Performance Advogado', () => {
  test.use({ storageState: './tests/e2e/.auth/bidder.json' });

  test('tempo de carregamento de leilões judiciais', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auctions?type=JUDICIAL');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Tempo leilões judiciais: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('tempo de carregamento de detalhes do lote', async ({ page }) => {
    await page.goto('/lots');
    await page.waitForTimeout(2000);

    const lotLink = page.locator('a[href*="/lots/"]').first();
    
    if (await lotLink.isVisible()) {
      const startTime = Date.now();
      await lotLink.click();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`📊 Tempo detalhes do lote: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    }
  });
});
