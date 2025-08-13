
// tests/search-and-filter.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { LotService } from '../services/lot.service'; // Import service to test

let prisma: PrismaClient;
const lotService = new LotService();
const testRunId = `search-service-${uuidv4().substring(0, 8)}`;

let category1: LotCategory, category2: LotCategory;
let auction1: Auction, auction2: Auction;
let lot1: Lot, lot2: Lot, lot3: Lot;

async function createSearchTestData() {
    console.log(`[Search Service Test] Creating test data for run: ${testRunId}`);
    
    [category1, category2] = await prisma.$transaction([
        prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    const auctioneer = await prisma.auctioneer.create({ data: { name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}` } });
    const seller = await prisma.seller.create({ data: { name: `Comitente Search ${testRunId}`, slug: `comitente-search-${testRunId}`, publicId: `pub-seller-search-${testRunId}`, isJudicial: false } });

    [auction1, auction2] = await prisma.$transaction([
        prisma.auction.create({ data: { title: `Leilão de Carros ${testRunId}`, slug: `leilao-carros-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer.id, sellerId: seller.id, categoryId: category1.id } as any }),
        prisma.auction.create({ data: { title: `Leilão de Imóveis ${testRunId}`, slug: `leilao-imoveis-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(), auctioneerId: auctioneer.id, sellerId: seller.id, categoryId: category2.id } as any })
    ]);

    [lot1, lot2, lot3] = await prisma.$transaction([
        prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES' } as any }),
        prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE' } as any }),
        prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction1.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES' } as any })
    ]);
    console.log(`[Search Service Test] Test data created.`);
}

async function cleanupSearchTestData() {
  console.log(`[Search Service Test] Cleaning up test data for run: ${testRunId}`);
  try {
    await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    const seller = await prisma.seller.findFirst({where: {name: {contains: testRunId}}});
    if(seller) await prisma.seller.delete({ where: { id: seller.id } });
    const auctioneer = await prisma.auctioneer.findFirst({where: {name: {contains: testRunId}}});
    if(auctioneer) await prisma.auctioneer.delete({ where: { id: auctioneer.id } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
  } catch (e) {
    console.error("Error cleaning up search test data", e);
  }
}

test.describe('Search and Filter Service Logic Test', () => {

    test.before(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupSearchTestData();
        await createSearchTestData();
    });

    test.after(async () => {
        await cleanupSearchTestData();
        await prisma.$disconnect();
    });

    test('should fetch lots filtered by auctionId', async () => {
        console.log('--- Test: Fetching lots by a specific auction ID ---');
        // Act
        const lots = await lotService.getLots(auction1.id);
        
        // Assert
        assert.strictEqual(lots.length, 2, 'Should return only the 2 lots from auction1');
        assert.ok(lots.some(l => l.title.includes('Ford Ka')), 'Should include Ford Ka lot');
        assert.ok(lots.some(l => l.title.includes('Ford Maverick')), 'Should include Ford Maverick lot');
        assert.ok(!lots.some(l => l.title.includes('Apartamento')), 'Should not include the lot from auction2');
        console.log('- PASSED: Correctly filtered lots by auctionId.');
    });
    
    test('should fetch all lots when no auctionId is provided', async () => {
        console.log('--- Test: Fetching all lots ---');
        // Act
        const lots = await lotService.getLots();
        
        // Assert
        const testLots = lots.filter(l => l.title.includes(testRunId));
        assert.ok(testLots.length >= 3, 'Should fetch all lots, including the 3 test lots');
        console.log('- PASSED: Correctly fetched all lots.');
    });
});
