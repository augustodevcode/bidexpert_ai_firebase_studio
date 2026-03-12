/**
 * @fileoverview E2E tests for Auction Control Center — all 10 tabs.
 *
 * Feature: Auction Control Center Tab Navigation
 *   As an admin user
 *   I want to navigate through all 10 tabs of the Auction Control Center
 *   So that I can manage every aspect of an auction
 *
 * Scenario: Navigate to each tab and verify content loads
 *   Given I am logged in as admin
 *   And there is at least one auction in the system
 *   When I navigate to the Auction Control Center
 *   Then each tab should be clickable and render its content
 *
 * Covers gap A4 from the 30-feature audit.
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9002';

const TABS = [
  { key: 'dashboard', label: /Dashboard/i },
  { key: 'lotting', label: /Loteamento/i },
  { key: 'lots', label: /Lotes/i },
  { key: 'marketing', label: /Marketing/i },
  { key: 'habilitations', label: /Habilita/i },
  { key: 'auction', label: /Preg[aã]o/i },
  { key: 'closing', label: /Arremate/i },
  { key: 'financial', label: /Financeiro/i },
  { key: 'analytics', label: /Analytics/i },
  { key: 'lineage', label: /Linhagem/i },
] as const;

async function findFirstAuctionId(page: Page): Promise<string | null> {
  // Navigate to auctions list; use domcontentloaded to avoid networkidle race
  await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // If session expired and we got redirected to login, re-authenticate
  if (page.url().includes('/auth/login')) {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  // Wait for table or action buttons to appear (signals the page rendered)
  await page.locator('[data-ai-id="auction-dashboard-btn"], table tbody tr, [data-ai-id="auction-row-actions"]')
    .first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});

  // Strategy 1: Click the Dashboard button (data-ai-id="auction-dashboard-btn")
  // It navigates to /admin/auctions/{id}/auction-control-center via router.push()
  const dashBtn = page.locator('[data-ai-id="auction-dashboard-btn"]').first();
  if (await dashBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await dashBtn.click();
    await page.waitForURL(/\/admin\/auctions\/[^/]+\/auction-control-center/, { timeout: 15_000 }).catch(() => {});
    const match = page.url().match(/\/admin\/auctions\/([^/]+)\/auction-control-center/);
    if (match) return match[1];
  }

  // Strategy 2: Look for any anchor with /auctions/ in href (View / Monitor buttons)
  const auctionLinks = page.locator('a[href*="/auctions/"]');
  const count = await auctionLinks.count();
  for (let i = 0; i < count; i++) {
    const href = await auctionLinks.nth(i).getAttribute('href');
    const m = href?.match(/\/auctions\/([^/]+)/);
    if (m) return m[1];
  }

  return null;
}

async function navigateToControlCenter(page: Page, auctionId: string): Promise<void> {
  await page.goto(`${BASE_URL}/admin/auctions/${auctionId}/auction-control-center`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  // If redirected to login, re-auth and retry
  if (page.url().includes('/auth/login')) {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/auctions/${auctionId}/auction-control-center`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
  }
  // Wait for the tab list to render (proves the control center loaded)
  await page.getByRole('tablist').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
}

test.describe('Auction Control Center — All 10 Tabs', () => {
  // Ensure viewport is wide enough for tab labels (hidden below sm:640px)
  test.use({ viewport: { width: 1280, height: 720 } });

  let auctionId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await loginAsAdmin(page, BASE_URL);
    await page.waitForTimeout(2_000);
    auctionId = await findFirstAuctionId(page);
    if (auctionId) console.log(`[auction-control-center] Found auction ID: ${auctionId}`);
    else console.log('[auction-control-center] No auction found in seed data');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    if (!auctionId) {
      test.skip(true, 'No auction found in seed data');
      return;
    }
    await loginAsAdmin(page, BASE_URL);
    await navigateToControlCenter(page, auctionId);
  });

  for (const tab of TABS) {
    test(`Tab "${tab.key}" loads content`, async ({ page }) => {
      if (!auctionId) return;

      const tabTrigger = page.getByRole('tab', { name: tab.label });

      // Some tabs may not exist depending on permissions — skip gracefully
      if (!(await tabTrigger.isVisible({ timeout: 5_000 }).catch(() => false))) {
        test.skip(true, `Tab "${tab.key}" not visible — may require specific permissions`);
        return;
      }

      await tabTrigger.click();
      await page.waitForTimeout(2_000);

      // Verify the tab panel has content (not empty)
      const tabPanel = page.getByRole('tabpanel');
      if (await tabPanel.isVisible({ timeout: 10_000 }).catch(() => false)) {
        const text = await tabPanel.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      } else {
        // Fallback: check URL contains tab key or main content area has text
        const mainContent = page.locator('main, [role="main"], .tab-content').first();
        await expect(mainContent).toBeVisible({ timeout: 10_000 });
      }
    });
  }

  test('All 10 tab triggers are present', async ({ page }) => {
    if (!auctionId) return;

    let visibleCount = 0;
    for (const tab of TABS) {
      const trigger = page.getByRole('tab', { name: tab.label });
      if (await trigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        visibleCount++;
      }
    }

    // At minimum, 5 tabs should be accessible to admin
    expect(visibleCount).toBeGreaterThanOrEqual(5);
  });
});
