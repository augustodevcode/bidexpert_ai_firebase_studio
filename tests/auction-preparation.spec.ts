// tests/auction-preparation.spec.ts
/**
 * Testes E2E para a Página de Preparação do Leilão
 * 
 * Testa:
 * - Acesso à página de preparação
 * - Navegação entre abas
 * - Funcionalidades de cada aba
 * - Layout full-width
 */

import { test, expect } from '@playwright/test';

test.describe('Auction Preparation Dashboard', () => {
  let auctionId: string;

  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@teste.com');
    await page.fill('input[name="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Navegar para leilões
    await page.goto('/admin/auctions');
    await page.waitForLoadState('networkidle');

    // Pegar o primeiro leilão da lista ou criar um novo
    const firstAuctionRow = page.locator('table tbody tr').first();
    if (await firstAuctionRow.count() > 0) {
      const auctionLink = firstAuctionRow.locator('a').first();
      const href = await auctionLink.getAttribute('href');
      auctionId = href?.split('/')[3] || '';
    }
  });

  test('deve acessar página de preparação do leilão', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);
    await page.waitForLoadState('networkidle');

    // Verificar título
    await expect(page.locator('h1')).toContainText('Preparação do Leilão');

    // Verificar que as abas estão visíveis
    await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /loteamento/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /lotes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /habilitações/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /pregão/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /arremates/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /financeiro/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /marketing/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /analytics/i })).toBeVisible();
  });

  test('deve navegar entre abas', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Clicar na aba de Loteamento
    await page.getByRole('tab', { name: /loteamento/i }).click();
    await expect(page.locator('text=Loteamento de Bens')).toBeVisible();

    // Clicar na aba de Lotes
    await page.getByRole('tab', { name: /lotes/i }).click();
    await expect(page.locator('text=Lotes do Leilão')).toBeVisible();

    // Clicar na aba de Habilitações
    await page.getByRole('tab', { name: /habilitações/i }).click();
    await expect(page.locator('text=Habilitações')).toBeVisible();

    // Clicar na aba de Pregão
    await page.getByRole('tab', { name: /pregão/i }).click();
    await expect(page.locator('text=Meta de Faturamento')).toBeVisible();

    // Clicar na aba de Arremates
    await page.getByRole('tab', { name: /arremates/i }).click();
    await expect(page.locator('text=Arrematantes')).toBeVisible();

    // Clicar na aba de Financeiro
    await page.getByRole('tab', { name: /financeiro/i }).click();
    await expect(page.locator('text=Receita Total')).toBeVisible();

    // Clicar na aba de Marketing
    await page.getByRole('tab', { name: /marketing/i }).click();
    await expect(page.locator('text=Promoção no Site')).toBeVisible();

    // Clicar na aba de Analytics
    await page.getByRole('tab', { name: /analytics/i }).click();
    await expect(page.locator('text=Analytics e Relatórios')).toBeVisible();

    // Voltar para Dashboard
    await page.getByRole('tab', { name: /dashboard/i }).click();
    await expect(page.locator('text=Ações Rápidas')).toBeVisible();
  });

  test('deve exibir cards de estatísticas no dashboard', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Verificar cards de estatísticas
    await expect(page.locator('text=Total de Lotes')).toBeVisible();
    await expect(page.locator('text=Habilitados')).toBeVisible();
    await expect(page.locator('text=Lances Recebidos')).toBeVisible();
    await expect(page.locator('text=Valor Total')).toBeVisible();
  });

  test('deve mostrar estado vazio na aba de lotes', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Navegar para aba de Lotes
    await page.getByRole('tab', { name: /lotes/i }).click();

    // Verificar mensagem de estado vazio
    await expect(page.locator('text=Nenhum lote cadastrado ainda')).toBeVisible();
    await expect(page.locator('text=Criar Primeiro Lote')).toBeVisible();
  });

  test('deve mostrar estado vazio na aba de habilitações', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Navegar para aba de Habilitações
    await page.getByRole('tab', { name: /habilitações/i }).click();

    // Verificar stats cards
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Pendentes')).toBeVisible();
    await expect(page.locator('text=Aprovados')).toBeVisible();
    await expect(page.locator('text=Rejeitados')).toBeVisible();
  });

  test('deve mostrar controles de marketing', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Navegar para aba de Marketing
    await page.getByRole('tab', { name: /marketing/i }).click();

    // Verificar seções
    await expect(page.locator('text=Promoção no Site')).toBeVisible();
    await expect(page.locator('text=Anúncios Digitais')).toBeVisible();
    await expect(page.locator('text=Redes Sociais')).toBeVisible();
    await expect(page.locator('text=Email Marketing')).toBeVisible();

    // Verificar switches
    await expect(page.locator('text=Banner na Página Inicial')).toBeVisible();
    await expect(page.locator('text=Google Ads')).toBeVisible();
  });

  test('deve mostrar métricas de analytics', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Navegar para aba de Analytics
    await page.getByRole('tab', { name: /analytics/i }).click();

    // Verificar métricas principais
    await expect(page.locator('text=Visualizações')).toBeVisible();
    await expect(page.locator('text=Visitantes Únicos')).toBeVisible();
    await expect(page.locator('text=Taxa de Cliques')).toBeVisible();

    // Verificar seções
    await expect(page.locator('text=Origem do Tráfego')).toBeVisible();
    await expect(page.locator('text=Comportamento do Usuário')).toBeVisible();
    await expect(page.locator('text=Funil de Conversão')).toBeVisible();
  });

  test('deve mostrar informações financeiras', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Navegar para aba Financeiro
    await page.getByRole('tab', { name: /financeiro/i }).click();

    // Verificar cards financeiros
    await expect(page.locator('text=Receita Total')).toBeVisible();
    await expect(page.locator('text=Custos')).toBeVisible();
    await expect(page.locator('text=Comissões')).toBeVisible();
    await expect(page.locator('text=Lucro Líquido')).toBeVisible();

    // Verificar seções
    await expect(page.locator('text=Cobranças')).toBeVisible();
    await expect(page.locator('text=Notas Fiscais')).toBeVisible();
  });

  test('deve manter sidebar e header visíveis (layout correto)', async ({ page }) => {
    test.skip(!auctionId, 'Nenhum leilão disponível para teste');

    await page.goto(`/admin/auctions/${auctionId}/prepare`);

    // Verificar que o sidebar está visível
    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible();

    // Verificar que o header está visível
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Verificar que o conteúdo está presente
    await expect(page.locator('h1')).toContainText('Preparação do Leilão');
  });
});
