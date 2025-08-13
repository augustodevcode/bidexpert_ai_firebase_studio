// tests/search-and-filter.test.ts
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';

let prisma: PrismaClient;
const lotService = new LotService();
const auctionService = new AuctionService();
const testRunId = `search-service-${uuidv4().substring(0, 8)}`;

// Test Data Placeholders
let category1: LotCategory, category2: LotCategory;
let seller1: SellerProfileInfo;
let auctioneer1: AuctioneerProfileInfo;
let auction1: Auction, auction2: Auction, auction3: Auction;
let lot1: Lot, lot2: Lot, lot3: Lot, lot4: Lot;


async function createSearchTestData() {
    console.log(`[Search Service Test] Creating test data for run: ${testRunId}`);
    
    [category1, category2] = await prisma.$transaction([
        prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    seller1 = await prisma.seller.create({ data: { name: `Comitente A ${testRunId}`, slug: `comitente-a-${testRunId}`, publicId: `pub-seller-a-${testRunId}`, isJudicial: false, city: 'São Paulo', state: 'SP' } });
    
    auctioneer1 = await prisma.auctioneer.create({ data: { name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}` } });

    [auction1, auction2, auction3] = await prisma.$transaction([
        prisma.auction.create({ data: { title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', latitude: -23.550520, longitude: -46.633308 } as any }),
        prisma.auction.create({ data: { title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category2.id, city: 'Rio de Janeiro', state: 'RJ', latitude: -22.906847, longitude: -43.172896 } as any }),
        prisma.auction.create({ data: { title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP' } as any })
    ]);

    [lot1, lot2, lot3, lot4] = await prisma.$transaction([
        prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.550520, longitude: -46.633308 } as any }),
        prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ', latitude: -22.906847, longitude: -43.172896 } as any }),
        prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction1.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.5613, longitude: -46.6800 } as any }),
        prisma.lot.create({ data: { title: `Terreno sem Coordenadas ${testRunId}`, publicId: `pub-lot-4-${testRunId}`, auctionId: auction3.id, price: 120000, type: category2.name, categoryId: category2.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP' } as any })
    ]);
    console.log(`[Search Service Test] Test data created.`);
}

async function cleanupSearchTestData() {
  console.log(`[Search Service Test] Cleaning up test data for run: ${testRunId}`);
  if (!prisma) return;
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

describe('Search and Filter Service Logic Test', () => {

    before(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupSearchTestData();
        await createSearchTestData();
    });

    after(async () => {
        await cleanupSearchTestData();
        await prisma.$disconnect();
    });

    test('should fetch lots filtered by auctionId', async () => {
        console.log('--- Test: Fetching lots by a specific auction ID ---');
        // Act
        const lots = await lotService.getLots(auction1.id);
        
        // Assert
        console.log(`[ASSERT] Found ${lots.length} lots for auction ${auction1.id}`);
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
        console.log(`[ASSERT] Found ${testLots.length} total test lots.`);
        assert.ok(testLots.length >= 4, 'Should fetch all lots, including the 4 test lots');
        console.log('- PASSED: Correctly fetched all lots.');
    });
    
    test('should fetch auctions by auctioneer slug', async () => {
        console.log('--- Test: Fetching auctions by auctioneer slug ---');
        // Act
        const auctions = await auctionService.getAuctionsByAuctioneerSlug(auctioneer1.slug);
        
        // Assert
        console.log(`[ASSERT] Found ${auctions.length} auctions for auctioneer ${auctioneer1.slug}`);
        assert.ok(auctions.length >= 3, 'Should fetch all auctions for the test auctioneer');
        console.log('- PASSED: Correctly fetched auctions by auctioneer slug.');
    });
});
