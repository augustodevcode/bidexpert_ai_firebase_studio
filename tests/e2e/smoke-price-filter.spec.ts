/**
 * @file smoke-price-filter.spec.ts
 * @description Smoke tests for price range filter (slider-based) and
 * "Aplicar Filtros" button on the /search page.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke: Price Range Filter', () => {
  test('should load /search page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 45000 });

    await expect(page).toHaveTitle(/.+/, { timeout: 15000 });

    // Page should not have JS errors from our filter components
    const criticalErrors = errors.filter(
      (e) => e.includes('BidExpertFilter') || e.includes('pricePoints') || e.includes('filteredWithoutPrice')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should render the filter panel on /search', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // BidExpertFilter is loaded via dynamic() with ssr:false — wait for hydration
    const filterPanel = page.locator('[data-ai-id="bidexpert-filter-container"]');
    await expect(filterPanel).toBeVisible({ timeout: 25000 });
  });

  test('should show "Aplicar Filtros" button', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for BidExpertFilter dynamic() hydration
    const filterPanel = page.locator('[data-ai-id="bidexpert-filter-container"]');
    await expect(filterPanel).toBeVisible({ timeout: 25000 });

    // The "Aplicar Filtros" button is always visible in the current implementation
    const applyButton = page.locator('[data-ai-id="bidexpert-filter-apply-btn"]');
    await expect(applyButton).toBeVisible({ timeout: 5000 });
  });

  test('should show price range slider section', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for BidExpertFilter hydration — price section uses a slider with
    // data-ai-id="filter-price-section" and min/max display labels
    await expect(
      page.locator('[data-ai-id="filter-price-section"]')
    ).toBeVisible({ timeout: 25000 });

    // Price slider must be present
    const priceSlider = page.locator('[data-ai-id="filter-price-slider"]');
    await expect(priceSlider).toBeVisible({ timeout: 5000 });

    // Min price display label must exist
    const minDisplay = page.locator('[data-ai-id="filter-price-min-display"]');
    await expect(minDisplay).toBeVisible({ timeout: 5000 });
  });
});
