// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Test', () => {

  test('should load the homepage and display the main title', async ({ page }) => {
    // Act: Navigate to the homepage
    await page.goto('/');

    // Assert: Check if the main title "BidExpert" is visible in a prominent heading.
    // We target a heading (h1, h2, etc.) containing "BidExpert" to ensure it's a main title.
    const title = page.locator('h1:has-text("BidExpert"), h2:has-text("BidExpert"), a:has-text("BidExpert") >> nth=0');
    await expect(title).toBeVisible();
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    // Act: Navigate to the homepage
    await page.goto('/');

    // Assert: Check for either "Lotes em Destaque" or "Lotes Recentes"
    const lotsSectionTitle = page.locator('h2:text-matches(/Lotes em Destaque|Lotes Recentes/)');
    await expect(lotsSectionTitle).toBeVisible();

    // Assert: Check if there's at least one lot card visible within that section
    // This uses a relative locator to find a card within the section found above.
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('.group').first();
    await expect(firstLotCard).toBeVisible();
  });

  test('should display featured auctions or recent auctions section', async ({ page }) => {
    // Act: Navigate to the homepage
    await page.goto('/');

    // Assert: Check for either "Leilões em Destaque" or "Leilões Recentes"
    const auctionsSectionTitle = page.locator('h2:text-matches(/Leilões em Destaque|Leilões Recentes/)');
    await expect(auctionsSectionTitle).toBeVisible();

    // Assert: Check if there is at least one auction card visible
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('.group').first();
    await expect(firstAuctionCard).toBeVisible();
  });

});
