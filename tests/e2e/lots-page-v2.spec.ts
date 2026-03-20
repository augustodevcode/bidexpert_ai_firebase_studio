/**
 * E2E tests for the /lots page — cards grouped by auction category.
 *
 * BDD reference: tests/itsm/features/lots-page-v2.feature
 *
 * Scenarios validated:
 *  - Page renders with correct heading
 *  - Category sections appear when lots exist
 *  - Cards display essential lot information
 *  - data-ai-id attributes present for testability
 */
import { test, expect } from '@playwright/test';

/* The /lots page is public (server-rendered), no auth required */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Lots Page V2 — Category Sections', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const url = baseURL || 'http://demo.localhost:9005';
    await page.goto(`${url}/lots`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  });

  test('should render page heading', async ({ page }) => {
    const heading = page.locator('[data-ai-id="lots-page-heading"]');
    await expect(heading).toBeVisible({ timeout: 15_000 });
    await expect(heading).toContainText('Lotes em Leilão');
  });

  test('should display at least one category section', async ({ page }) => {
    const sections = page.locator('[data-ai-id^="lots-section-"]');
    await expect(sections.first()).toBeVisible({ timeout: 15_000 });
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should render auction lot cards inside sections', async ({ page }) => {
    const cards = page.locator('[data-ai-id="auction-lot-card-v2"]');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('cards should contain title and pricing', async ({ page }) => {
    const firstCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    const title = firstCard.locator('[data-ai-id="card-v2-title"]');
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();

    const pricing = firstCard.locator('[data-ai-id="card-v2-pricing"]');
    await expect(pricing).toBeVisible();
  });

  test('cards should contain location info', async ({ page }) => {
    const firstCard = page.locator('[data-ai-id="auction-lot-card-v2"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    const location = firstCard.locator('[data-ai-id="card-v2-location"]');
    await expect(location).toBeVisible();
    await expect(location).not.toBeEmpty();
  });
});
