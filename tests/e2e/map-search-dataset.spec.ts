// tests/e2e/map-search-dataset.spec.ts
import { test, expect, type Page } from '@playwright/test';

const PAGE_URL = '/map-search';

async function waitForListHydration(page: Page) {
  await expect(page.locator('[data-ai-id="map-search-list"]')).toBeVisible();
  // Wait for at least one item to be rendered, indicating data load
  try {
    await expect(page.locator('[data-ai-id="map-search-list-item"]').first()).toBeVisible({ timeout: 10000 });
  } catch (e) {
    console.log('Warning: No list items found during hydration wait');
  }
  await page.waitForTimeout(1000);
}

test.describe('Map Search dataset interactions', () => {
  test('resets filters after synthetic bounds change', async ({ page }) => {
    await page.goto(PAGE_URL);
    await waitForListHydration(page);

    const listItems = page.locator('[data-ai-id="map-search-list-item"]');
    const initialCount = await listItems.count();
    expect(initialCount).toBeGreaterThan(0);

    await page.evaluate(() => {
      // Move map to Antarctica where there are no lots
      if ((window as any).__BIDEXPERT_MAP_SEARCH_DEBUG) {
        (window as any).__BIDEXPERT_MAP_SEARCH_DEBUG.setView({ center: [-82.8628, 135.0000], zoom: 10 });
      } else {
        // Fallback if debug helper is not available (e.g. production build)
        window.dispatchEvent(new CustomEvent('bidexpert-map-visible-ids', { detail: [] }));
      }
    });

    // Wait for the map to settle and filters to apply
    await page.waitForTimeout(1000); 

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
