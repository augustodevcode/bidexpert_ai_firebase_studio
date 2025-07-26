// tests/ui/homepage.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { getAuctions } from '@/app/admin/auctions/actions';

test.describe('Homepage Smoke Test', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    await page.goto('/');
    console.log('[Homepage Test] Navigated to homepage.');
  });

  test('should load the homepage and display the main title', async ({ page }) => {
    // This is a more stable selector that doesn't rely on the exact text which might be dynamic.
    const title = page.locator('header').getByRole('link', { name: /BidExpert/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Homepage main title is visible.');
  });

  test('should display featured lots or recent lots section', async ({ page }) => {
    const lotsSectionTitle = page.getByRole('heading', { name: 'Lotes em Destaque' }).or(page.getByRole('heading', { name: 'Lotes Recentes' }));
    await expect(lotsSectionTitle).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Lots section title is visible.');
  
    const firstLotCard = lotsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstLotCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one lot card is visible.');
  });
  
  test('should display featured auctions or recent auctions section', async ({ page }) => {
    const auctionsSectionTitle = page.getByRole('heading', { name: 'Leilões em Destaque' }).or(page.getByRole('heading', { name: 'Leilões Recentes' }));
    await expect(auctionsSectionTitle).toBeVisible({ timeout: 15000 });
    const firstAuctionCard = auctionsSectionTitle.locator('xpath=following-sibling::div').locator('div.group').first();
    await expect(firstAuctionCard).toBeVisible({ timeout: 5000 });
    console.log('- Verified: At least one auction card is visible.');
  });

});
