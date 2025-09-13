// tests/auction-data.test.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AuctionService } from '@/services/auction.service';
import { LotService } from '@/services/lot.service';

const auctionService = new AuctionService();
const lotService = new LotService();
const testRunId = `card-data-${uuidv4().substring(0, 8)}`;

const testData = {
  auctioneer: { name: `Leiloeiro Conteúdo ${testRunId}` },
  seller: { name: `Comitente Conteúdo ${testRunId}` },
  category: { name: `Eletrônicos ${testRunId}` },
  auction: {
    title: `Leilão de Notebooks ${testRunId}`,
    status: 'ABERTO_PARA_LANCES' as const,
    visits: 250,
    totalHabilitatedUsers: 35,
    auctionType: 'EXTRAJUDICIAL' as const,
    isFeaturedOnMarketplace: true,
  },
  lot: {
    title: `Notebook Gamer Alienware ${testRunId}`,
    price: 3800.00,
    bidsCount: 15,
  }
};

let createdAuction: Auction;
let createdLot: Lot;

async function createTestData() {
    const category = await prisma.lotCategory.create({
        data: { name: testData.category.name, slug: slugify(testData.category.name), hasSubcategories: false }
    });

    const auctioneer = await prisma.auctioneer.create({
        data: { name: testData.auctioneer.name, slug: slugify(testData.auctioneer.name), publicId: `auct-pub-${testRunId}` }
    });

    const seller = await prisma.seller.create({
        data: { name: testData.seller.name, slug: slugify(testData.seller.name), publicId: `seller-pub-${testRunId}`, isJudicial: false }
    });
    
    const auctionResult = await auctionService.createAuction({
        ...testData.auction,
        auctioneerId: auctioneer.id,
        sellerId: seller.id,
        categoryId: category.id,
        auctionStages: [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)}],
    } as any);
    
    assert.ok(auctionResult.success && auctionResult.auctionId, 'Failed to create test auction');
    createdAuction = (await auctionService.getAuctionById(auctionResult.auctionId))!;
    
    const lotResult = await lotService.createLot({
        ...testData.lot,
        auctionId: createdAuction.id,
        type: category.name,
        categoryId: category.id,
        status: 'ABERTO_PARA_LANCES'
    });
    
    assert.ok(lotResult.success && lotResult.lotId, 'Failed to create test lot');
    createdLot = (await lotService.getLotById(lotResult.lotId))!;

    return { auction: createdAuction, lot: createdLot };
}

async function cleanupTestData() {
  try {
    if (createdAuction) {
        await prisma.lot.deleteMany({ where: { auctionId: createdAuction.id } });
        await prisma.auction.deleteMany({ where: { id: createdAuction.id } });
    }
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
  } catch (e) {
    console.error(`Error during data-validation cleanup:`, e);
  }
}

describe('Data Validation for UI Components (Service-Layer)', () => {

    beforeAll(async () => {
        await cleanupTestData(); // Clean first
        await createTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    it('should fetch auction data with all necessary details for card display', async () => {
        console.log('--- Test: Validating Auction Data for Card ---');
        const fetchedAuction = await auctionService.getAuctionById(createdAuction.id);

        assert.ok(fetchedAuction, 'Fetched auction should not be null');
        assert.strictEqual(fetchedAuction.title, testData.auction.title, 'Title should match');
        assert.strictEqual(fetchedAuction.status, 'ABERTO_PARA_LANCES', 'Status should be correct');
        assert.strictEqual(fetchedAuction.isFeaturedOnMarketplace, true, 'isFeatured should be true');
        assert.strictEqual(fetchedAuction.totalLots, 1, 'Total lots should be correct');
        assert.strictEqual(fetchedAuction.seller?.name, testData.seller.name, 'Seller name should be populated');
        console.log('- PASSED: Auction data is correct and properly populated.');
    });

    it('should fetch lot data with all necessary details for card display', async () => {
        console.log('--- Test: Validating Lot Data for Card ---');
        const fetchedLot = await lotService.getLotById(createdLot.id);

        assert.ok(fetchedLot, 'Fetched lot should not be null');
        assert.strictEqual(fetchedLot.title, testData.lot.title, 'Lot title should match');
        assert.strictEqual(fetchedLot.price, testData.lot.price, 'Lot price should be correct');
        assert.strictEqual(fetchedLot.status, 'ABERTO_PARA_LANCES', 'Lot status should be correct');
        assert.strictEqual(fetchedLot.auctionName, testData.auction.title, 'Parent auction name should be denormalized');
        console.log('- PASSED: Lot data is correct and properly populated.');
    });
});
