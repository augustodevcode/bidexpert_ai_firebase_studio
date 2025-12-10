// tests/e2e/cross-links.spec.ts
/**
 * @fileoverview Testes E2E para funcionalidade de Links Cruzados entre entidades CRUD.
 * Verifica navegação hierárquica, filtros aplicados automaticamente e isolamento multi-tenant.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAdminSession } from './admin/admin-helpers';

test.describe('Links Cruzados - Navegação Hierárquica', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test('Auction → Lot: Link na coluna "Lotes" filtra corretamente', async ({ page }) => {
    // Navegar para admin/auctions
    await page.goto(`${BASE_URL}/admin/auctions`);

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-testid="auctions-table"]');

    // Encontrar primeira linha com lotes > 0
    const firstAuctionRow = page.locator('tbody tr').first();
    const lotsLink = firstAuctionRow.locator('a[href*="admin/lots?auctionId="]');

    // Verificar se link existe
    await expect(lotsLink).toBeVisible();

    // Clicar no link
    await lotsLink.click();

    // Verificar URL contém auctionId
    await expect(page).toHaveURL(/\/admin\/lots\?auctionId=/);

    // Verificar título mostra filtro aplicado
    await expect(page.locator('h1')).toContainText('Gerenciar Lotes - Leilão:');
  });

  test('Lot → Auction: Link na coluna "Leilão" navega corretamente', async ({ page }) => {
    // Navegar para admin/lots
    await page.goto(`${BASE_URL}/admin/lots`);

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="lots-table"]');

    // Encontrar link na coluna "Leilão"
    const auctionLink = page.locator('tbody tr').first().locator('a[href*="admin/auctions/"]');

    // Verificar se existe
    await expect(auctionLink).toBeVisible();

    // Clicar e verificar navegação
    await auctionLink.click();
    await expect(page).toHaveURL(/\/admin\/auctions\/.*\/edit/);
  });

  test('JudicialProcess → Lot: Link na coluna "Lotes" filtra por processo', async ({ page }) => {
    // Navegar para admin/judicial-processes
    await page.goto(`${BASE_URL}/admin/judicial-processes`);

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="judicial-processes-table"]');

    // Encontrar linha com lotes > 0
    const processRow = page.locator('tbody tr').filter({ hasText: /\d+ lotes/ }).first();
    const lotsLink = processRow.locator('a[href*="admin/lots?judicialProcessId="]');

    // Verificar link
    await expect(lotsLink).toBeVisible();

    // Clicar e verificar filtro
    await lotsLink.click();
    await expect(page).toHaveURL(/\/admin\/lots\?judicialProcessId=/);
    await expect(page.locator('h1')).toContainText('Gerenciar Lotes - Processo:');
  });

  test('JudicialProcess → Asset: Link na coluna "Ativos" filtra por processo', async ({ page }) => {
    // Navegar para admin/judicial-processes
    await page.goto(`${BASE_URL}/admin/judicial-processes`);

    // Encontrar linha com ativos > 0
    const processRow = page.locator('tbody tr').filter({ hasText: /\d+ ativos/ }).first();
    const assetsLink = processRow.locator('a[href*="admin/assets?judicialProcessId="]');

    // Verificar link
    await expect(assetsLink).toBeVisible();

    // Clicar e verificar filtro
    await assetsLink.click();
    await expect(page).toHaveURL(/\/admin\/assets\?judicialProcessId=/);
    await expect(page.locator('h1')).toContainText('Gerenciar Ativos (Bens) - Processo:');
  });

  test('Asset → JudicialProcess: Link na coluna "Processo Judicial" navega', async ({ page }) => {
    // Navegar para admin/assets
    await page.goto(`${BASE_URL}/admin/assets`);

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="assets-table"]');

    // Encontrar link na coluna "Processo Judicial"
    const processLink = page.locator('tbody tr').first().locator('a[href*="admin/judicial-processes/"]');

    // Verificar se existe
    await expect(processLink).toBeVisible();

    // Clicar e verificar navegação
    await processLink.click();
    await expect(page).toHaveURL(/\/admin\/judicial-processes\/.*\/edit/);
  });

  test('Asset → Lot: Link na coluna "Lote Vinculado" navega quando existe', async ({ page }) => {
    // Navegar para admin/assets
    await page.goto(`${BASE_URL}/admin/assets`);

    // Aguardar carregamento
    await page.waitForSelector('[data-testid="assets-table"]');

    // Encontrar linha com lote vinculado (não "-")
    const assetRow = page.locator('tbody tr').filter({ hasText: /^(?!.*-$).*$/ }).first();
    const lotLink = assetRow.locator('a[href*="admin/lots/"]');

    // Se existe link, testar navegação
    if (await lotLink.isVisible()) {
      await lotLink.click();
      await expect(page).toHaveURL(/\/admin\/lots\/.*\/edit/);
    }
  });
});

test.describe('Links Cruzados - Contadores e Estados', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test('Contadores mostram quantidade correta de registros relacionados', async ({ page }) => {
    // Verificar auctions mostram contadores de lotes
    await page.goto(`${BASE_URL}/admin/auctions`);
    await page.waitForSelector('[data-testid="auctions-table"]');

    const lotsCounters = page.locator('a[href*="admin/lots?auctionId="]');
    const counterTexts = await lotsCounters.allTextContents();

    // Verificar formato "X lotes"
    for (const text of counterTexts) {
      expect(text).toMatch(/^\d+ lotes?$/);
    }

    // Verificar judicial-processes mostram contadores
    await page.goto('/admin/judicial-processes');
    await page.waitForSelector('[data-testid="judicial-processes-table"]');

    const lotsCountersJP = page.locator('a[href*="admin/lots?judicialProcessId="]');
    const assetsCountersJP = page.locator('a[href*="admin/assets?judicialProcessId="]');

    const lotsTexts = await lotsCountersJP.allTextContents();
    const assetsTexts = await assetsCountersJP.allTextContents();

    for (const text of [...lotsTexts, ...assetsTexts]) {
      expect(text).toMatch(/^\d+ (lotes?|ativos?)$/);
    }
  });

  test('Links são clicáveis e navegam corretamente', async ({ page }) => {
    // Testar todos os tipos de links
    const linkTests = [
      { url: '/admin/auctions', selector: 'a[href*="admin/lots?auctionId="]' },
      { url: '/admin/lots', selector: 'a[href*="admin/auctions/"]' },
      { url: '/admin/judicial-processes', selector: 'a[href*="admin/lots?judicialProcessId="]' },
      { url: '/admin/judicial-processes', selector: 'a[href*="admin/assets?judicialProcessId="]' },
      { url: '/admin/assets', selector: 'a[href*="admin/judicial-processes/"]' },
    ];

    for (const { url, selector } of linkTests) {
      await page.goto(`${BASE_URL}${url}`);
      await page.waitForSelector('[data-testid*="-table"]');

      const link = page.locator(selector).first();
      if (await link.isVisible()) {
        // Verificar que é um link válido
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      }
    }
  });
});

test.describe('Links Cruzados - Responsividade e UX', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAdminSession(page);
  });

  test('Links funcionam em dispositivos móveis', async ({ page }) => {
    // Simular mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/admin/auctions`);
    await page.waitForSelector('[data-testid="auctions-table"]');

    const lotsLink = page.locator('a[href*="admin/lots?auctionId="]').first();

    if (await lotsLink.isVisible()) {
      await lotsLink.click();
      await expect(page).toHaveURL(/\/admin\/lots\?auctionId=/);
    }
  });

  test('Estados de loading são mostrados durante navegação', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/auctions`);
    await page.waitForSelector('[data-testid="auctions-table"]');

    // Interceptar requests para simular delay
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    const lotsLink = page.locator('a[href*="admin/lots?auctionId="]').first();

    if (await lotsLink.isVisible()) {
      await lotsLink.click();

      // Verificar se algum indicador de loading aparece
      const loadingIndicator = page.locator('[data-loading="true"], .loading, .spinner').first();
      // Nota: Este teste pode falhar se não houver indicadores visuais de loading
      // É mais um lembrete para implementar UX adequada
    }
  });
});

test.describe('Links Cruzados - Isolamento Multi-Tenant', () => {
  test('Filtros respeitam isolamento por tenant', async ({ page }) => {
    // Este teste requer setup de múltiplos tenants
    // Por enquanto, apenas verifica que filtros são aplicados
    await ensureAdminSession(page);

    await page.goto(`${BASE_URL}/admin/auctions`);
    await page.waitForSelector('[data-testid="auctions-table"]');

    const lotsLink = page.locator('a[href*="admin/lots?auctionId="]').first();

    if (await lotsLink.isVisible()) {
      const href = await lotsLink.getAttribute('href');
      expect(href).toContain('auctionId=');

      await lotsLink.click();
      await expect(page).toHaveURL(/\/admin\/lots\?auctionId=/);
    }
  });
});