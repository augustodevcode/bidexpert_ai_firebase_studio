// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {

  test.beforeEach(async ({ page }) => {
    // This action has to be performed on a page before navigation.
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Now, navigate to the page.
    await page.goto('/');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    // Assert: Check if the main title "BidExpert" is visible.
    const title = page.getByText('BidExpert').first();
    await expect(title).toBeVisible({ timeout: 15000 });
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    // Assert: Wait for the section title to be visible.
    const lotsSectionTitle = page.locator('h2:text-matches(/Lotes em Destaque|Lotes Recentes/)');
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });

    // Assert: Check if there's at least one lot card visible within that section
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstLotCard).toBeVisible({ timeout: 5000 });
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    // Assert: Wait for the section title to be visible.
    const auctionsSectionTitle = page.locator('h2:text-matches(/Leilões em Destaque|Leilões Recentes/)');
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 15000 });
  
    // Assert: Check if there is at least one auction card visible.
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 5000 });
  });

});
