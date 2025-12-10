// tests/e2e/map-search-dataset.spec.ts
import { test, expect, type Page } from '@playwright/test';

const PAGE_URL = '/map-search';

async function waitForListHydration(page: Page) {
  await expect(page.locator('[data-ai-id="map-search-list"]')).toBeVisible();
  await page.waitForTimeout(500);
}

test.describe('Map Search dataset interactions', () => {
  test('resets filters after synthetic bounds change', async ({ page }) => {
    await page.goto(PAGE_URL);
    await waitForListHydration(page);

    const listItems = page.locator('[data-ai-id="map-search-list-item"]');
    const initialCount = await listItems.count();
    expect(initialCount).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('bidexpert-map-visible-ids', { detail: [] }));
    });

    await expect(page.locator('[data-ai-id="map-search-count"]')).toContainText('0');
    await expect(listItems).toHaveCount(0);

    await page.locator('[data-ai-id="map-search-form"]').waitFor({ state: 'visible' }).catch(() => undefined);
    await page.click('[data-ai-id="map-reset-filter"]');
    await expect(listItems).not.toHaveCount(0);
  });

  test('dataset toggles swap contexts', async ({ page }) => {
    await page.goto(PAGE_URL);
    await waitForListHydration(page);

    const directSaleTab = page.locator('[data-ai-id="map-dataset-toggle-direct_sale"]');
    await directSaleTab.click();
    await expect(directSaleTab).toHaveAttribute('data-state', 'active');

    const tomadaTab = page.locator('[data-ai-id="map-dataset-toggle-tomada_de_precos"]');
    await tomadaTab.click();
    await expect(tomadaTab).toHaveAttribute('data-state', 'active');
  });
});
