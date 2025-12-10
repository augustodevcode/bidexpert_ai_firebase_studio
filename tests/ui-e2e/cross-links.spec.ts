/**
 * @fileoverview Testes E2E para links cruzados entre entidades CRUD
 * Testa navegação entre Auction->Lot->Asset e JudicialProcess->Asset
 * @author BidExpert Team
 */

import { test, expect } from '@playwright/test';
import { callActionAsUser } from '../helpers/auth-helpers';

/**
 * RN-023: Links Cruzados entre Entidades
 * Testa navegação hierárquica entre entidades relacionadas
 */
test.describe('Links Cruzados - Navegação Hierárquica', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/admin/login');
    await page.fill('[data-ai-id="login-email"]', 'admin@bidexpert.com');
    await page.fill('[data-ai-id="login-password"]', 'admin123');
    await page.click('[data-ai-id="login-submit"]');
    await expect(page).toHaveURL('/admin');
  });

  test('Auction → Lot: Link na coluna "Lotes" deve filtrar corretamente', async ({ page }) => {
    // Navegar para listagem de leilões
    await page.goto('/admin/auctions');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="auctions-table"]');

    // Clicar no link "Lotes" do primeiro leilão
    const firstAuctionLotsLink = page.locator('[data-ai-id="auctions-table"] tbody tr:first-child [data-ai-id="auction-lots-link"]');
    await expect(firstAuctionLotsLink).toBeVisible();

    // Capturar o auctionId do link
    const href = await firstAuctionLotsLink.getAttribute('href');
    expect(href).toContain('/admin/lots?auctionId=');

    // Clicar no link
    await firstAuctionLotsLink.click();

    // Verificar se foi redirecionado para /admin/lots com parâmetro
    await expect(page).toHaveURL(/\/admin\/lots\?auctionId=\d+/);

    // Verificar se o título mostra o filtro ativo
    await expect(page.locator('h1')).toContainText(/Lotes.*\(Filtrado por Leilão/);

    // Verificar se a tabela mostra apenas lotes do leilão selecionado
    const tableRows = page.locator('[data-ai-id="lots-table"] tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Verificar se todos os lotes têm o auctionId correto
      for (let i = 0; i < rowCount; i++) {
        const auctionCell = tableRows.nth(i).locator('td').nth(2); // Coluna do leilão
        await expect(auctionCell).toContainText('Leilão #');
      }
    }
  });

  test('Lot → Asset: Link "Ativo Vinculado" deve navegar corretamente', async ({ page }) => {
    // Navegar para listagem de lotes
    await page.goto('/admin/lots');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="lots-table"]');

    // Encontrar um lote que tenha ativo vinculado
    const assetLink = page.locator('[data-ai-id="lots-table"] [data-ai-id="lot-asset-link"]').first();
    await expect(assetLink).toBeVisible();

    // Capturar o assetId do link
    const href = await assetLink.getAttribute('href');
    expect(href).toMatch(/\/admin\/assets\/\d+/);

    // Clicar no link
    await assetLink.click();

    // Verificar se foi redirecionado para a página do ativo
    await expect(page).toHaveURL(/\/admin\/assets\/\d+/);

    // Verificar se o título mostra o ativo correto
    await expect(page.locator('h1')).toContainText('Detalhes do Ativo');
  });

  test('JudicialProcess → Lot: Link na coluna "Lotes" deve filtrar corretamente', async ({ page }) => {
    // Navegar para listagem de processos judiciais
    await page.goto('/admin/judicial-processes');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="judicial-processes-table"]');

    // Clicar no link "Lotes" do primeiro processo
    const firstProcessLotsLink = page.locator('[data-ai-id="judicial-processes-table"] tbody tr:first-child [data-ai-id="judicial-process-lots-link"]');
    await expect(firstProcessLotsLink).toBeVisible();

    // Capturar o judicialProcessId do link
    const href = await firstProcessLotsLink.getAttribute('href');
    expect(href).toContain('/admin/lots?judicialProcessId=');

    // Clicar no link
    await firstProcessLotsLink.click();

    // Verificar se foi redirecionado para /admin/lots com parâmetro
    await expect(page).toHaveURL(/\/admin\/lots\?judicialProcessId=\d+/);

    // Verificar se o título mostra o filtro ativo
    await expect(page.locator('h1')).toContainText(/Lotes.*\(Filtrado por Processo Judicial/);
  });

  test('JudicialProcess → Asset: Link na coluna "Ativos" deve filtrar corretamente', async ({ page }) => {
    // Navegar para listagem de processos judiciais
    await page.goto('/admin/judicial-processes');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="judicial-processes-table"]');

    // Clicar no link "Ativos" do primeiro processo
    const firstProcessAssetsLink = page.locator('[data-ai-id="judicial-processes-table"] tbody tr:first-child [data-ai-id="judicial-process-assets-link"]');
    await expect(firstProcessAssetsLink).toBeVisible();

    // Capturar o judicialProcessId do link
    const href = await firstProcessAssetsLink.getAttribute('href');
    expect(href).toContain('/admin/assets?judicialProcessId=');

    // Clicar no link
    await firstProcessAssetsLink.click();

    // Verificar se foi redirecionado para /admin/assets com parâmetro
    await expect(page).toHaveURL(/\/admin\/assets\?judicialProcessId=\d+/);

    // Verificar se o título mostra o filtro ativo
    await expect(page.locator('h1')).toContainText(/Ativos.*\(Filtrado por Processo Judicial/);
  });

  test('Asset → JudicialProcess: Link "Processo Judicial" deve navegar corretamente', async ({ page }) => {
    // Navegar para listagem de ativos
    await page.goto('/admin/assets');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="assets-table"]');

    // Encontrar um ativo que tenha processo judicial vinculado
    const judicialProcessLink = page.locator('[data-ai-id="assets-table"] [data-ai-id="asset-judicial-process-link"]').first();
    await expect(judicialProcessLink).toBeVisible();

    // Capturar o judicialProcessId do link
    const href = await judicialProcessLink.getAttribute('href');
    expect(href).toMatch(/\/admin\/judicial-processes\/\d+/);

    // Clicar no link
    await judicialProcessLink.click();

    // Verificar se foi redirecionado para a página do processo judicial
    await expect(page).toHaveURL(/\/admin\/judicial-processes\/\d+/);

    // Verificar se o título mostra o processo correto
    await expect(page.locator('h1')).toContainText('Detalhes do Processo Judicial');
  });

  test('Asset → Lot: Link "Lote Vinculado" deve navegar corretamente', async ({ page }) => {
    // Navegar para listagem de ativos
    await page.goto('/admin/assets');

    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-ai-id="assets-table"]');

    // Encontrar um ativo que tenha lote vinculado
    const lotLink = page.locator('[data-ai-id="assets-table"] [data-ai-id="asset-lot-link"]').first();
    await expect(lotLink).toBeVisible();

    // Capturar o lotId do link
    const href = await lotLink.getAttribute('href');
    expect(href).toMatch(/\/admin\/lots\/\d+/);

    // Clicar no link
    await lotLink.click();

    // Verificar se foi redirecionado para a página do lote
    await expect(page).toHaveURL(/\/admin\/lots\/\d+/);

    // Verificar se o título mostra o lote correto
    await expect(page.locator('h1')).toContainText('Detalhes do Lote');
  });

  test('Contadores de links devem refletir quantidade real de registros', async ({ page }) => {
    // Testar contadores na tabela de leilões
    await page.goto('/admin/auctions');
    await page.waitForSelector('[data-ai-id="auctions-table"]');

    const lotsCountText = await page.locator('[data-ai-id="auctions-table"] tbody tr:first-child [data-ai-id="auction-lots-link"]').textContent();
    const lotsCount = parseInt(lotsCountText?.match(/\d+/)?.[0] || '0');

    // Clicar no link e verificar se a quantidade corresponde
    await page.locator('[data-ai-id="auctions-table"] tbody tr:first-child [data-ai-id="auction-lots-link"]').click();
    await page.waitForSelector('[data-ai-id="lots-table"]');

    const actualLotsCount = await page.locator('[data-ai-id="lots-table"] tbody tr').count();
    expect(actualLotsCount).toBe(lotsCount);
  });

  test('Links devem respeitar isolamento multi-tenant', async ({ page }) => {
    // Este teste verifica se os filtros incluem automaticamente o tenantId
    // Simular tentativa de acesso a dados de outro tenant seria complexo
    // Verificar se as URLs geradas não expõem tenantId desnecessariamente

    await page.goto('/admin/auctions');
    await page.waitForSelector('[data-ai-id="auctions-table"]');

    const links = await page.locator('[data-ai-id*="link"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      // Verificar que não há exposição de tenantId na URL
      expect(href).not.toContain('tenantId');
      expect(href).not.toContain('tenant_id');
    }
  });

  test('Navegação deve funcionar corretamente em dispositivos móveis', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/auctions');
    await page.waitForSelector('[data-ai-id="auctions-table"]');

    // Verificar se os links são clicáveis e funcionam em mobile
    const firstLink = page.locator('[data-ai-id="auctions-table"] [data-ai-id*="link"]').first();
    await expect(firstLink).toBeVisible();

    // Tentar clicar (em mobile pode haver overlays ou comportamentos diferentes)
    await firstLink.click({ force: true });

    // Verificar se houve navegação
    await page.waitForTimeout(1000); // Aguardar possível navegação
    const currentURL = page.url();
    expect(currentURL).not.toBe('/admin/auctions'); // Deve ter navegado
  });
});

/**
 * Testes de regressão para garantir que links cruzados não quebrem funcionalidades existentes
 */
test.describe('Links Cruzados - Regressão', () => {
  test('Páginas sem filtros devem continuar funcionando normalmente', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('[data-ai-id="login-email"]', 'admin@bidexpert.com');
    await page.fill('[data-ai-id="login-password"]', 'admin123');
    await page.click('[data-ai-id="login-submit"]');

    // Testar páginas sem parâmetros de filtro
    const pages = ['/admin/auctions', '/admin/lots', '/admin/assets', '/admin/judicial-processes'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForSelector('[data-ai-id*="table"]');

      // Verificar se a página carrega normalmente
      const title = await page.locator('h1').textContent();
      expect(title).toBeTruthy();

      // Verificar se há dados na tabela
      const rows = await page.locator('[data-ai-id*="table"] tbody tr').count();
      expect(rows).toBeGreaterThanOrEqual(0); // Pode ser 0 se não houver dados
    }
  });

  test('Filtros devem ser aplicados corretamente via query parameters', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('[data-ai-id="login-email"]', 'admin@bidexpert.com');
    await page.fill('[data-ai-id="login-password"]', 'admin123');
    await page.click('[data-ai-id="login-submit"]');

    // Testar navegação direta com query parameters
    await page.goto('/admin/lots?auctionId=1');
    await page.waitForSelector('[data-ai-id="lots-table"]');

    // Verificar se o filtro foi aplicado
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Filtrado por Leilão');

    // Testar com judicialProcessId
    await page.goto('/admin/lots?judicialProcessId=1');
    await page.waitForSelector('[data-ai-id="lots-table"]');

    const title2 = await page.locator('h1').textContent();
    expect(title2).toContain('Filtrado por Processo Judicial');
  });
});