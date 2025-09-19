
// tests/search-and-filter.test.ts
import { test, describe, beforeAll, afterAll, it, expect } from 'vitest';
import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import { slugify } from '@/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { LotService } from '@/services/lot.service';
import { AuctionService } from '@/services/auction.service';
import { tenantContext } from '@/lib/prisma';

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
let testTenant: any;


async function createSearchTestData() {
    console.log(`[Search Service Test] Creating test data for run: ${testRunId}`);
    
    testTenant = await prisma.tenant.create({ data: { name: `Search Test Tenant ${testRunId}`, subdomain: `search-${testRunId}` }});

    [category1, category2] = await prisma.$transaction([
        prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    seller1 = await tenantContext.run({ tenantId: testTenant.id }, async () => 
        prisma.seller.create({ data: { name: `Comitente A ${testRunId}`, slug: `comitente-a-${testRunId}`, publicId: `pub-seller-a-${testRunId}`, isJudicial: false, city: 'São Paulo', state: 'SP', tenantId: testTenant.id } })
    );
    
    auctioneer1 = await tenantContext.run({ tenantId: testTenant.id }, async () =>
        prisma.auctioneer.create({ data: { name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}`, tenantId: testTenant.id } })
    );
    
    const now = new Date();
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    const [auc1, auc2, auc3] = await tenantContext.run({ tenantId: testTenant.id }, async () => {
        return prisma.$transaction([
            prisma.auction.create({ data: { title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } as any }),
            prisma.auction.create({ data: { title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category2.id, city: 'Rio de Janeiro', state: 'RJ', latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } as any }),
            prisma.auction.create({ data: { title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } as any })
        ]);
    });
    auction1 = auc1;
    auction2 = auc2;
    auction3 = auc3;

    [lot1, lot2, lot3, lot4] = await tenantContext.run({ tenantId: testTenant.id }, async () => {
        return prisma.$transaction([
            prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } as any }),
            prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ', latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } as any }),
            prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction3.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } as any }),
            prisma.lot.create({ data: { title: `Terreno sem Coordenadas ${testRunId}`, publicId: `pub-lot-4-${testRunId}`, auctionId: auction3.id, price: 120000, type: category2.name, categoryId: category2.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', tenantId: testTenant.id } as any })
        ]);
    });
    console.log(`[Search Service Test] Test data created.`);
}

async function cleanupSearchTestData() {
  console.log(`[Search Service Test] Cleaning up test data for run: ${testRunId}`);
  if (!prisma) return;
  try {
    await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
  } catch (e) {
    console.error("Error cleaning up search test data", e);
  }
}

describe('Search and Filter Service Logic Test (Tenant-Aware)', () => {

    beforeAll(async () => {
        prisma = new PrismaClient();
        await prisma.$connect();
        await cleanupSearchTestData();
        try {
            await createSearchTestData();
        } catch(error: any) {
            console.error("Test setup failed:", error);
            if (error.message.includes("Unknown argument")) {
                console.log("\nRECOMMENDED ACTION: The database schema is out of sync with the test data. Please add the missing field to your 'prisma/schema.prisma' file and run 'npx prisma db push'.\n");
            }
            throw error;
        }
    });

    afterAll(async () => {
        await cleanupSearchTestData();
        await prisma.$disconnect();
    });

    it('should fetch lots filtered by auctionId within tenant context', async () => {
        console.log('--- Test: Fetching lots by a specific auction ID ---');
        // Act: Run the service call within the tenant context
        const lots = await tenantContext.run({ tenantId: testTenant.id }, () => lotService.getLots(auction1.id, testTenant.id));
        
        // Assert
        console.log(`[ASSERT] Found ${lots.length} lots for auction ${auction1.id}`);
        assert.strictEqual(lots.length, 1, 'Should return only the 1 lot from auction1'); // Ford Ka
        assert.ok(lots.some(l => l.title.includes('Ford Ka')), 'Should include Ford Ka lot');
        console.log('- PASSED: Correctly filtered lots by auctionId.');
    });
    
    it('should fetch all lots for the tenant when no auctionId is provided', async () => {
        console.log('--- Test: Fetching all lots for a tenant ---');
        // Act
        const lots = await tenantContext.run({ tenantId: testTenant.id }, () => lotService.getLots(undefined, testTenant.id));
        
        // Assert
        const testLots = lots.filter(l => l.title.includes(testRunId));
        console.log(`[ASSERT] Found ${testLots.length} total test lots for tenant.`);
        assert.strictEqual(testLots.length, 4, 'Should fetch all 4 lots for the tenant');
        console.log('- PASSED: Correctly fetched all lots for the tenant.');
    });
    
    it('should fetch auctions by auctioneer slug within tenant context', async () => {
        console.log('--- Test: Fetching auctions by auctioneer slug ---');
        // Act
        const auctions = await tenantContext.run({ tenantId: testTenant.id }, () => auctionService.getAuctionsByAuctioneerSlug(testTenant.id, auctioneer1.slug!));
        
        // Assert
        console.log(`[ASSERT] Found ${auctions.length} auctions for auctioneer ${auctioneer1.slug}`);
        assert.strictEqual(auctions.length, 3, 'Should fetch all 3 auctions for the test auctioneer in this tenant');
        console.log('- PASSED: Correctly fetched auctions by auctioneer slug.');
    });

    it('should not fetch auctions from another tenant, even with correct slug', async () => {
        console.log('--- Test: Attempting to fetch auctions from a different tenant context ---');
        // Create a separate tenant to test isolation
        const otherTenant = await prisma.tenant.create({ data: { name: `Other Tenant ${testRunId}`, subdomain: `other-${testRunId}` } });

        // Act
        const auctions = await tenantContext.run({ tenantId: otherTenant.id }, () => auctionService.getAuctionsByAuctioneerSlug(otherTenant.id, auctioneer1.slug!));
        
        // Assert
        assert.strictEqual(auctions.length, 0, 'Should return 0 auctions when querying from a different tenant context');
        console.log('- PASSED: Correctly isolated data and returned no auctions.');

        // Cleanup
        await prisma.tenant.delete({ where: { id: otherTenant.id } });
    });
});
