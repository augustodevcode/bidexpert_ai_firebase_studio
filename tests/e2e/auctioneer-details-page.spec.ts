/**
 * @fileoverview E2E test for Auctioneer Details Page improvements
 * Tests that auctions display using BidExpertCard and BidExpertListItem components
 * Prerequisites:
 *  - Database must be seeded
 *  - Server running on port 9005 via npm run dev
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9005';

test.describe('Auctioneer Details Page - Component Consistency', () => {

  test('should display auctions using BidExpertCard in grid view', async ({ page }) => {
    // Navigate to an auctioneer page (assuming there's a test auctioneer)
    await page.goto(`${BASE_URL}/auctioneers/test-auctioneer`, { waitUntil: 'networkidle' });

    // Wait for the page to load
    await page.waitForSelector('[data-ai-id="auctioneer-details-page-container"]', { timeout: 30000 });

    // Check if auctions section exists
    const auctionsSection = page.locator('[data-ai-id="auctioneer-all-auctions-section"]');
    await expect(auctionsSection).toBeVisible();

    // Check if search results frame is present
    const searchFrame = page.locator('[data-testid="search-results-frame"]');
    await expect(searchFrame).toBeVisible();

    // Verify that BidExpertCard components are rendered (they should have specific data attributes)
    // Since we can't easily check internal components, we'll check for auction cards
    const auctionCards = page.locator('[data-ai-id*="auction-card-"]');
    const cardCount = await auctionCards.count();

    if (cardCount > 0) {
      // If there are auctions, verify they have proper structure
      const firstCard = auctionCards.first();
      await expect(firstCard).toBeVisible();

      // Check for typical BidExpertCard elements
      await expect(firstCard.locator('[data-ai-id="auction-card-main-image"]')).toBeVisible();
      await expect(firstCard.locator('[data-ai-id="auction-card-title"]')).toBeVisible();
    }
  });

  test('should display auctions using BidExpertListItem in list view', async ({ page }) => {
    // Navigate to auctioneer page
    await page.goto(`${BASE_URL}/auctioneers/test-auctioneer`, { waitUntil: 'networkidle' });

    // Wait for page load
    await page.waitForSelector('[data-ai-id="auctioneer-details-page-container"]', { timeout: 30000 });

    // Look for list view toggle or assume it's available
    const listViewButton = page.locator('button').filter({ hasText: 'Lista' }).or(
      page.locator('button').filter({ hasText: 'List' })
    );

    // If list view button exists, click it
    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      await page.waitForTimeout(1000); // Wait for view change
    }

    // Check for list items (BidExpertListItem should render auction data)
    const listItems = page.locator('[data-density]').or(
      page.locator('.auction-list-item')
    );

    const itemCount = await listItems.count();

    if (itemCount > 0) {
      // Verify list item structure
      const firstItem = listItems.first();
      await expect(firstItem).toBeVisible();

      // Check for typical list item elements
      await expect(firstItem.locator('h3').or(firstItem.locator('[data-ai-id*="title"]'))).toBeVisible();
    }
  });

  test('should show auctioneer profile information correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auctioneers/test-auctioneer`, { waitUntil: 'networkidle' });

    // Wait for page load
    await page.waitForSelector('[data-ai-id="auctioneer-details-page-container"]', { timeout: 30000 });

    // Check auctioneer header section
    const headerSection = page.locator('[data-ai-id="auctioneer-profile-header"]');
    await expect(headerSection).toBeVisible();

    // Verify auctioneer name is displayed
    const auctioneerName = headerSection.locator('h1');
    await expect(auctioneerName).toBeVisible();

    // Check for stats section
    const statsSection = page.locator('[data-ai-id="auctioneer-stats-section"]');
    await expect(statsSection).toBeVisible();
  });

  test('should have consistent auction display with homepage', async ({ page }) => {
    // First visit homepage to see auction display
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-ai-id="homepage-skeleton"]', { state: 'detached' });

    // Check homepage auction cards
    const homeAuctionCards = page.locator('[data-ai-id*="auction-card-"]');
    const homeCardCount = await homeAuctionCards.count();

    if (homeCardCount > 0) {
      // Get structure of homepage auction card
      const homeCard = homeAuctionCards.first();
      const homeCardClasses = await homeCard.getAttribute('class');

      // Now visit auctioneer page
      await page.goto(`${BASE_URL}/auctioneers/test-auctioneer`, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-ai-id="auctioneer-details-page-container"]', { timeout: 30000 });

      // Check auctioneer page auction cards
      const auctioneerCards = page.locator('[data-ai-id*="auction-card-"]');
      const auctioneerCardCount = await auctioneerCards.count();

      if (auctioneerCardCount > 0) {
        // Verify similar structure
        const auctioneerCard = auctioneerCards.first();
        const auctioneerCardClasses = await auctioneerCard.getAttribute('class');

        // Both should have similar card styling (flexible check)
        expect(auctioneerCardClasses).toContain('shadow-md');
        expect(homeCardClasses).toContain('shadow-md');
      }
    }
  });
});