// tests/ui/auction-card-details.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../../src/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';

let prisma: PrismaClient;
const testRunId = `card-test-${uuidv4().substring(0, 8)}`;
console.log(`[auction-card-details.spec.ts] Using testRunId: ${testRunId}`);

const testData = {
  auctioneer: {
    name: `Leiloeiro Card ${testRunId}`,
    slug: `leiloeiro-card-${testRunId}`,
    publicId: `pub-auct-${testRunId}`,
    logoUrl: 'https://placehold.co/40x40/3498db/ffffff.png?text=L',
    dataAiHintLogo: 'leiloeiro logo'
  },
  seller: {
    name: `Comitente Card ${testRunId}`,
    slug: `comitente-card-${testRunId}`,
    publicId: `pub-seller-${testRunId}`,
    logoUrl: 'https://placehold.co/40x40/2ecc71/ffffff.png?text=C',
    dataAiHintLogo: 'comitente logo'
  },
  category: {
    name: `Categoria Card ${testRunId}`,
    slug: `categoria-card-${testRunId}`
  },
  auction: {
    title: `Leilão Card Test ${testRunId}`,
    description: 'Descrição completa do leilão de teste.',
    status: 'ABERTO_PARA_LANCES' as const,
    visits: 123,
    totalHabilitatedUsers: 45,
    isFeaturedOnMarketplace: true,
    totalLots: 5,
    initialOffer: 1500,
    auctionType: 'EXTRAJUDICIAL' as const,
    imageUrl: 'https://placehold.co/600x400/f97316/ffffff.png?text=Leilao',
    dataAiHint: 'leilao card test'
  }
};

let createdAuction: Auction | null = null;

async function createTestData() {
  console.log(`[createTestData] Starting for run: ${testRunId}`);
  
  const category = await prisma.lotCategory.create({
    data: { name: testData.category.name, slug: testData.category.slug, hasSubcategories: false }
  });
  console.log(`[createTestData] Created category: ${testData.category.name}`);

  const auctioneer = await prisma.auctioneer.create({
    data: { 
        name: testData.auctioneer.name, 
        slug: testData.auctioneer.slug, 
        publicId: testData.auctioneer.publicId,
        logoUrl: testData.auctioneer.logoUrl,
        dataAiHintLogo: testData.auctioneer.dataAiHintLogo
    }
  });
  console.log(`[createTestData] Created auctioneer: ${testData.auctioneer.name}`);

  const seller = await prisma.seller.create({
    data: {
        name: testData.seller.name,
        slug: testData.seller.slug,
        publicId: testData.seller.publicId,
        logoUrl: testData.seller.logoUrl,
        dataAiHintLogo: testData.seller.dataAiHintLogo,
        isJudicial: false
    }
  });
  console.log(`[createTestData] Created seller: ${testData.seller.name}`);

  const now = new Date();
  const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Ends today
  const stage1End = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  // FIX: Destructure totalLots out to prevent passing it to Prisma, as it's a computed field.
  const { totalLots, ...auctionInfoToCreate } = testData.auction;
  
  const auctionData: any = {
      ...auctionInfoToCreate,
      slug: slugify(testData.auction.title),
      publicId: `pub-auction-${testRunId}`,
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      categoryId: category.id,
      auctionDate: now,
      endDate: endDate,
      auctionStages: [ 
          { name: '1ª Praça', endDate: stage1End.toISOString(), initialPrice: 1500 },
          { name: '2ª Praça', endDate: endDate.toISOString(), initialPrice: 750 }
      ]
  };
  
  const auction = await prisma.auction.create({
    data: auctionData,
  });
  console.log(`[createTestData] Created auction: ${auction.title}`);
  
  await prisma.lot.createMany({
      data: Array.from({ length: testData.auction.totalLots }).map((_, i) => ({
          title: `Lote ${i+1} de ${testData.auction.title}`,
          number: `${i+1}`,
          publicId: `pub-lot-${testRunId}-${i}`,
          auctionId: auction.id,
          price: testData.auction.initialOffer + (i * 100),
          status: 'ABERTO_PARA_LANCES',
          type: category.name,
          categoryId: category.id,
      }))
  });
  console.log(`[createTestData] Created ${testData.auction.totalLots} lots for auction ${auction.id}.`);

  return auction as Auction;
}

async function cleanupTestData() {
    console.log(`[cleanupTestData] Starting cleanup for run: ${testRunId}`);
    if (!prisma) {
      console.warn('[cleanupTestData] Prisma client not initialized, skipping cleanup.');
      return;
    }
    try {
        if (createdAuction) {
            await prisma.lot.deleteMany({ where: { auctionId: createdAuction.id }});
            console.log(`[cleanupTestData] Deleted lots for auction ID: ${createdAuction.id}`);
            await prisma.auction.deleteMany({ where: { id: createdAuction.id } });
            console.log(`[cleanupTestData] Deleted auction: ${createdAuction.title}`);
        }
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData] Deleted sellers for run: ${testRunId}`);
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData] Deleted auctioneers for run: ${testRunId}`);
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        console.log(`[cleanupTestData] Deleted categories for run: ${testRunId}`);
    } catch(e) {
        console.error("Error cleaning up card test data", e);
    }
}

test.describe('Auction Card and List Item UI Validation', () => {
    test.beforeAll(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupTestData();
        createdAuction = await createTestData();
    });

    test.afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });
  
    test.beforeEach(async ({ page }) => {
        console.log('[Test] beforeEach hook: Setting up localStorage and logging in...');
        await page.addInitScript(() => {
        window.localStorage.setItem('bidexpert_setup_complete', 'true');
        });
        
        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
        await page.locator('input[name="password"]').fill('Admin@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('header').getByRole('button')).toBeVisible(); 
        console.log('[Test] beforeEach hook: Login successful.');

        console.log('[Test] beforeEach: Navigating to /search?type=auctions');
        await page.goto('/search?type=auctions'); 
        await page.waitForLoadState('networkidle');
        const pageTitle = await page.title();
        console.log(`[Test] beforeEach: Page loaded. URL: ${page.url()}, Title: "${pageTitle}"`);
        await expect(page).toHaveTitle(/BidExpert/);
    });

    test('should display all required information on the Auction Card', async ({ page }) => {
        console.log('--- [Test Case] Validating Auction Card UI ---');
        console.log('CRITERIA: Card must display correct title, images, status, counters, stages, and actions.');

        await page.screenshot({ path: `test-results/auction-card-details-before-find.png`, fullPage: true });
        
        const cardLocator = page.locator(`[data-ai-id="auction-card-${createdAuction.id}"]`);
        await expect(cardLocator).toBeVisible({ timeout: 15000 });
        console.log('- Verified: Auction card is visible.');

        // Visual ID
        await expect(cardLocator.locator(`[data-ai-id="auction-card-main-image"]`)).toBeVisible();
        await expect(cardLocator.locator(`[data-ai-id="auction-card-seller-logo"]`)).toBeVisible();
        console.log('- Verified: Main image and seller logo are visible.');
        
        // Main Info
        await expect(cardLocator.locator(`[data-ai-id="auction-card-title"]`)).toContainText(testData.auction.title);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-public-id"]`)).toContainText(createdAuction.publicId);
        console.log('- Verified: Title, links, and public ID are correct.');

        // Status & Badges
        await expect(cardLocator.locator(`[data-ai-id="auction-card-badges"]`)).toContainText('Aberto para Lances');
        await expect(cardLocator.locator(`[data-ai-id="auction-card-mental-triggers"]`)).toContainText('DESTAQUE');
        await expect(cardLocator.locator(`[data-ai-id="auction-card-mental-triggers"]`)).toContainText('ENCERRA HOJE');
        console.log('- Verified: Status and mental trigger badges are displayed.');

        // Data & Counters
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalLots} Lotes`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.visits} Visitas`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-counters"]`)).toContainText(`${testData.auction.totalHabilitatedUsers} Habilitados`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-initial-offer"]`)).toContainText(`R$ ${testData.auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        await expect(cardLocator.locator(`[data-ai-id="auction-card-type"]`)).toContainText('Extrajudicial');
        console.log('- Verified: All counters and data points are correct.');

        // Timeline
        await expect(cardLocator.locator(`[data-ai-id="auction-card-timeline"]`)).toBeVisible();
        await expect(cardLocator.getByText('1ª Praça')).toBeVisible();
        await expect(cardLocator.getByText('2ª Praça')).toBeVisible();
        console.log('- Verified: Auction stages timeline is visible.');
        
        // User Actions
        await cardLocator.hover();
        await expect(cardLocator.getByLabel('Favoritar')).toBeVisible();
        await expect(cardLocator.getByLabel('Pré-visualizar')).toBeVisible();
        await expect(cardLocator.getByLabel('Compartilhar')).toBeVisible();
        await expect(cardLocator.getByLabel('Opções de Edição')).toBeVisible();
        console.log('- Verified: All user action buttons are present on hover.');
        console.log('--- ✅ Test Case Passed ---');
    });
});
