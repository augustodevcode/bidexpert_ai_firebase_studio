// tests/ui/auction-card-details.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';
import { slugify } from '../../src/lib/sample-data-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../../src/types';

// Data for our test, using a unique ID to avoid collisions
const testRunId = `card-test-${Math.random().toString(36).substring(2, 8)}`;
const testData = {
  auctioneer: {
    name: `Leiloeiro Card ${testRunId}`,
    logoUrl: 'https://placehold.co/40x40/3498db/ffffff.png?text=L',
    dataAiHintLogo: 'leiloeiro logo'
  },
  seller: {
    name: `Comitente Card ${testRunId}`,
    logoUrl: 'https://placehold.co/40x40/2ecc71/ffffff.png?text=C',
    dataAiHintLogo: 'comitente logo'
  },
  category: {
    name: `Categoria Card ${testRunId}`,
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
    city: 'Testville',
    state: 'TS',
    imageUrl: 'https://placehold.co/600x400/f97316/ffffff.png?text=Leilao',
    dataAiHint: 'leilao card test'
  }
};

let createdAuction: Auction;

async function createTestData(): Promise<Auction> {
  const category = await prisma.lotCategory.create({
    data: { name: testData.category.name, slug: slugify(testData.category.name), hasSubcategories: false }
  });

  const auctioneer = await prisma.auctioneer.create({
    data: { 
        name: testData.auctioneer.name, 
        slug: slugify(testData.auctioneer.name), 
        publicId: `pub-auct-${testRunId}`,
        logoUrl: testData.auctioneer.logoUrl,
        dataAiHintLogo: testData.auctioneer.dataAiHintLogo
    }
  });

  const seller = await prisma.seller.create({
    data: {
        name: testData.seller.name,
        slug: slugify(testData.seller.name),
        publicId: `pub-seller-${testRunId}`,
        logoUrl: testData.seller.logoUrl,
        dataAiHintLogo: testData.seller.dataAiHintLogo,
        isJudicial: false
    }
  });

  const now = new Date();
  const endDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Ends today to trigger badge
  const stage1End = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  
  const auctionData: any = {
      ...testData.auction,
      slug: slugify(testData.auction.title),
      publicId: `pub-auction-${testRunId}`,
      auctioneerId: auctioneer.id,
      sellerId: seller.id,
      categoryId: category.id,
      auctionDate: now,
      endDate: endDate,
      auctionStages: {
        create: [
          { name: '1ª Praça', endDate: stage1End, initialPrice: 1500 },
          { name: '2ª Praça', endDate: endDate, initialPrice: 750 }
        ]
      }
  };
  
  const auction = await prisma.auction.create({
    data: auctionData
  });
  
  // Create lots for the auction to have a correct lot count
  await prisma.lot.createMany({
      data: Array.from({ length: testData.auction.totalLots }).map((_, i) => ({
          title: `Lote ${i+1} de ${testData.auction.title}`,
          number: `${i+1}`,
          auctionId: auction.id,
          price: testData.auction.initialOffer + (i * 100),
          status: 'ABERTO_PARA_LANCES',
          categoryId: category.id
      }))
  });

  return auction as Auction;
}

async function cleanupTestData() {
    await prisma.lot.deleteMany({ where: { auctionId: createdAuction.id }});
    await prisma.auctionStage.deleteMany({ where: { auctionId: createdAuction.id }});
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
}

test.describe('Auction Card and List Item UI Validation', () => {

  test.beforeAll(async () => {
    createdAuction = await createTestData();
  });

  test.afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    // Use the search page to easily isolate the test item
    await page.goto('/search?type=auctions'); 
  });

  test('should display all required information on the Auction Card', async ({ page }) => {
    const cardLocator = page.locator(`.group:has-text("${testData.auction.title}")`).first();
    await expect(cardLocator).toBeVisible({ timeout: 15000 });

    // Visual ID
    await expect(cardLocator.locator(`img[alt="${testData.auction.title}"]`)).toBeVisible();
    await expect(cardLocator.locator(`img[alt="${testData.seller.name}"]`)).toBeVisible();
    
    // Main Info
    await expect(cardLocator.locator('h3')).toHaveText(testData.auction.title);
    await expect(cardLocator.locator(`a[href="/auctions/${createdAuction.publicId}"]`)).toHaveCount(2);
    await expect(cardLocator.getByText(`ID: ${createdAuction.publicId}`)).toBeVisible();

    // Status & Badges
    await expect(cardLocator.getByText('Aberto para Lances')).toBeVisible();
    await expect(cardLocator.getByText('DESTAQUE')).toBeVisible();
    await expect(cardLocator.getByText('ENCERRA HOJE')).toBeVisible();

    // Data & Counters
    await expect(cardLocator.getByTitle(`${testData.auction.totalLots} Lotes`)).toBeVisible();
    await expect(cardLocator.getByText(`R$ ${testData.auction.initialOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)).toBeVisible();
    await expect(cardLocator.getByText('Extrajudicial')).toBeVisible();
    await expect(cardLocator.getByText(testData.category.name)).toBeVisible();
    await expect(cardLocator.getByText(`${testData.auction.city} - ${testData.auction.state}`)).toBeVisible();
    await expect(cardLocator.getByTitle(`${testData.auction.visits} Visitas`)).toBeVisible();
    await expect(cardLocator.getByTitle(`${testData.auction.totalHabilitatedUsers} Usuários Habilitados`)).toBeVisible();

    // Timeline
    await expect(cardLocator.getByText('ETAPAS DO LEILÃO')).toBeVisible();
    await expect(cardLocator.getByText('1ª Praça')).toBeVisible();
    await expect(cardLocator.getByText('2ª Praça')).toBeVisible();
    
    // User Actions
    await expect(cardLocator.getByText(`Ver Lotes (${testData.auction.totalLots})`)).toBeVisible();
    await cardLocator.hover();
    await expect(cardLocator.getByLabel('Favoritar')).toBeVisible();
    await expect(cardLocator.getByLabel('Pré-visualizar')).toBeVisible();
    await expect(cardLocator.getByLabel('Compartilhar')).toBeVisible();
  });
  
});
