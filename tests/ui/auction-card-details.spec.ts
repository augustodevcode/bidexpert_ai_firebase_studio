
// tests/ui/auction-card-details.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { slugify } from '../../src/lib/sample-data-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '../../src/types';
import { v4 as uuidv4 } from 'uuid';

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

// This function runs once before all tests in this file.
async function createTestData(): Promise<Auction> {
  console.log(`[createTestData] Starting for run: ${testRunId}`);
  
  const testCategory = await prisma.lotCategory.create({
    data: { name: testData.category.name, slug: testData.category.slug, hasSubcategories: false }
  });
  console.log(`[createTestData] Created category: ${testCategory.name}`);

  const testAuctioneer = await prisma.auctioneer.create({
    data: { 
        name: testData.auctioneer.name, 
        slug: testData.auctioneer.slug, 
        publicId: testData.auctioneer.publicId,
        logoUrl: testData.auctioneer.logoUrl,
        dataAiHintLogo: testData.auctioneer.dataAiHintLogo
    }
  });
  console.log(`[createTestData] Created auctioneer: ${testAuctioneer.name}`);

  const testSeller = await prisma.seller.create({
    data: {
        name: testData.seller.name,
        slug: testData.seller.slug,
        publicId: testData.seller.publicId,
        logoUrl: testData.seller.logoUrl,
        dataAiHintLogo: testData.seller.dataAiHintLogo,
        isJudicial: false
    }
  });
  console.log(`[createTestData] Created seller: ${testSeller.name}`);

  const now = new Date();
  const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Ends today
  const stage1End = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  const auctionData: any = {
      ...testData.auction,
      slug: slugify(testData.auction.title),
      publicId: `pub-auction-${testRunId}`,
      auctioneerId: testAuctioneer.id,
      sellerId: testSeller.id,
      categoryId: testCategory.id,
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
          categoryId: testCategory.id,
          type: testCategory.name, // This field is required
      }))
  });
  console.log(`[createTestData] Created ${testData.auction.totalLots} lots for auction ${auction.id}.`);

  return auction as Auction;
}

// This function runs once after all tests in this file.
async function cleanupTestData() {
    console.log(`[cleanupTestData] Starting cleanup for run: ${testRunId}`);
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
    await cleanupTestData(); 
    createdAuction = await createTestData();
    console.log('[Test Suite] beforeAll hook complete.');
  });

  test.afterAll(async () => {
    await cleanupTestData();
    console.log('[Test Suite] afterAll hook complete.');
  });
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    await page.goto('/search?type=auctions'); 
    console.log('[Test] beforeEach hook: Navigated to search page.');
  });

  test('should display all required information on the Auction Card', async ({ page }) => {
    const cardLocator = page.locator(`.group:has-text("${testData.auction.title}")`).first();
    await expect(cardLocator).toBeVisible({ timeout: 15000 });
    console.log('- Verified: Auction card is visible.');

    // Visual ID
    await expect(cardLocator.locator(`img[alt="${testData.auction.title}"]`)).toBeVisible();
    await expect(cardLocator.locator(`img[alt="${testData.seller.name}"]`)).toBeVisible();
    console.log('- Verified: Main image and seller logo are visible.');
    
    // Main Info
    await expect(cardLocator.locator('h3')).toContainText(testData.auction.title);
    await expect(cardLocator.locator(`a[href="/auctions/${createdAuction!.publicId}"]`)).toHaveCount(2);
    await expect(cardLocator.getByText(`ID: ${createdAuction!.publicId}`)).toBeVisible();
    console.log('- Verified: Title, links, and public ID are correct.');

    // Status & Badges
    await expect(cardLocator.getByText('Aberto para Lances')).toBeVisible();
    await expect(cardLocator.getByText('DESTAQUE')).toBeVisible();
    await expect(cardLocator.getByText('ENCERRA HOJE')).toBeVisible();
    console.log('- Verified: Status and mental trigger badges are displayed.');

    // Data & Counters
    await expect(cardLocator.getByTitle(`${testData.auction.totalLots} Lotes`)).toBeVisible();
    await expect(cardLocator.getByText(`R$ ${testData.auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)).toBeVisible();
    await expect(cardLocator.getByText('Extrajudicial')).toBeVisible();
    await expect(cardLocator.getByTitle(`${testData.auction.visits} Visitas`)).toBeVisible();
    await expect(cardLocator.getByTitle(`${testData.auction.totalHabilitatedUsers} Usuários Habilitados`)).toBeVisible();
    console.log('- Verified: All counters and data points are correct.');

    // Timeline
    await expect(cardLocator.getByText('ETAPAS DO LEILÃO')).toBeVisible();
    await expect(cardLocator.getByText('1ª Praça')).toBeVisible();
    await expect(cardLocator.getByText('2ª Praça')).toBeVisible();
    console.log('- Verified: Auction stages timeline is visible.');
    
    // User Actions
    await expect(cardLocator.getByText(`Ver Lotes (${testData.auction.totalLots})`)).toBeVisible();
    await cardLocator.hover();
    await expect(cardLocator.getByLabel('Favoritar')).toBeVisible();
    await expect(cardLocator.getByLabel('Pré-visualizar')).toBeVisible();
    await expect(cardLocator.getByLabel('Compartilhar')).toBeVisible();
    await expect(cardLocator.getByLabel('Opções de Edição')).toBeVisible();
  });
});
