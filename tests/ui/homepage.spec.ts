// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {

  // Before each test, set the local storage to bypass the setup page
  test.beforeEach(async ({ page }) => {
    // This action has to be performed on a page before navigation.
    // It's a common pattern for setting up state before the app loads.
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Now, navigate to the page. The init script will run before any of the page's scripts.
    await page.goto('/');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    // Assert: Check if the main title "BidExpert" is visible.
    // Using a flexible text selector that is more resilient to HTML structure changes.
    const title = page.getByText('BidExpert').first();
    await expect(title).toBeVisible({ timeout: 15000 }); // Wait up to 15s for the title
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    // Assert: Wait for the section title to be visible. This indicates data has loaded.
    const lotsSectionTitle = page.locator('h2:text-matches(/Lotes em Destaque|Lotes Recentes/)');
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });

    // Assert: Check if there's at least one lot card visible within that section
    // The locator finds the section title and then looks for a card within its sibling div.
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
