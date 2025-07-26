// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {

  test.beforeEach(async ({ page }) => {
    // This script runs in the browser context, before the page loads.
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Now, navigate to the page. The init script will run before any of the page's scripts.
    await page.goto('/');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    // A robust selector for the main brand link in the header.
    const title = page.getByRole('link', { name: 'BidExpert' }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    // Assert: Wait for the section title to be visible. This is more robust than a regex.
    const lotsSectionTitle = page.getByRole('heading', { name: 'Lotes em Destaque' }).or(page.getByRole('heading', { name: 'Lotes Recentes' }));
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });
  
    // Assert: Check if there is at least one lot card visible.
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstLotCard).toBeVisible({ timeout: 5000 });
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    // Assert: Wait for the section title to be visible.
    const auctionsSectionTitle = page.getByRole('heading', { name: 'Leilões em Destaque' }).or(page.getByRole('heading', { name: 'Leilões Recentes' }));
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 15000 });
  
    // Assert: Check if there is at least one auction card visible.
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 5000 });
  });

});
