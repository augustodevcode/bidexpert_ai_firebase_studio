/**
 * @fileoverview Testes E2E para validar a presença de dados do banco nas telas principais.
 * BDD: Garantir que dados seed do ambiente demo aparecem nas telas públicas e administrativas.
 * TDD: Validar carregamento e exibição mínima de registros nas listas e detalhes.
 */
import { beforeAll, describe, expect, test } from 'vitest';
import { page, server } from 'vitest/browser';

const BASE_URL = 'http://demo.servidor:9005';

const waitForTableRows = async (testId: string) => {
  await server.commands.waitForSelector(`[data-testid="${testId}"]`);
  await server.commands.waitForSelector(`[data-testid="${testId}"] tbody tr`);

  const rows = page.getByTestId(testId).locator('tbody tr');
  const firstRowText = (await rows.first().textContent()) || '';
  expect(firstRowText).not.toContain('Carregando');
  expect(firstRowText).not.toContain('Erro');
};

const loginAsAdmin = async () => {
  await server.commands.navigate(`${BASE_URL}/auth/login`);
  await server.commands.fillInput('[data-ai-id="auth-login-email-input"]', 'admin@bidexpert.com');
  await server.commands.fillInput('[data-ai-id="auth-login-password-input"]', 'admin123');
  await server.commands.clickElement('[data-ai-id="auth-login-submit-button"]');
  await server.commands.waitForSelector('[data-ai-id="user-dashboard-sidebar"]');
};

beforeAll(async () => {
  await page.viewport(1440, 900);
});

describe.skip('E2E - Validação de dados públicos', () => {
  test('Home exibe leilões e lotes publicados', async () => {
    await server.commands.navigate(`${BASE_URL}/`);
    await server.commands.waitForSelector('[data-testid="auction-card"]');
    await server.commands.waitForSelector('[data-testid="lot-card"]');

    const auctionCards = page.getByTestId('auction-card');
    const lotCards = page.getByTestId('lot-card');

    expect(await auctionCards.count()).toBeGreaterThan(0);
    expect(await lotCards.count()).toBeGreaterThan(0);
  });

  test('Detalhe do leilão exibe lotes', async () => {
    await server.commands.navigate(`${BASE_URL}/`);
    await server.commands.waitForSelector('[data-testid="auction-card"] a[href^="/auctions/"]');
    await server.commands.clickElement('[data-testid="auction-card"] a[href^="/auctions/"]');
    await server.commands.waitForSelector('[data-testid="lot-card"]');

    const lotCards = page.getByTestId('lot-card');
    expect(await lotCards.count()).toBeGreaterThan(0);
  });

  test('Detalhe do lote exibe informações essenciais', async () => {
    await server.commands.navigate(`${BASE_URL}/`);
    await server.commands.waitForSelector('[data-testid="lot-card"] a[href*="/lots/"]');
    await server.commands.clickElement('[data-testid="lot-card"] a[href*="/lots/"]');
    await server.commands.waitForSelector('text=Informações do Leilão');
    await server.commands.waitForSelector('text=Detalhes do Lote');

    await expect(page.getByText('Informações do Leilão')).toBeVisible();
    await expect(page.getByText('Detalhes do Lote')).toBeVisible();
  });
});

describe.skip('E2E - Validação de dados administrativos', () => {
  test('Listas administrativas carregam registros do banco', async () => {
    await loginAsAdmin();

    await server.commands.navigate(`${BASE_URL}/admin/auctions`);
    await waitForTableRows('auctions-table');

    await server.commands.navigate(`${BASE_URL}/admin/lots`);
    await waitForTableRows('lots-table');

    await server.commands.navigate(`${BASE_URL}/admin/assets`);
    await waitForTableRows('assets-table');

    await server.commands.navigate(`${BASE_URL}/admin/judicial-processes`);
    await waitForTableRows('judicial-processes-table');
  });
});
