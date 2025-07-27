// tests/ui/card-content.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../../src/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';

let prisma: PrismaClient;
const testRunId = `card-content-${uuidv4().substring(0, 8)}`;
console.log(`[card-content.spec.ts] Using testRunId: ${testRunId}`);

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
    imageUrl: 'https://placehold.co/600x400/9b59b6/ffffff.png?text=LeilaoNotebooks'
  },
  lot: {
    title: `Notebook Gamer Alienware ${testRunId}`,
    number: '101',
    description: 'Notebook de alta performance com poucas marcas de uso.',
    price: 3800.00,
    initialPrice: 5000.00,
    secondInitialPrice: 3000.00, // 40% discount from initialPrice
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
    
    const category = await prisma.lotCategory.create({
        data: { name: testData.category.name, slug: slugify(testData.category.name), hasSubcategories: false }
    });

    const auctioneer = await prisma.auctioneer.create({
        data: { name: testData.auctioneer.name, slug: slugify(testData.auctioneer.name), publicId: `auct-pub-${testRunId}` }
    });

    const seller = await prisma.seller.create({
        data: { name: testData.seller.name, slug: slugify(testData.seller.name), publicId: `seller-pub-${testRunId}`, logoUrl: testData.seller.logoUrl, isJudicial: false }
    });

    const now = new Date();
    const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
    
    const auction = await prisma.auction.create({
        data: {
            ...testData.auction,
            slug: slugify(testData.auction.title),
            publicId: `auc-pub-${testRunId}`,
            auctioneerId: auctioneer.id,
            sellerId: seller.id,
            categoryId: category.id,
            auctionDate: now,
            endDate: endDate,
            auctionStages: [ 
                { name: '1ª Praça', endDate: endDate.toISOString(), initialPrice: testData.lot.initialPrice },
                { name: '2ª Praça', endDate: endDate.toISOString(), initialPrice: testData.lot.secondInitialPrice }
            ]
        } as any,
    });
    createdAuction = auction as Auction;

    const lot = await prisma.lot.create({
        data: {
            ...testData.lot,
            publicId: `lot-pub-${testRunId}`,
            auctionId: auction.id,
            categoryId: category.id,
            sellerId: seller.id,
            auctioneerId: auctioneer.id,
            type: category.name,
            status: 'ABERTO_PARA_LANCES'
        } as any
    });
    createdLot = lot as Lot;

    console.log(`[createTestData] Test data created for run ${testRunId}.`);
    return { auction, lot };
}

async function cleanupTestData() {
  console.log(`[cleanupTestData] Starting cleanup for run: ${testRunId}`);
  if (!prisma) {
    console.warn('[cleanupTestData] Prisma client not initialized, skipping cleanup.');
    return;
  }
  try {
    await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    
    console.log(`[cleanupTestData] Cleanup complete for run ${testRunId}.`);
  } catch (e) {
    console.error(`[cleanupTestData] Error during cleanup for run ${testRunId}:`, e);
  }
}

test.describe('Data Display Validation on Cards', () => {

    test.beforeAll(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupTestData(); // Clean first
        await createTestData();
    });

    test.afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
        await page.locator('input[name="password"]').fill('Admin@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('header').getByRole('button')).toBeVisible(); // Wait for header to confirm login
        await page.goto('/search?type=lots');
    });

    test('should correctly display all data on the Lot Card', async ({ page }) => {
        console.log('--- [Test Case] Validating Lot Card Content ---');
        
        const cardLocator = page.locator(`[data-ai-id="lot-card-${createdLot.id}"]`);
        await expect(cardLocator).toBeVisible({ timeout: 15000 });
        console.log('- Verified: Lot card is visible.');

        // Validate Status Badge
        await expect(cardLocator.locator(`[data-ai-id="lot-card-status-badges"]`)).toContainText('Aberto para Lances');
        console.log('- Verified: Status is correct.');

        // Validate Mental Triggers
        await expect(cardLocator.locator(`[data-ai-id="lot-card-mental-triggers"]`)).toContainText('40% OFF');
        await expect(cardLocator.locator(`[data-ai-id="lot-card-mental-triggers"]`)).toContainText('LANCE QUENTE');
        await expect(cardLocator.locator(`[data-ai-id="lot-card-mental-triggers"]`)).toContainText('MAIS VISITADO');
        console.log('- Verified: Mental trigger badges are displayed.');

        // Validate Category and Counters
        await expect(cardLocator.locator(`[data-ai-id="lot-card-category"]`)).toContainText(testData.category.name);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-bid-count"]`)).toContainText(`${testData.lot.bidsCount} Lances`);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-location"]`)).toContainText(`${testData.lot.cityName} - ${testData.lot.stateUf}`);
        console.log('- Verified: Category, counters, and location are correct.');

        // Validate Title and Price
        await expect(cardLocator.locator(`[data-ai-id="lot-card-title"]`)).toContainText(testData.lot.title);
        await expect(cardLocator.locator(`[data-ai-id="lot-card-price-section"]`)).toContainText(`R$ ${testData.lot.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log('- Verified: Title and current price are correct.');

        console.log('--- ✅ Lot Card Test Case Passed ---');
    });

    test('should correctly display all data on the Auction Card', async ({ page }) => {
        console.log('--- [Test Case] Validating Auction Card Content ---');
        await page.goto('/search?type=auctions');

        const cardLocator = page.locator(`[data-ai-id="auction-card-${createdAuction.id}"]`);
        await expect(cardLocator).toBeVisible({ timeout: 15000 });
        console.log('- Verified: Auction card is visible.');

        // Validate Seller Logo
        const sellerLogo = cardLocator.locator(`[data-ai-id="auction-card-seller-logo"] img`);
        await expect(sellerLogo).toHaveAttribute('src', testData.seller.logoUrl);
        console.log('- Verified: Seller logo is correct.');

        // Validate Title and ID
        await expect(cardLocator.locator(`[data-ai-id="auction-card-title"]`)).toContainText(testData.auction.title);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-public-id"]`)).toContainText(createdAuction.publicId);
        console.log('- Verified: Title and public ID are correct.');

        // Validate Counters
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalLots} Lotes`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.visits} Visitas`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalHabilitatedUsers} Habilitados`);
        console.log('- Verified: Counters are correct.');
        
        // Validate Initial Offer
        await expect(cardLocator.locator(`[data-ai-id="auction-card-initial-offer"]`)).toContainText(`R$ ${testData.auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log('- Verified: Initial offer is correct.');
        
        console.log('--- ✅ Auction Card Test Case Passed ---');
    });
});
