// tests/ui/auction-analysis.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '../../lib/ui-helpers';

const testRunId = `analysis-auction-${uuidv4().substring(0, 8)}`;
console.log(`[auction-analysis.spec.ts] Using testRunId: ${testRunId}`);

let createdAuction: Auction;
let testCategory: LotCategory;
let testAuctioneer: AuctioneerProfileInfo;
let testSeller: SellerProfileInfo;

async function createTestData() {
  console.log(`[createTestData - auction analysis] Starting for run: ${testRunId}`);
  testCategory = await prisma.lotCategory.create({ data: { name: `Analysis Category ${testRunId}`, slug: `analysis-cat-${testRunId}`, hasSubcategories: false }});
  testAuctioneer = await prisma.auctioneer.create({ data: { name: `Analysis Auctioneer ${testRunId}`, publicId: `pub-auct-ana-${testRunId}`, slug: `analysis-auct-${testRunId}` }});
  testSeller = await prisma.seller.create({ data: { name: `Analysis Seller ${testRunId}`, publicId: `pub-seller-ana-${testRunId}`, slug: `analysis-seller-${testRunId}`, isJudicial: false } });

  const auctionData = {
    title: `Leilão de Teste de Análise ${testRunId}`,
    slug: `leilao-analise-${testRunId}`,
    publicId: `pub-auc-ana-${testRunId}`,
    status: 'VENDIDO' as const,
    auctionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    auctioneerId: testAuctioneer.id,
    sellerId: testSeller.id,
    categoryId: testCategory.id,
  };
  
  createdAuction = await prisma.auction.create({ data: auctionData as any });

  await prisma.lot.createMany({
    data: [
      { auctionId: createdAuction.id, title: 'Lote 1', price: 1000, status: 'VENDIDO' },
      { auctionId: createdAuction.id, title: 'Lote 2', price: 2500, status: 'VENDIDO' },
      { auctionId: createdAuction.id, title: 'Lote 3', price: 500, status: 'NAO_VENDIDO' },
    ] as any
  });

  console.log(`[createTestData - auction analysis] Test data created.`);
  return createdAuction;
}

async function cleanupTestData() {
    console.log(`[cleanupTestData - auction analysis] Starting cleanup for run: ${testRunId}`);
    try {
        if (createdAuction) {
            await prisma.lot.deleteMany({ where: { auctionId: createdAuction.id } });
            await prisma.auction.deleteMany({ where: { id: createdAuction.id } });
        }
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData - auction analysis] Cleanup complete.`);
    } catch(e) {
        console.error("Error cleaning up auction analysis test data", e);
    }
}

test.describe('Auction Analysis Page UI Validation', () => {
    test.beforeAll(async () => {
        await cleanupTestData();
        createdAuction = await createTestData();
    });

    test.afterAll(async () => {
        await cleanupTestData();
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
        await page.locator('input[name="password"]').fill('Admin@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL('/dashboard/overview');
        await page.goto('/admin/auctions/analysis');
        await expect(page).toHaveTitle(/BidExpert/);
    });

    test('should display key performance indicators (KPIs)', async ({ page }) => {
        await expect(page.getByText('Faturamento Total')).toBeVisible({ timeout: 10000 });
        const revenueCard = page.locator('div:has-text("Faturamento Total") + div > .text-2xl');
        await expect(revenueCard).toContainText('R$ 3.500,00');

        await expect(page.getByText('Leilões Ativos')).toBeVisible();
        await expect(page.getByText('Lotes Vendidos')).toBeVisible();
        await expect(page.getByText('Leilões Realizados')).toBeVisible();
    });

    test('should display the auctions performance table', async ({ page }) => {
        const row = page.locator(`tr:has-text("${testData.auction.title}")`);
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(row.getByRole('cell', { name: 'Vendido' })).toBeVisible();
        await expect(row.getByRole('cell', { name: '3' }).first()).toBeVisible(); // Total Lotes
        await expect(row.getByRole('cell', { name: '2' }).first()).toBeVisible(); // Lotes Vendidos
        await expect(row.getByRole('cell', { name: '66.7%' })).toBeVisible(); // Taxa de Venda
        await expect(row.getByRole('cell', { name: 'R$ 3.500,00' })).toBeVisible(); // Faturamento
    });

    test('should display the top auctions by revenue chart', async ({ page }) => {
        const chart = page.locator('div:has-text("Top 10 Leilões por Faturamento")');
        await expect(chart).toBeVisible({ timeout: 10000 });
        
        // Check for a bar that represents our test auction.
        await expect(chart.locator(`text:has-text("${testData.auction.title}")`)).toBeVisible();
    });
});
