/**
 * @fileoverview Diagnostic test for search page empty results.
 * Navigates to search, waits for full data load, captures tab counts and console errors.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://demo.localhost:9006';

test('search page diagnostic - wait for full data load', async ({ page }) => {
  const consoleMessages: string[] = [];
  const networkErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('requestfailed', req => {
    networkErrors.push(`FAILED: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  // Navigate to search with type=lots to test lot loading
  await page.goto(`${BASE}/search?type=lots`, { waitUntil: 'networkidle', timeout: 120000 });

  // Wait for loading spinner to disappear (Phase 1 + Phase 2)
  await page.waitForSelector('[data-ai-id="search-page-loading"]', { state: 'hidden', timeout: 60000 }).catch(() => {
    console.log('Loading selector never appeared or already gone');
  });

  // Wait for tabs to appear
  await page.waitForSelector('[data-ai-id="search-page-tabs"]', { timeout: 30000 }).catch(() => {
    console.log('Tabs never appeared');
  });

  // Give extra time for Phase 2 (data fetching)
  await page.waitForTimeout(10000);

  // Capture tab text to see item counts
  const tabsText = await page.locator('[data-ai-id="search-page-tabs-list"]').textContent().catch(() => 'NOT FOUND');
  console.log('TAB COUNTS:', tabsText);

  // Capture results area
  const resultsArea = page.locator('[data-ai-id="search-page-results"]');
  const resultsText = await resultsArea.textContent().catch(() => 'NOT FOUND');
  console.log('RESULTS TEXT LENGTH:', resultsText?.length);
  console.log('RESULTS FIRST 500:', resultsText?.substring(0, 500));

  // Check for BidExpertCard elements
  const cardCount = await page.locator('[data-ai-id^="bid-expert-card"]').count();
  console.log('CARD COUNT:', cardCount);

  // Check all links
  const allLinks = await page.locator('a[href*="/lot"], a[href*="/auction"], a[href*="/leilao"]').count();
  console.log('LOT/AUCTION LINKS:', allLinks);

  // Log errors
  console.log('CONSOLE ERRORS:', JSON.stringify(consoleMessages, null, 2));
  console.log('NETWORK ERRORS:', JSON.stringify(networkErrors, null, 2));

  // Now test with auctions tab
  await page.goto(`${BASE}/search?type=auctions`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(10000);
  
  const tabsText2 = await page.locator('[data-ai-id="search-page-tabs-list"]').textContent().catch(() => 'NOT FOUND');
  console.log('AUCTIONS TAB COUNTS:', tabsText2);
  
  const cardCount2 = await page.locator('[data-ai-id^="bid-expert-card"]').count();
  console.log('AUCTION CARD COUNT:', cardCount2);

  // Print final summary
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log(`Tab text (lots): ${tabsText}`);
  console.log(`Tab text (auctions): ${tabsText2}`);
  console.log(`Cards on lots tab: ${cardCount}`);
  console.log(`Cards on auctions tab: ${cardCount2}`);
  console.log(`Console errors: ${consoleMessages.length}`);
  console.log(`Network errors: ${networkErrors.length}`);
});
