/**
 * @fileoverview Valida a projecao publica do leilao judicial publicado durante o ciclo cadastral.
 */

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const PUBLISHED_AUCTION_PATH = '/auctions/AUC-2026-0117';
const PUBLISHED_LOT_PATH = '/auctions/239/lots/LOTE-0163';
const AUCTION_TITLE = '1ª Vara Cível da Comarca de Jaboticabal/SP';
const LOT_TITLE = 'Fiat/Uno Mille Way Econ, 09/10, cor prata';
const LOT_LOCATION = 'Rua Luiz Fernando Campos, 68, Jardim Elite';
const LOT_DESCRIPTION_SNIPPET = 'Eduardo Costa Wiezel, representante legal da executada';

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

test.describe('Projecao publica do leilao judicial cadastrado via wizard', () => {
  test.setTimeout(120_000);

  test('hero resolve a proxima praca correta e deriva o lance minimo na pagina do leilao', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://demo.localhost:9006';

    await page.goto(`${baseUrl}${PUBLISHED_AUCTION_PATH}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: AUCTION_TITLE })).toBeVisible({ timeout: 60_000 });

    const mainText = normalizeText(await page.locator('main').innerText());

    expect(mainText).toContain(`Em Breve ⚖️ Judicial 1ª Praça ${AUCTION_TITLE}`);
    expect(mainText).toContain('Lance Mín. R$ 12.232,20');
    expect(mainText).toContain('Cronograma de Praças');

    const timeline = page.locator('[data-ai-id="bidexpert-auction-timeline"]').first();
    await expect(timeline).toBeVisible();
    await expect(timeline).toContainText(/1ª Praça\s*Em breve\s*01\/04 - 13:00/i);
    await expect(timeline).toContainText(/2ª Praça\s*Em breve\s*22\/04 - 13:00/i);

    const lotsTab = page.getByRole('tab', { name: /Lotes 1/i });
    await expect(lotsTab).toBeVisible();
    await lotsTab.click();

    const lotsPanel = page.getByRole('tabpanel', { name: /Lotes 1/i });
    await expect(lotsPanel).toContainText(LOT_TITLE);
    await expect(lotsPanel).toContainText(LOT_LOCATION);
    await expect(lotsPanel).toContainText('Lance Inicial');
    await expect(lotsPanel).toContainText('R$ 12.232,20');
  });

  test('detalhe do lote herda descricao e localizacao do ativo vinculado', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://demo.localhost:9006';

    await page.goto(`${baseUrl}${PUBLISHED_LOT_PATH}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: new RegExp(LOT_TITLE, 'i') })).toBeVisible({ timeout: 60_000 });

    const body = page.locator('body');
    await expect(body).toContainText(`Localização: ${LOT_LOCATION}`);
    await expect(body).not.toContainText('Nenhuma descrição detalhada fornecida para este lote.');
    await expect(body).toContainText(LOT_DESCRIPTION_SNIPPET);
  });

  test('detalhe do lote exibe planejamento financeiro com proximo lance valido', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://demo.localhost:9006';

    await page.goto(`${baseUrl}${PUBLISHED_LOT_PATH}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: new RegExp(LOT_TITLE, 'i') })).toBeVisible({ timeout: 60_000 });

    await expect(page.locator('[data-ai-id="lot-v2-planning-card"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lot-v2-planning-card-minimum-bid"]')).toContainText('R$ 12.232,20');
    await expect(page.locator('[data-ai-id="lot-v2-planning-card-total-due"]')).toContainText('R$');

  const planningTab = page
    .locator('[data-ai-id="lot-v2-open-planning-tab"]')
    .or(page.getByRole('tab', { name: 'Planejamento' }));
  await planningTab.first().click();

    const planningPanel = page.locator('[data-ai-id="lot-v2-planning-tab-panel"]');
    await expect(planningPanel).toBeVisible();
    await expect(planningPanel).toContainText('Planejamento financeiro do lance');
    await expect(page.locator('[data-ai-id="lot-v2-planning-minimum-bid"]')).toContainText('R$ 12.232,20');
    await expect(page.locator('[data-ai-id="lot-v2-planning-total-due"]')).toContainText('R$');
    await expect(planningPanel).toContainText(/custos adicionais de transferência, cartório, tributos, retirada e vistoria/i);
  });
});