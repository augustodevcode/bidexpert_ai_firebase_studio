/**
 * @file smoke-price-filter.spec.ts
 * @description Smoke tests for Booking.com-style price range filter with
 * histogram bars and auto-apply behavior on the /search page.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke: Price Range Filter (Booking.com style)', () => {
  test('should load /search page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 45000 });

    await expect(page).toHaveTitle(/.+/, { timeout: 15000 });

    // Page should not have JS errors from our filter components
    const criticalErrors = errors.filter(
      (e) => e.includes('PriceRangeBooking') || e.includes('pricePoints') || e.includes('filteredWithoutPrice')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should render the filter panel on /search', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // BidExpertFilter is loaded via dynamic() with ssr:false — wait for hydration
    // The container uses data-ai-id="bidexpert-filter-container"
    const filterPanel = page.locator('[data-ai-id="bidexpert-filter-container"]');
    await expect(filterPanel).toBeVisible({ timeout: 25000 });
  });

  test('should not show "Aplicar Filtros" button when autoApply is active', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Wait for any lazy-loaded content
    await page.waitForTimeout(3000);

    // The "Aplicar Filtros" button should NOT be visible (autoApply=true removes it)
    const applyButton = page.getByRole('button', { name: /aplicar filtros/i });
    await expect(applyButton).toHaveCount(0);
  });

  test('should show price range filter accordion or inputs', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for BidExpertFilter dynamic() hydration — price accordion is open by default
    // (defaultValue includes 'price' in the Accordion component)
    // PriceRangeBooking renders with data-ai-id="filter-price-booking"
    // and always shows min/max inputs (data-ai-id="filter-price-min-input")
    await expect(
      page.locator('[data-ai-id="filter-price-booking"]')
    ).toBeVisible({ timeout: 25000 });

    // Min price input must be present and editable
    const minInput = page.locator('[data-ai-id="filter-price-min-input"]');
    await expect(minInput).toBeVisible({ timeout: 5000 });
  });
});
