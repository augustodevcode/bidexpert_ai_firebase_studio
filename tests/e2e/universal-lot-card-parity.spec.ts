/**
 * @fileoverview Valida a paridade do card universal de lotes nas superfícies
 * públicas, no dashboard autenticado e no backoffice.
 *
 * BDD reference:
 * - tests/itsm/features/lots-page-v2.feature
 */
import type { Browser, Locator } from '@playwright/test';

import { test, expect } from './fixtures/browser-telemetry.fixture';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9006';
const FAVORITES_STORAGE_KEY = 'bidExpertFavoriteLotIds';
const RECENTLY_VIEWED_STORAGE_KEY = 'recentlyViewedLots';

async function prewarmRoute(browser: Browser, pathName: string) {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}${pathName}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
  } finally {
    await page.close();
  }
}

async function expectUniversalLotCard(card: Locator) {
  await expect(card).toBeVisible({ timeout: 60_000 });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-ai-id="card-v2-gallery"]')).toBeVisible();
  await expect(card.locator('[data-ai-id="card-v2-title"]')).toBeVisible();
  await expect(card.locator('[data-ai-id="card-v2-pricing"]')).toBeVisible();
  await expect(card.locator('[data-ai-id="card-v2-actions"]')).toBeVisible();

  const cta = card.locator('[data-ai-id="card-v2-cta"]').first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', /.+/);
}

async function extractPreparedLotId(page: Locator['page']) {
  const firstCta = page.locator('[data-ai-id="auction-lot-card-v2"] [data-ai-id="card-v2-cta"]').first();
  await expect(firstCta).toBeVisible({ timeout: 60_000 });

  const href = await firstCta.getAttribute('href');
  expect(href).toMatch(/\/auctions\/[^/]+\/lots\/[^/]+/);

  const lotId = href?.match(/\/lots\/([^/?#]+)/)?.[1];
  expect(lotId).toBeTruthy();

  return lotId as string;
}

test.describe('Universal lot card parity', () => {
  test.beforeAll(async ({ browser }) => {
    await prewarmRoute(browser, '/lots');
    await prewarmRoute(browser, '/search?type=lots');
    await prewarmRoute(browser, '/category/veiculos');
    await prewarmRoute(browser, '/auctions/AUC-2026-0117');
    await prewarmRoute(browser, '/auth/login');
  });

  test('public search and category surfaces render the universal lot card', async ({ page }) => {
    await page.goto(`${BASE_URL}/search?type=lots`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const searchCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(searchCard);

    await page.goto(`${BASE_URL}/category/veiculos`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    await expect(page).toHaveURL(/\/(search\?category=veiculos|category\/veiculos)/i, {
      timeout: 60_000,
    });

    const categoryCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(categoryCard);
  });

  test('auction lots tab reuses the universal lot card', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctions/AUC-2026-0117`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const lotsTab = page.getByRole('tab', { name: /Lotes/i }).first();
    await expect(lotsTab).toBeVisible({ timeout: 60_000 });
    await lotsTab.click();

    const auctionCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(auctionCard);
  });

  test('dashboard and admin lots surfaces keep the universal card after login', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);

    await page.goto(`${BASE_URL}/lots`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const preparedLotId = await extractPreparedLotId(page);

    await page.evaluate(({ favoritesKey, historyKey, lotId }) => {
      window.localStorage.setItem(favoritesKey, JSON.stringify([lotId]));
      window.localStorage.setItem(
        historyKey,
        JSON.stringify([{ id: lotId, timestamp: Date.now() }]),
      );
    }, {
      favoritesKey: FAVORITES_STORAGE_KEY,
      historyKey: RECENTLY_VIEWED_STORAGE_KEY,
      lotId: preparedLotId,
    });

    await page.goto(`${BASE_URL}/dashboard/favorites`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const favoritesCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(favoritesCard);

    await page.goto(`${BASE_URL}/dashboard/history`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const historyCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(historyCard);

    await page.goto(`${BASE_URL}/admin/lots`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    const adminCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expectUniversalLotCard(adminCard);
    await expect(adminCard.locator('[data-ai-id="card-v2-edit-menu"]').first()).toBeVisible();
  });
});