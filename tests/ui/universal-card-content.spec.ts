// tests/ui/universal-card-content.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient, Prisma } from '@prisma/client';
import { slugify } from '../../src/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot, Tenant } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';

let prismaClient: PrismaClient;
const testRunId = `universal-card-${uuidv4().substring(0, 8)}`;
console.log(`[universal-card-content.spec.ts] Using testRunId: ${testRunId}`);

const testData = {
  auctioneer: { name: `Leiloeiro Conteúdo ${testRunId}` },
  seller: {
    name: `Comitente Conteúdo ${testRunId}`,
    logoUrl: 'https://placehold.co/60x60/f0db4f/000000.png?text=JS'
  },
  category: { name: `Eletrônicos ${testRunId}` },
  auction: {
    title: `Leilão de Notebooks Usados ${testRunId}`,
    status: 'ABERTO_PARA_LANCES' as const,
    visits: 250,
    totalHabilitatedUsers: 35,
    auctionType: 'EXTRAJUDICIAL' as const,
    isFeaturedOnMarketplace: true,
    totalLots: 5,
    initialOffer: new Prisma.Decimal(1500),
    imageUrl: 'https://placehold.co/600x400/9b59b6/ffffff.png?text=LeilaoNotebooks',
    dataAiHint: 'leilao card test'
  },
  lot: {
    title: `Notebook Gamer Alienware ${testRunId}`,
    number: '101',
    description: 'Notebook de alta performance com poucas marcas de uso.',
    price: new Prisma.Decimal(3800.00),
    initialPrice: new Prisma.Decimal(5000.00),
    secondInitialPrice: new Prisma.Decimal(3000.00), // 40% discount from initialPrice
    bidsCount: 15, // Hot bid
    views: 600, // Popular
    cityName: 'Curitiba',
    stateUf: 'PR'
  }
};

let createdAuction: Auction;
let createdLot: Lot;

async function createTestData() {
    console.log(`[createTestData] Starting for run: ${testRunId}`);
    
    const tenant = await prismaClient.tenant.upsert({
      where: { id: '1' },
      update: {},
      create: { id: '1', name: 'Landlord', subdomain: 'www' }
    });
    
    const category = await prismaClient.lotCategory.create({
        data: { name: testData.category.name, slug: slugify(testData.category.name), hasSubcategories: false }
    });

    const auctioneer = await prismaClient.auctioneer.create({
        data: { tenantId: tenant.id, name: testData.auctioneer.name, slug: slugify(testData.auctioneer.name), publicId: `auct-pub-${testRunId}` }
    });

    const seller = await prismaClient.seller.create({
        data: { tenantId: tenant.id, name: testData.seller.name, slug: slugify(testData.seller.name), publicId: `seller-pub-${testRunId}`, logoUrl: testData.seller.logoUrl, isJudicial: false }
    });

    const now = new Date();
    const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Ends today
    
    const auctionData: any = {
        ...testData.auction,
        slug: slugify(testData.auction.title),
        publicId: `pub-auction-${testRunId}`,
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        categoryId: category.id,
        auctionDate: now,
        endDate: endDate,
        tenantId: tenant.id
    };
  
  const auction = await prismaClient.auction.create({
    data: auctionData,
  });
  createdAuction = auction as unknown as Auction;

    const lot = await prismaClient.lot.create({
        data: {
            ...testData.lot,
            publicId: `lot-pub-${testRunId}`,
            auctionId: auction.id,
            categoryId: category.id,
            sellerId: seller.id,
            auctioneerId: auctioneer.id,
            type: category.name,
            status: 'ABERTO_PARA_LANCES',
            tenantId: tenant.id
        }
    });
    createdLot = lot as unknown as Lot;

    console.log(`[createTestData] Test data created for run ${testRunId}.`);
    return { auction, lot };
}

async function cleanupTestData() {
  console.log(`[cleanupTestData] Starting cleanup for run: ${testRunId}`);
  if (!prismaClient) {
    console.warn('[cleanupTestData] Prisma client not initialized, skipping cleanup.');
    return;
  }
  try {
    if (createdAuction) {
        await prismaClient.lot.deleteMany({ where: { auctionId: createdAuction.id } });
        await prismaClient.auction.deleteMany({ where: { id: createdAuction.id } });
    }
    await prismaClient.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prismaClient.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prismaClient.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    
    console.log(`[cleanupTestData] Cleanup complete for run ${testRunId}.`);
  } catch (e) {
    console.error(`[cleanupTestData] Error during cleanup for run ${testRunId}:`, e);
  }
}

test.describe('Módulo 20: Universal Card UI Validation', () => {
    test.beforeAll(async () => {
        prismaClient = new PrismaClient();
        await prismaClient.$connect();
        await cleanupTestData();
        await createTestData();
    });

    test.afterAll(async () => {
        await cleanupTestData();
        await prismaClient.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
        await page.locator('input[name="password"]').fill('Admin@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('header').getByRole('button')).toBeVisible();
    });

    test('Cenário 20.1: should correctly display all data on a Lot Card', async ({ page }) => {
        console.log('--- [Test Case] Validating Lot Card Content ---');
        await page.goto('/search?type=lots');
        const cardLocator = page.locator(`[data-ai-id="lot-card-${createdLot.id}"]`);
        await expect(cardLocator).toBeVisible({ timeout: 15000 });

        await expect(cardLocator.locator(`[data-ai-id="lot-card-status-badges"]`)).toContainText('Aberto para Lances');
        await expect(cardLocator.locator(`[data-ai-id="lot-card-mental-triggers"]`)).toContainText('LANCE QUENTE');
        await expect(cardLocator.locator(`[data-ai-id="lot-card-mental-triggers"]`)).toContainText('MAIS VISITADO');
        await expect(cardLocator.locator(`[data-ai-id="lot-card-category"]`)).toContainText(testData.category.name);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-bid-count"]`)).toContainText(`${testData.lot.bidsCount} Lances`);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-location"]`)).toContainText(`${testData.lot.cityName} - ${testData.lot.stateUf}`);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-title"]`)).toContainText(testData.lot.title);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-footer"]`)).toContainText(`R$ ${Number(testData.lot.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        console.log('--- ✅ Lot Card Test Case Passed ---');
    });

    test('Cenário 20.2: should correctly display all data on an Auction Card', async ({ page }) => {
        console.log('--- [Test Case] Validating Auction Card Content ---');
        await page.goto('/search?type=auctions');
        const cardLocator = page.locator(`[data-ai-id="auction-card-${createdAuction.id}"]`);
        await expect(cardLocator).toBeVisible({ timeout: 15000 });

        const sellerLogo = cardLocator.locator(`[data-ai-id="auction-card-seller-logo"] img`);
        await expect(sellerLogo).toHaveAttribute('src', testData.seller.logoUrl);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-title"]`)).toContainText(testData.auction.title);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-public-id"]`)).toContainText(createdAuction.publicId as string);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalLots} Lotes`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.visits} Visitas`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalHabilitatedUsers} Habilitados`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-footer"]`)).toContainText(`R$ ${Number(testData.auction.initialOffer).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        console.log('--- ✅ Auction Card Test Case Passed ---');
    });
});
