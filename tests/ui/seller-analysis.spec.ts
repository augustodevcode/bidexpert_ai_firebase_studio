// tests/ui/seller-analysis.spec.ts
import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '../../lib/ui-helpers';

const testRunId = `analysis-seller-${uuidv4().substring(0, 8)}`;
console.log(`[seller-analysis.spec.ts] Using testRunId: ${testRunId}`);

let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;

async function createTestData() {
  console.log(`[createTestData - seller analysis] Starting for run: ${testRunId}`);
  testAuctioneer = await prisma.auctioneer.create({ data: { name: `Analysis Auctioneer ${testRunId}`, publicId: `pub-auct-sel-ana-${testRunId}`, slug: `analysis-auct-sel-${testRunId}` }});
  
  testSeller = await prisma.seller.create({
    data: { 
        name: `Comitente de Teste de Análise ${testRunId}`, 
        publicId: `pub-seller-ana-${testRunId}`,
        slug: `seller-ana-${testRunId}`,
        isJudicial: false,
    }
  });

  const auction = await prisma.auction.create({
    data: {
      title: `Leilão do Comitente ${testRunId}`,
      slug: `leilao-comitente-${testRunId}`,
      publicId: `pub-auc-sel-ana-${testRunId}`,
      status: 'VENDIDO' as const,
      auctioneerId: testAuctioneer.id,
      sellerId: testSeller.id,
      auctionDate: new Date(),
    } as any,
  });

  await prisma.lot.createMany({
    data: [
      { auctionId: auction.id, title: 'Lote 1 do Comitente', sellerId: testSeller.id, price: 1500, status: 'VENDIDO' },
      { auctionId: auction.id, title: 'Lote 2 do Comitente', sellerId: testSeller.id, price: 3000, status: 'VENDIDO' },
      { auctionId: auction.id, title: 'Lote 3 do Comitente', sellerId: testSeller.id, price: 500, status: 'NAO_VENDIDO' },
    ] as any,
  });

  console.log(`[createTestData - seller analysis] Test data created.`);
  return testSeller;
}

async function cleanupTestData() {
    console.log(`[cleanupTestData - seller analysis] Starting cleanup for run: ${testRunId}`);
    try {
        const seller = await prisma.seller.findFirst({ where: { name: { contains: testRunId } }});
        if (seller) {
            await prisma.lot.deleteMany({ where: { sellerId: seller.id } });
            await prisma.auction.deleteMany({ where: { sellerId: seller.id } });
            await prisma.seller.deleteMany({ where: { id: seller.id } });
        }
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData - seller analysis] Cleanup complete.`);
    } catch(e) {
        console.error("Error cleaning up seller analysis test data", e);
    }
}

test.describe('Seller Analysis Page UI Validation', () => {
    test.beforeAll(async () => {
        await cleanupTestData();
        testSeller = await createTestData();
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
        await page.goto('/admin/sellers/analysis');
        await expect(page).toHaveTitle(/BidExpert/);
    });

    test('should display seller performance KPIs', async ({ page }) => {
        await expect(page.getByText('Faturamento Total (Vendido)')).toBeVisible({ timeout: 10000 });
        const revenueCard = page.locator('div:has-text("Faturamento Total (Vendido)") + div > .text-2xl');
        await expect(revenueCard).toContainText('R$ 4.500,00');

        await expect(page.locator('div:has-text("Total de Lotes") + div > .text-2xl')).toContainText('3');
        await expect(page.locator('div:has-text("Total de Leilões") + div > .text-2xl')).toContainText('1');
    });

    test('should display the sellers performance table with correct data', async ({ page }) => {
        const row = page.locator(`tr:has-text("${testSeller.name}")`);
        await expect(row).toBeVisible({ timeout: 10000 });

        await expect(row.getByRole('cell', { name: '1' }).first()).toBeVisible(); // Leilões
        await expect(row.getByRole('cell', { name: '3' }).first()).toBeVisible(); // Lotes
        await expect(row.getByRole('cell', { name: 'R$ 4.500,00' })).toBeVisible(); // Faturamento
        await expect(row.getByRole('cell', { name: 'R$ 2.250,00' })).toBeVisible(); // Ticket Médio
    });
});
