import { test, expect } from '@playwright/test';

test.describe('Validation: Login and Active Auctions', () => {
    // Rely on global-setup authentication (admin.json)
    // test.use({ storageState: { cookies: [], origins: [] } });

  test('should satisfy valid login and check active auctions', async ({ page }) => {
    // 1. Navigate directly to Admin Dashboard (verification of login)
    console.log('Navigating to Admin Dashboard...');
    await page.goto('/admin');
    
    // 2. Verify we are logged in
    await expect(page).toHaveURL(/.*admin.*/, { timeout: 15000 });
    console.log('✅ Logged in successfully (Access to /admin confirmed).');

    // 3. Verify Active Auctions on Public List
    console.log('Checking active auctions on /auctions...');
    await page.goto('/auctions');
    
    // Wait for the auction list container
    const auctionList = page.locator('[data-ai-id="auctions-grid"], .auction-card, [data-testid="auction-card"]');
    
    // Wait a bit for data fetching
    await page.waitForTimeout(3000);

    const count = await auctionList.count();
    console.log(`Found ${count} auctions visible on the list.`);

    // 6. Verify "In Progress" / Open status
    // We look for badges or text usually associated with active auctions
    const activeIndicators = page.locator('text=/Aberto|Em Andamento|Lote Aberto|Lance/i');
    if (await activeIndicators.count() > 0) {
        console.log('✅ Found indications of active auctions/lots (Price Taking in Progress).');
    } else {
        console.log('⚠️ No obvious "Active" status text found, but cards are present.');
    }

    expect(count).toBeGreaterThan(0);

    // 7. Verify Admin Dashboard stats (Double Check)
    console.log('Checking Admin Dashboard stats...');
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    
    // Check for "Leilões" metric card
    const auctionsMetric = page.locator('text=Leilões').first();
    await expect(auctionsMetric).toBeVisible();
    
    // Take a screenshot for evidence
    await page.screenshot({ path: 'validation-result.png', fullPage: true });
  });
});
