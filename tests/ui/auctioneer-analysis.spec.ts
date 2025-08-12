// tests/ui/auctioneer-analysis.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import type { AuctioneerProfileInfo, SellerProfileInfo } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '../../lib/ui-helpers';

const testRunId = `analysis-auctioneer-${uuidv4().substring(0, 8)}`;
console.log(`[auctioneer-analysis.spec.ts] Using testRunId: ${testRunId}`);

let testAuctioneer: AuctioneerProfileInfo;
let testSeller: SellerProfileInfo;

async function createTestData() {
  console.log(`[createTestData - auctioneer analysis] Starting for run: ${testRunId}`);
  
  testSeller = await prisma.seller.create({ data: { name: `Analysis Seller ${testRunId}`, publicId: `pub-seller-ana-ae-${testRunId}`, slug: `analysis-seller-ae-${testRunId}`, isJudicial: false } });

  testAuctioneer = await prisma.auctioneer.create({
    data: { 
        name: `Leiloeiro de Teste de Análise ${testRunId}`, 
        publicId: `pub-auct-ana-${testRunId}`,
        slug: `analysis-auct-${testRunId}`,
    }
  });

  const auction = await prisma.auction.create({
    data: {
      title: `Leilão do Leiloeiro ${testRunId}`,
      slug: `leilao-leiloeiro-${testRunId}`,
      publicId: `pub-auc-ae-ana-${testRunId}`,
      status: 'VENDIDO' as const,
      auctioneerId: testAuctioneer.id,
      sellerId: testSeller.id,
      auctionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    } as any,
  });

  await prisma.lot.createMany({
    data: [
      { auctionId: auction.id, title: 'Lote 1 do Leiloeiro', price: 2000, status: 'VENDIDO' },
      { auctionId: auction.id, title: 'Lote 2 do Leiloeiro', price: 4000, status: 'VENDIDO' },
      { auctionId: auction.id, title: 'Lote 3 do Leiloeiro', price: 1000, status: 'NAO_VENDIDO' },
    ] as any,
  });

  console.log(`[createTestData - auctioneer analysis] Test data created.`);
  return testAuctioneer;
}

async function cleanupTestData() {
    console.log(`[cleanupTestData - auctioneer analysis] Starting cleanup for run: ${testRunId}`);
    try {
        const auctioneer = await prisma.auctioneer.findFirst({ where: { name: { contains: testRunId } }});
        if (auctioneer) {
            const auctions = await prisma.auction.findMany({ where: { auctioneerId: auctioneer.id } });
            const auctionIds = auctions.map(a => a.id);
            if (auctionIds.length > 0) {
                 await prisma.lot.deleteMany({ where: { auctionId: { in: auctionIds } } });
                 await prisma.auction.deleteMany({ where: { id: { in: auctionIds } } });
            }
            await prisma.auctioneer.deleteMany({ where: { id: auctioneer.id } });
        }
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData - auctioneer analysis] Cleanup complete.`);
    } catch(e) {
        console.error("Error cleaning up auctioneer analysis test data", e);
    }
}

test.describe('Auctioneer Analysis Page UI Validation', () => {
    test.beforeAll(async () => {
        await cleanupTestData();
        testAuctioneer = await createTestData();
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
        await page.goto('/admin/auctioneers/analysis');
        await expect(page).toHaveTitle(/BidExpert/);
    });

    test('should display auctioneer performance KPIs', async ({ page }) => {
        await expect(page.getByText('Faturamento Total')).toBeVisible({ timeout: 10000 });
        const revenueCard = page.locator('div:has-text("Faturamento Total") + div > .text-2xl');
        await expect(revenueCard).toContainText('R$ 6.000,00');

        await expect(page.locator('div:has-text("Total de Lotes") + div > .text-2xl')).toContainText('3');
        await expect(page.locator('div:has-text("Total de Leilões") + div > .text-2xl')).toContainText('1');
    });

    test('should display the auctioneers performance table with correct data', async ({ page }) => {
        const row = page.locator(`tr:has-text("${testAuctioneer.name}")`);
        await expect(row).toBeVisible({ timeout: 10000 });

        await expect(row.getByRole('cell', { name: '1' }).first()).toBeVisible(); // Leilões
        await expect(row.getByRole('cell', { name: '3' }).first()).toBeVisible(); // Total de Lotes
        await expect(row.getByRole('cell', { name: '66.7%' })).toBeVisible(); // Taxa de Venda
        await expect(row.getByRole('cell', { name: 'R$ 6.000,00' })).toBeVisible(); // Faturamento
        await expect(row.getByRole('cell', { name: 'R$ 3.000,00' })).toBeVisible(); // Ticket Médio
    });
});
