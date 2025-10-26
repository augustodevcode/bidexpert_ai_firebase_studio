// tests/search-and-filter.test.ts
import { test, describe, beforeAll, afterAll, it, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/ui-helpers';
import type { Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot, Tenant } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only and next/headers
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: () => new Headers() }));

import { getLots } from '@/app/admin/lots/actions';
import { getAuctions } from '@/app/admin/auctions/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `search-service-action-${uuidv4().substring(0, 8)}`;
let category1: LotCategory, category2: LotCategory;
let seller1: SellerProfileInfo;
let auctioneer1: AuctioneerProfileInfo;
let auction1: Auction, auction2: Auction, auction3: Auction;
let lot1: Lot, lot2: Lot, lot3: Lot, lot4: Lot;
let testTenant: Tenant;
let adminUser: any;

async function createSearchTestData() {
    console.log(`[Search Service Test] Creating test data for run: ${testRunId}`);
    
    testTenant = await prisma.tenant.create({ data: { name: `Search Test Tenant ${testRunId}`, subdomain: `search-${testRunId}` } });

    const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] }});
    const userRes = await createUser({ fullName: 'Search Admin', email: `search-admin-${testRunId}@test.com`, password: '123', roleIds: [adminRole.id], tenantId: testTenant.id });
    adminUser = await getUserProfileData(userRes.userId!);

    [category1, category2] = await prisma.$transaction([
        prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-${testRunId}`, hasSubcategories: false } }),
        prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-${testRunId}`, hasSubcategories: false } })
    ]);

    [seller1] = await prisma.$transaction([
        prisma.seller.create({ data: { tenantId: testTenant.id, name: `Comitente A ${testRunId}`, slug: `comitente-a-${testRunId}`, publicId: `pub-seller-a-${testRunId}`, isJudicial: false, city: 'São Paulo', state: 'SP' } }),
    ]);
    
    auctioneer1 = await prisma.auctioneer.create({ data: { tenantId: testTenant.id, name: `Leiloeiro Search ${testRunId}`, slug: `leiloeiro-search-${testRunId}`, publicId: `pub-auctioneer-search-${testRunId}` } });

    const now = new Date();
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    [auction1, auction2, auction3] = await prisma.$transaction([
        prisma.auction.create({ data: { title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } as any }),
        prisma.auction.create({ data: { title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category2.id, city: 'Rio de Janeiro', state: 'RJ', latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } as any }),
        prisma.auction.create({ data: { title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, city: 'São Paulo', state: 'SP', latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } as any })
    ]);

    [lot1, lot2, lot3, lot4] = await prisma.$transaction([
        prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } as any }),
        prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ', latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } as any }),
        prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, auctionId: auction3.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } as any }),
        prisma.lot.create({ data: { title: `Terreno sem Coordenadas ${testRunId}`, publicId: `pub-lot-4-${testRunId}`, auctionId: auction3.id, price: 120000, type: category2.name, categoryId: category2.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', tenantId: testTenant.id } as any })
    ]);
    console.log(`[Search Service Test] Test data created.`);
}

async function cleanupSearchTestData() {
  console.log(`[Search Service Test] Cleaning up test data for run: ${testRunId}`);
  try {
    await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
    await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
  } catch (e) {
    console.error("Error cleaning up search test data", e);
  }
}

describe('Search and Filter Action Logic Test (Tenant-Aware)', () => {
    beforeAll(createSearchTestData);
    afterAll(cleanupSearchTestData);

    it('should fetch lots filtered by auctionId via action', async () => {
        const lots = await callActionAsUser(getLots, adminUser, auction1.id, true);
        assert.strictEqual(lots.length, 1, 'Should return only the 1 lot from auction1');
        assert.ok(lots.some(l => l.title.includes('Ford Ka')), 'Should include Ford Ka lot');
    });

    it('should fetch all lots for the tenant when no auctionId is provided via action', async () => {
        const lots = await callActionAsUser(getLots, adminUser, undefined, true);
        const testLots = lots.filter(l => l.title.includes(testRunId));
        assert.strictEqual(testLots.length, 4, 'Should fetch all 4 lots for the tenant');
    });

    it('should fetch auctions by auctioneer slug via action', async () => {
        const auctions = await callActionAsUser(getAuctions, adminUser, true);
        const filtered = auctions.filter(a => a.auctioneerId === auctioneer1.id);
        assert.strictEqual(filtered.length, 3, 'Should fetch all 3 auctions for the test auctioneer');
    });

    it('should not fetch auctions from another tenant, even with correct slug', async () => {
        const otherTenant = await prisma.tenant.create({ data: { name: `Other Tenant ${testRunId}`, subdomain: `other-${testRunId}` } });
        const otherAdmin = await createUser({ fullName: 'Other Admin', email: `other-admin-${testRunId}@test.com`, password: '123', roleIds: [], tenantId: otherTenant.id }).then(res => getUserProfileData(res.userId!));

        const auctions = await callActionAsUser(getAuctions, otherAdmin, true);
        assert.strictEqual(auctions.filter(a => a.title.includes(testRunId)).length, 0, 'Should return 0 auctions from the test run when querying from another tenant context');
        
        await prisma.tenant.delete({ where: { id: otherTenant.id } });
        await prisma.user.delete({ where: { id: otherAdmin!.id } });
    });
});
