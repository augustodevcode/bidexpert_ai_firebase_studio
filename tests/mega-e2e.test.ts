// tests/mega-e2e.test.ts
/**
 * @fileoverview Mega Test Suite for E2E validation.
 * This file combines multiple E2E test suites into a single file for comprehensive validation of key user flows.
 * Each suite is encapsulated in its own 'describe' block with its own setup and teardown to ensure data isolation.
 *
 * It includes:
 * 1. Search and Filter Service Logic Test
 * 2. Full Auction & Bidding Lifecycle Test
 * 3. Auction Creation Wizard Lifecycle Test
 * 4. Administration CRUD Scenarios (from TESTING_SCENARIOS.md)
 * 5. User Habilitation Flow (from TESTING_SCENARIOS.md)
 * 6. Bidding and Checkout Flow (from TESTING_SCENARIOS.md)
 */

import { describe, test, beforeAll, afterAll, expect, it, vi } from 'vitest';
import assert from 'node:assert';
import { PrismaClient, LotStatus, UserHabilitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '@/lib/ui-helpers';
import { tenantContext } from '@/lib/prisma';

// Import Services
import { LotService } from '@/services/lot.service';
import { AuctionService } from '@/services/auction.service';

// Import Server Actions
import * as authActions from '@/app/auth/actions';
import { createAuction, getAuction, deleteAuction, updateAuction } from '@/app/admin/auctions/actions';
import { createLot, getLot, deleteLot, finalizeLot } from '@/app/admin/lots/actions';
import { createUser, getUserProfileData, deleteUser, updateUser } from '@/app/admin/users/actions';
import { createSeller, getSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { createJudicialProcessAction, deleteJudicialProcess } from '@/app/admin/judicial-processes/actions';
import { createAsset, deleteAsset, updateAsset } from '@/app/admin/assets/actions';
import { createRole, getRoles, assignRolesToUser } from '@/app/admin/roles/actions';
import { habilitateForAuctionAction, reviewUserDocuments } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { createAuctioneer, deleteAuctioneer } from '@/app/admin/auctioneers/actions';
import { createAuctionFromWizard } from '@/app/admin/wizard/actions';
import { processCheckout } from '@/app/checkout/[winId]/actions';


// Import types used across tests
import type { 
    UserProfileWithPermissions, 
    Role, 
    SellerProfileInfo, 
    AuctioneerProfileInfo, 
    LotCategory, 
    Auction, 
    Lot, 
    Asset, 
    JudicialProcess, 
    StateInfo, 
    JudicialDistrict, 
    Court, 
    JudicialBranch, 
    AuctionFormData, 
    LotFormData, 
    AssetFormData, 
    JudicialProcessFormData,
    WizardData,
    Tenant,
    UserWin
} from '@/types';

// Mock server-only and next/headers for server action testing
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));

// --- Centralized Prisma Client ---
const prisma = new PrismaClient();

// --- Test Utility Functions (from test-utils.ts and other files) ---

async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const tenantId = user?.tenants?.[0]?.id || '1'; // Default to landlord if user has no specific tenant

    // Use vi.spyOn to mock the implementation of getSession for the duration of this call
    const getSessionSpy = vi.spyOn(authActions, 'getSession').mockResolvedValue(
        user ? { userId: user.id, tenantId: tenantId, permissions: user.permissions, user: {} as any } : null
    );

    try {
        return await tenantContext.run({ tenantId }, () => action(...args));
    } finally {
        // Restore the original implementation after the action has been called
        getSessionSpy.mockRestore();
    }
}

async function createTestPrerequisites(testRunId: string, prefix: string) {
    const tenant = await prisma.tenant.create({ data: { name: `${prefix} Tenant ${testRunId}`, subdomain: `${prefix}-${testRunId}` } });

    const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: `role-admin-${prefix}-${testRunId}`, name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
    const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { id: `role-user-${prefix}-${testRunId}`, name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } });
    
    const adminRes = await callActionAsUser(createUser, null, {
        fullName: `Admin ${prefix} ${testRunId}`,
        email: `admin-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [adminRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'HABILITADO'
    });
    const adminUser = await callActionAsUser(getUserProfileData, null, adminRes.userId!);

    const unauthorizedUserRes = await callActionAsUser(createUser, null, {
        fullName: `Unauthorized ${prefix} ${testRunId}`,
        email: `unauthorized-${prefix}-${testRunId}@test.com`,
        password: 'password123',
        roleIds: [userRole!.id],
        tenantId: tenant.id,
        habilitationStatus: 'PENDING_DOCUMENTS'
    });
    const unauthorizedUser = await callActionAsUser(getUserProfileData, null, unauthorizedUserRes.userId!);
    
    const category = await prisma.lotCategory.create({ data: { name: `Cat ${prefix} ${testRunId}`, slug: `cat-${prefix}-${testRunId}`, hasSubcategories: false } });
    const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Auctioneer ${prefix} ${testRunId}` } as any);
    const auctioneer = (await prisma.auctioneer.findUnique({where: {id: auctioneerRes.auctioneerId}}))!;
    
    const uniqueUf = `${prefix.substring(0,1).toUpperCase()}${testRunId.substring(0, 1).toUpperCase()}`;
    const state = await prisma.state.upsert({ where: { uf: uniqueUf }, update: {}, create: { name: `State ${prefix} ${testRunId}`, uf: uniqueUf, slug: `st-${prefix}-${testRunId}` } });
    const court = await prisma.court.create({ data: { name: `Court ${prefix} ${testRunId}`, stateUf: state.uf, slug: `court-${prefix}-${testRunId}` } });
    const district = await prisma.judicialDistrict.create({ data: { name: `District ${prefix} ${testRunId}`, slug: `dist-${prefix}-${testRunId}`, courtId: court.id, stateId: state.id } });
    const branch = await prisma.judicialBranch.create({ data: { name: `Branch ${prefix} ${testRunId}`, slug: `branch-${prefix}-${testRunId}`, districtId: district.id } });
    
    const judicialSellerRes = await callActionAsUser(createSeller, adminUser, { name: `Vara ${prefix} ${testRunId}`, isJudicial: true, judicialBranchId: branch.id } as any);
    const judicialSeller = (await callActionAsUser(getSeller, adminUser, judicialSellerRes.sellerId!))!;

    const procRes = await callActionAsUser(createJudicialProcessAction, adminUser, { processNumber: `500-${prefix}-${testRunId}`, isElectronic: true, courtId: court.id, districtId: district.id, branchId: branch.id, sellerId: judicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] } as any);
    const judicialProcess = (await prisma.judicialProcess.findUnique({where: {id: procRes.processId}}))!;

    const assetRes = await callActionAsUser(createAsset, adminUser, { title: `Asset para ${prefix} ${testRunId}`, judicialProcessId: judicialProcess.id, categoryId: category.id, status: 'DISPONIVEL', evaluationValue: 50000.00 } as any);
    const asset = (await prisma.asset.findUnique({where: {id: assetRes.assetId}}))!;

    return { tenant, adminUser, unauthorizedUser, category, auctioneer, judicialSeller, state, court, district, branch, judicialProcess, asset };
}

async function cleanup(testRunId: string, prefix: string) {
    const tenant = await prisma.tenant.findFirst({ where: { name: { contains: `${prefix} Tenant ${testRunId}` } } });
    if (!tenant) return;

    try {
        await tenantContext.run({ tenantId: tenant.id }, async () => {
            const userEmails = [ `admin-${prefix}-${testRunId}@test.com`, `unauthorized-${prefix}-${testRunId}@test.com` ];
            const users = await prisma.user.findMany({ where: { email: { in: userEmails } }});
            if (users.length > 0) {
                 const userIds = users.map(u => u.id);
                 await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
                 await prisma.usersOnTenants.deleteMany({ where: { userId: { in: userIds } } });
                 await prisma.user.deleteMany({ where: { id: { in: userIds } } });
            }
            await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.judicialProcess.deleteMany({ where: { processNumber: { contains: testRunId } } });
            await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
            await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        });
        await prisma.judicialBranch.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialDistrict.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.court.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.state.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.tenant.delete({ where: { id: tenant.id } });

    } catch (error) {
        console.error(`[E2E Cleanup - ${prefix}] Error during cleanup:`, error);
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// --- Suite 1: Search and Filter Service Logic ---
describe('Search and Filter Service Logic Test (Tenant-Aware)', () => {
    const testRunId = `search-service-${uuidv4().substring(0, 8)}`;
    const lotService = new LotService();
    const auctionService = new AuctionService();

    let category1: LotCategory, category2: LotCategory;
    let seller1: SellerProfileInfo;
    let auctioneer1: AuctioneerProfileInfo;
    let auction1: Auction, auction2: Auction, auction3: Auction;
    let lot1: Lot, lot2: Lot, lot3: Lot, lot4: Lot;
    let testTenant: any;

    async function createSearchTestData() {
        console.log(`[Search Service Test] Creating test data for run: ${testRunId}`);
        
        testTenant = await prisma.tenant.create({ data: { name: `Search Test Tenant ${testRunId}`, subdomain: `search-${testRunId}` }});
        const ufSP = `S${testRunId.slice(0,2)}`
        const ufRJ = `R${testRunId.slice(0,2)}`

        const [stateSP, stateRJ] = await prisma.$transaction([
            prisma.state.upsert({ where: { uf: ufSP }, update: {}, create: { name: 'São Paulo', uf: ufSP, slug: `sp-${testRunId}` } }),
            prisma.state.upsert({ where: { uf: ufRJ }, update: {}, create: { name: 'Rio de Janeiro', uf: ufRJ, slug: `rj-${testRunId}` } })
        ]);

        const [citySP, cityRJ] = await prisma.$transaction([
            prisma.city.create({ data: { name: 'São Paulo', slug: `sao-paulo-${testRunId}`, stateId: stateSP.id } }),
            prisma.city.create({ data: { name: 'Rio de Janeiro', slug: `rio-de-janeiro-${testRunId}`, stateId: stateRJ.id } })
        ]);

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

        const [auc1, auc2, auc3] = await tenantContext.run({ tenantId: testTenant.id }, async () => {
            return prisma.$transaction([
                prisma.auction.create({ data: { 
                    title: `Leilão de Carros SP ${testRunId}`, slug: `leilao-carros-sp-${testRunId}`, publicId: `pub-auc-1-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, cityId: citySP.id, stateId: stateSP.id, latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } }),
                prisma.auction.create({ data: { 
                    title: `Leilão de Apartamentos RJ ${testRunId}`, slug: `leilao-apartamentos-rj-${testRunId}`, publicId: `pub-auc-2-${testRunId}`, status: 'EM_BREVE', auctionDate: new Date(Date.now() + 86400000), auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category2.id, cityId: cityRJ.id, stateId: stateRJ.id, latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } }),
                prisma.auction.create({ data: { 
                    title: `Leilão Misto SP ${testRunId}`, slug: `leilao-misto-sp-${testRunId}`, publicId: `pub-auc-3-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, cityId: citySP.id, stateId: stateSP.id, latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } })
            ]);
        });
        auction1 = auc1; auction2 = auc2; auction3 = auc3;

        [lot1, lot2, lot3, lot4] = await tenantContext.run({ tenantId: testTenant.id }, async () => {
            return prisma.$transaction([
                prisma.lot.create({ data: { title: `Ford Ka 2019 ${testRunId}`, publicId: `pub-lot-1-${testRunId}`, slug: `ford-ka-2019-${testRunId}`, auctionId: auction1.id, price: 35000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.550520, longitude: -46.633308, tenantId: testTenant.id } }),
                prisma.lot.create({ data: { title: `Apartamento 2 Quartos ${testRunId}`, publicId: `pub-lot-2-${testRunId}`, slug: `apartamento-2-quartos-${testRunId}`, auctionId: auction2.id, price: 250000, type: category2.name, categoryId: category2.id, status: 'EM_BREVE', cityName: 'Rio de Janeiro', stateUf: 'RJ', latitude: -22.906847, longitude: -43.172896, tenantId: testTenant.id } }),
                prisma.lot.create({ data: { title: `Ford Maverick Antigo ${testRunId}`, publicId: `pub-lot-3-${testRunId}`, slug: `ford-maverick-antigo-${testRunId}`, auctionId: auction3.id, price: 95000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', latitude: -23.5613, longitude: -46.6800, tenantId: testTenant.id } }),
                prisma.lot.create({ data: { title: `Terreno sem Coordenadas ${testRunId}`, publicId: `pub-lot-4-${testRunId}`, slug: `terreno-sem-coordenadas-${testRunId}`, auctionId: auction3.id, price: 120000, type: category2.name, categoryId: category2.id, status: 'ABERTO_PARA_LANCES', cityName: 'São Paulo', stateUf: 'SP', tenantId: testTenant.id } })
            ]);
        });
    }

    async function cleanupSearchTestData() {
      if (!testTenant) return;
      try {
        await prisma.lot.deleteMany({ where: { tenantId: testTenant.id, title: { contains: testRunId } } });
        await prisma.auction.deleteMany({ where: { tenantId: testTenant.id, title: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { tenantId: testTenant.id, name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { tenantId: testTenant.id, name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.city.deleteMany({ where: { slug: { contains: testRunId } } });
        await prisma.state.deleteMany({ where: { slug: { contains: testRunId } } });
        await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
      } catch (e) { console.error("Error cleaning up search test data", e); }
    }

    beforeAll(async () => { await cleanupSearchTestData(); await createSearchTestData(); }, 60000);
    afterAll(async () => { await cleanupSearchTestData(); });

    it('should fetch lots filtered by auctionId within tenant context', async () => {
        const lots = await tenantContext.run({ tenantId: testTenant.id }, () => lotService.getLots(auction1.id, testTenant.id));
        assert.strictEqual(lots.length, 1, 'Should return only the 1 lot from auction1');
        assert.ok(lots.some(l => l.title.includes('Ford Ka')), 'Should include Ford Ka lot');
    });
    
    it('should fetch all lots for the tenant when no auctionId is provided', async () => {
        const lots = await tenantContext.run({ tenantId: testTenant.id }, () => lotService.getLots(undefined, testTenant.id));
        const testLots = lots.filter(l => l.title.includes(testRunId));
        assert.strictEqual(testLots.length, 4, 'Should fetch all 4 lots for the tenant');
    });
    
    it('should fetch auctions by auctioneer slug within tenant context', async () => {
        const auctions = await tenantContext.run({ tenantId: testTenant.id }, () => auctionService.getAuctionsByAuctioneerSlug(testTenant.id, auctioneer1.slug!));
        assert.strictEqual(auctions.length, 3, 'Should fetch all 3 auctions for the test auctioneer');
    });
});


// --- Suite 2: Full Auction & Bidding Lifecycle ---
describe(`[E2E] Full Auction & Bidding Lifecycle (via Actions)`, () => {
    const testRunId = `bidding-e2e-${uuidv4().substring(0, 8)}`;
    let testAnalyst: UserProfileWithPermissions;
    let biddingUsers: UserProfileWithPermissions[] = [];
    let consignorUser: UserProfileWithPermissions;
    let testSeller: SellerProfileInfo;
    let testAuctioneer: AuctioneerProfileInfo;
    let testCategory: LotCategory;
    let extrajudicialAuction: Auction;
    let extrajudicialLot: Lot;
    let testTenant: any;
    let adminUser: UserProfileWithPermissions;

    async function cleanupBiddingData() {
        if (!testTenant) return;
        await tenantContext.run({ tenantId: testTenant.id }, async () => {
            try {
                const userIds = [adminUser?.id, ...biddingUsers.map(u => u.id)].filter(Boolean) as string[];
                if (userIds.length > 0) {
                  await prisma.bid.deleteMany({ where: { bidderId: { in: userIds } } });
                  await prisma.usersOnRoles.deleteMany({where: {userId: {in: userIds}}});
                  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
                }
                if (extrajudicialLot) await callActionAsUser(deleteLot, adminUser, extrajudicialLot.id);
                if (extrajudicialAuction) await callActionAsUser(deleteAuction, adminUser, extrajudicialAuction.id);
                if (testSeller) await callActionAsUser(deleteSeller, adminUser, testSeller.id);
                if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
                if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
                if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
            } catch (error) { console.error("[Bidding Cleanup] Error:", error); }
        });
    }

    beforeAll(async () => {
        await cleanupBiddingData();

        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `bidding-${testRunId}` } });

        const [userRole, bidderRole, adminRole] = await Promise.all([
             prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } }),
             prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } }),
             prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } }),
        ]);
        
        const adminRes = await callActionAsUser(createUser, null, { fullName: `Admin Bidding ${testRunId}`, email: `admin-bidding-${testRunId}@test.com`, password: 'password123', roleIds: [adminRole!.id], tenantId: testTenant.id, habilitationStatus: 'HABILITADO' });
        adminUser = (await callActionAsUser(getUserProfileData, null, adminRes.userId!))!;

        for (let i = 1; i <= 2; i++) {
            const userRes = await callActionAsUser(createUser, adminUser, { fullName: `Bidder ${i} ${testRunId}`, email: `bidder${i}-${testRunId}@test.com`, password: 'password123', roleIds: [userRole!.id, bidderRole!.id], habilitationStatus: 'HABILITADO', tenantId: testTenant.id });
            biddingUsers.push((await callActionAsUser(getUserProfileData, adminUser, userRes.userId!))!);
        }
        
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Bidding ${testRunId}`, slug: `cat-bidding-${testRunId}`, hasSubcategories: false } });
        
        const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Auctioneer Bidding ${testRunId}` });
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Seller Bidding ${testRunId}`, isJudicial: false });

        assert.ok(auctioneerRes.success && auctioneerRes.auctioneerId, `Auctioneer creation failed: ${auctioneerRes.message}`);
        assert.ok(sellerRes.success && sellerRes.sellerId, `Seller creation failed: ${sellerRes.message}`);

        testAuctioneer = (await prisma.auctioneer.findUnique({ where: { id: auctioneerRes.auctioneerId! } }))!;
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId! } }))!;

        const aucRes = await callActionAsUser(createAuction, adminUser, { title: `Extrajudicial Auction ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctionStages: [{name: 'Praça Única', startDate: new Date(), endDate: new Date(Date.now() + 10 * 60 * 1000)}] } as any);
        extrajudicialAuction = (await callActionAsUser(getAuction, adminUser, aucRes.auctionId!))!;

        const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot Bidding ${testRunId}`, auctionId: extrajudicialAuction.id, price: 25000, categoryId: testCategory.id, type: testCategory.name, status: 'ABERTO_PARA_LANCES' } as Partial<LotFormData>);
        extrajudicialLot = (await callActionAsUser(getLot, adminUser, lotRes.lotId!))!;
    }, 60000);

    afterAll(async () => { await cleanupBiddingData(); });

    it('Standard Bidding: should allow habilitated users to bid and determine a winner', async () => {
        await callActionAsUser(habilitateForAuctionAction, adminUser, biddingUsers[0].id, extrajudicialAuction.id);
        await callActionAsUser(habilitateForAuctionAction, adminUser, biddingUsers[1].id, extrajudicialAuction.id);
        
        const bid1 = await callActionAsUser(placeBidOnLot, biddingUsers[0], extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[0].id, biddingUsers[0].fullName!, 26000);
        assert.ok(bid1.success, `Bid 1 should be successful. Error: ${bid1.message}`);
        let updatedLot = await callActionAsUser(getLot, adminUser, extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 26000, "Lot price should be 26000.");
        
        const bid2 = await callActionAsUser(placeBidOnLot, biddingUsers[1], extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[1].id, biddingUsers[1].fullName!, 27000);
        assert.ok(bid2.success, `Bid 2 should be successful. Error: ${bid2.message}`);
        updatedLot = await callActionAsUser(getLot, adminUser, extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 27000, "Lot price should be updated to 27000.");
        
        const finalizationResult = await callActionAsUser(finalizeLot, adminUser, extrajudicialLot.id);
        assert.ok(finalizationResult.success, `Lot finalization should succeed. Message: ${finalizationResult.message}`);
        
        const finalLot = await callActionAsUser(getLot, adminUser, extrajudicialLot.id);
        assert.strictEqual(finalLot?.status, 'VENDIDO', 'Lot status should be VENDIDO.');
        assert.strictEqual(finalLot?.winnerId, biddingUsers[1].id, 'Winner should be the highest bidder.');
    });
});


// --- Suite 3: Auction Creation Wizard Lifecycle ---
describe(`[E2E] Auction Creation Wizard Lifecycle`, () => {
    const testRunId = `wizard-e2e-${uuidv4().substring(0, 8)}`;
    let testAuctioneer: AuctioneerProfileInfo;
    let testCategory: LotCategory;
    let testJudicialSeller: SellerProfileInfo;
    let testJudicialProcess: JudicialProcess;
    let testAsset: Asset;
    let testTenant: any;
    let unauthorizedUser: UserProfileWithPermissions;
    let adminUser: UserProfileWithPermissions;
    
    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'wizard');
        testTenant = prereqs.tenant;
        adminUser = prereqs.adminUser;
        unauthorizedUser = prereqs.unauthorizedUser;
        testCategory = prereqs.category;
        testAuctioneer = prereqs.auctioneer;
        testJudicialSeller = prereqs.judicialSeller;
        testJudicialProcess = prereqs.judicialProcess;
        testAsset = prereqs.asset;
    }, 80000);

    afterAll(async () => {
        await cleanup(testRunId, 'wizard');
    });

    it('should simulate the entire wizard flow and create a complete auction', async () => {
        let wizardData: WizardData = { createdLots: [] };
        
        wizardData.auctionType = 'JUDICIAL';
        wizardData.judicialProcess = testJudicialProcess as JudicialProcess;
        wizardData.auctionDetails = {
            title: `Leilão do Wizard ${testRunId}`,
            auctionType: 'JUDICIAL',
            auctioneerId: testAuctioneer.id,
            sellerId: testJudicialSeller.id,
            categoryId: testCategory.id,
            judicialProcessId: testJudicialProcess.id,
            auctionStages: [{ name: '1ª Praça', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 10 * 86400000), initialPrice: 50000 } as any]
        };
        wizardData.createdLots = [{ id: `temp-lot-${uuidv4()}`, number: '101-WIZ', title: `Lote do Bem ${testRunId}`, type: 'BEM_TESTE', price: 50000, initialPrice: 50000, status: 'EM_BREVE', assetIds: [testAsset.id], categoryId: testCategory.id, auctionId: '' } as any];

        const creationResult = await callActionAsUser(createAuctionFromWizard, adminUser, wizardData);

        assert.ok(creationResult.success, `Auction creation from wizard failed: ${creationResult.message}`);
        assert.ok(creationResult.auctionId, 'createAuctionFromWizard should return the new auction ID.');

        const createdAuction = await prisma.auction.findUnique({
            where: { id: creationResult.auctionId },
            include: { lots: { include: { assets: true } } }
        });
        
        assert.ok(createdAuction, 'The final auction should exist in the database.');
        assert.strictEqual(createdAuction?.title, wizardData.auctionDetails.title, 'Auction title should match.');
        assert.strictEqual(createdAuction?.lots.length, 1, 'Auction should have one lot.');
        assert.strictEqual(createdAuction?.lots[0].assets.length, 1, 'Lot should have one asset linked.');
        assert.strictEqual(createdAuction?.lots[0].assets[0].id, testAsset.id, 'The correct asset should be linked to the lot.');
    });

    it('should NOT allow a user without permission to create an auction', async () => {
        const wizardData: WizardData = { createdLots: [], auctionType: 'JUDICIAL', judicialProcess: testJudicialProcess as JudicialProcess, auctionDetails: { title: `Leilão Não Autorizado ${testRunId}` } };
        
        const result = await callActionAsUser(createAuctionFromWizard, unauthorizedUser, wizardData);

        assert.strictEqual(result.success, false, 'Action should have failed for unauthorized user.');
        assert.match(result.message, /permissão/i, 'Error message should indicate a permission issue.');
    });
});

// --- Suite 4: [From Scenarios] Administration - Entity Management (CRUD) ---
describe('[E2E] Módulo 1: Administração - Gerenciamento de Entidades (CRUD)', () => {
    const testRunId = `crud-e2e-${uuidv4().substring(0, 8)}`;
    let adminUser: UserProfileWithPermissions;
    let unauthorizedUser: UserProfileWithPermissions;
    let testTenant: Tenant;
    let testCategory: LotCategory;
    let testSeller: SellerProfileInfo;
    let testAuctioneer: AuctioneerProfileInfo;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'crud');
        testTenant = prereqs.tenant;
        adminUser = prereqs.adminUser;
        unauthorizedUser = prereqs.unauthorizedUser;
        testCategory = prereqs.category;
        testSeller = prereqs.judicialSeller;
        testAuctioneer = prereqs.auctioneer;
    }, 80000);

    afterAll(async () => {
        await cleanup(testRunId, 'crud');
    });

    // 1.1. Gerenciamento de Usuários
    describe('1.1. Gerenciamento de Usuários', () => {
        let newUserId: string;
        const newUserEmail = `testuser-crud-${testRunId}@test.com`;

        it('Cenário 1.1.1 & 1.1.2: Criação e Edição de um novo usuário', async () => {
            const userRole = await prisma.role.findFirst({ where: { nameNormalized: 'USER' } });
            const result = await callActionAsUser(createUser, adminUser, {
                fullName: `Test User ${testRunId}`,
                email: newUserEmail,
                password: 'password123',
                roleIds: [userRole!.id],
                tenantId: testTenant.id,
            });
            expect(result.success).toBe(true);
            newUserId = result.userId!;
            
            const updatedResult = await callActionAsUser(updateUser, adminUser, newUserId, { fullName: `Updated User Name ${testRunId}` });
            expect(updatedResult.success).toBe(true);

            const updatedUser = await callActionAsUser(getUserProfileData, adminUser, newUserId);
            expect(updatedUser?.fullName).toBe(`Updated User Name ${testRunId}`);
        });

        it('Cenário 1.1.3: Atribuição de múltiplos perfis (Roles)', async () => {
            const sellerRole = await prisma.role.upsert({ where: { nameNormalized: 'SELLER' }, update: {}, create: { name: 'Seller', nameNormalized: 'SELLER', permissions: [] } });
            const bidderRole = await prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } });
            
            const assignResult = await callActionAsUser(assignRolesToUser, adminUser, newUserId, [sellerRole.id, bidderRole.id]);
            expect(assignResult.success).toBe(true);

            const userWithRoles = await callActionAsUser(getUserProfileData, adminUser, newUserId);
            expect(userWithRoles?.roles.some(r => r.name === 'Seller')).toBe(true);
            expect(userWithRoles?.roles.some(r => r.name === 'Bidder')).toBe(true);
        });

        it('Cenário 1.1.4: Exclusão de usuário', async () => {
            const deleteResult = await callActionAsUser(deleteUser, adminUser, newUserId);
            expect(deleteResult.success).toBe(true);

            const deletedUser = await prisma.user.findUnique({ where: { id: newUserId } });
            expect(deletedUser).toBeNull();
        });
    });

    // 1.2. Gerenciamento de Leilões
    describe('1.2. Gerenciamento de Leilões', () => {
        let auctionId: string;

        it('Cenário 1.2.1 & 1.2.2: Criação e Edição de um leilão', async () => {
            const result = await callActionAsUser(createAuction, adminUser, {
                title: `Leilão CRUD ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'RASCUNHO', auctionDate: new Date(),
                auctionStages: [{ name: 'Praça Única', startDate: new Date(), endDate: new Date(Date.now() + 10 * 60 * 1000) }]
            } as any);
            expect(result.success).toBe(true);
            auctionId = result.auctionId!;

            const updateResult = await callActionAsUser(updateAuction, adminUser, auctionId, { status: 'EM_BREVE' });
            expect(updateResult.success).toBe(true);

            const updatedAuction = await callActionAsUser(getAuction, adminUser, auctionId);
            expect(updatedAuction?.status).toBe('EM_BREVE');
        });

        it('Cenário 1.2.4: Tentativa de exclusão de um leilão com lotes', async () => {
            const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot for Deletion Test ${testRunId}`, auctionId: auctionId, price: 100 } as any);
            expect(lotRes.success).toBe(true);

            const deleteResult = await callActionAsUser(deleteAuction, adminUser, auctionId);
            expect(deleteResult.success).toBe(false);
            expect(deleteResult.message).toContain('possui lote(s) associado(s)');

            // Cleanup lot and then auction
            await callActionAsUser(deleteLot, adminUser, lotRes.lotId!);
            await callActionAsUser(deleteAuction, adminUser, auctionId);
        });
    });

    // 1.3. Gerenciamento de Ativos e Lotes
    describe('1.3. Gerenciamento de Ativos e Lotes', () => {
        let assetId: string;
        let lotId: string;
        let auctionId: string;

        it('Cenário 1.3.1 & 1.3.2: Criação de Ativo e Lote vinculado', async () => {
            const assetRes = await callActionAsUser(createAsset, adminUser, { title: `Asset-Lot Test ${testRunId}`, categoryId: testCategory.id, status: 'DISPONIVEL' } as any);
            expect(assetRes.success).toBe(true);
            assetId = assetRes.assetId!;

            const auctionRes = await callActionAsUser(createAuction, adminUser, { title: `Auction for Asset-Lot Test ${testRunId}`, status: 'RASCUNHO', auctionDate: new Date() } as any);
            expect(auctionRes.success).toBe(true);
            auctionId = auctionRes.auctionId!;

            const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot with Asset ${testRunId}`, auctionId: auctionId, assetIds: [assetId] } as any);
            expect(lotRes.success).toBe(true);
            lotId = lotRes.lotId!;

            const updatedAsset = await prisma.asset.findUnique({ where: { id: assetId } });
            expect(updatedAsset?.status).toBe('LOTEADO');
        });

        it('Cenário 1.3.3: Exclusão de Lote desvincula Ativo', async () => {
            const deleteResult = await callActionAsUser(deleteLot, adminUser, lotId);
            expect(deleteResult.success).toBe(true);

            const assetAfterDelete = await prisma.asset.findUnique({ where: { id: assetId } });
            expect(assetAfterDelete?.status).toBe('DISPONIVEL');

            // Cleanup
            await callActionAsUser(deleteAsset, adminUser, assetId);
            await callActionAsUser(deleteAuction, adminUser, auctionId);
        });
    });
});

// --- Suite 5: [From Scenarios] User Habilitation Flow ---
describe('[E2E] Módulo 2: Fluxo de Habilitação de Usuário', () => {
    const testRunId = `habil-e2e-${uuidv4().substring(0, 8)}`;
    let adminUser: UserProfileWithPermissions;
    let userToHabilitate: UserProfileWithPermissions;
    let testTenant: Tenant;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'habil');
        adminUser = prereqs.adminUser;
        testTenant = prereqs.tenant;

        const userRole = await prisma.role.findFirst({ where: { nameNormalized: 'USER' } });
        const userRes = await callActionAsUser(createUser, adminUser, {
            fullName: `João Habilitação ${testRunId}`,
            email: `joao-habil-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [userRole!.id],
            tenantId: testTenant.id,
            habilitationStatus: 'PENDING_DOCUMENTS'
        });
        userToHabilitate = (await callActionAsUser(getUserProfileData, adminUser, userRes.userId!))!;
    }, 80000);

    afterAll(async () => {
        await cleanup(testRunId, 'habil');
    });

    it('Cenário 2.1.2: Analista aprova os documentos e habilita o usuário', async () => {
        // Simulate document submission by setting status to 'EM_ANALISE'
        await prisma.user.update({ where: { id: userToHabilitate.id }, data: { habilitationStatus: 'EM_ANALISE' } });

        const approvalResult = await callActionAsUser(reviewUserDocuments, adminUser, userToHabilitate.id, true, "Documentos OK");
        expect(approvalResult.success).toBe(true);

        const updatedUser = await callActionAsUser(getUserProfileData, adminUser, userToHabilitate.id);
        expect(updatedUser?.habilitationStatus).toBe(UserHabilitationStatus.HABILITADO);
        expect(updatedUser?.roles.some(r => r.nameNormalized === 'BIDDER')).toBe(true);
    });

    it('Cenário 2.1.3: Analista rejeita um documento', async () => {
        // Reset status for rejection test
        await prisma.user.update({ where: { id: userToHabilitate.id }, data: { habilitationStatus: 'EM_ANALISE' } });

        const rejectionResult = await callActionAsUser(reviewUserDocuments, adminUser, userToHabilitate.id, false, "Documento ilegível");
        expect(rejectionResult.success).toBe(true);

        const updatedUser = await callActionAsUser(getUserProfileData, adminUser, userToHabilitate.id);
        expect(updatedUser?.habilitationStatus).toBe(UserHabilitationStatus.REJECTED_DOCUMENTS);
    });
});

// --- Suite 6: [From Scenarios] Bidding and Checkout Flow ---
describe('[E2E] Módulo 3: Jornada do Arrematante (Lances e Compras)', () => {
    const testRunId = `checkout-e2e-${uuidv4().substring(0, 8)}`;
    let adminUser: UserProfileWithPermissions;
    let bidderUser: UserProfileWithPermissions;
    let testTenant: Tenant;
    let testAuction: Auction;
    let testLot: Lot;
    let userWin: UserWin;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'checkout');
        adminUser = prereqs.adminUser;
        testTenant = prereqs.tenant;

        const bidderRole = await prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } });
        const userRes = await callActionAsUser(createUser, adminUser, {
            fullName: `Arrematante Checkout ${testRunId}`, email: `arrematante-checkout-${testRunId}@test.com`, password: 'password123',
            roleIds: [bidderRole.id], tenantId: testTenant.id, habilitationStatus: 'HABILITADO'
        });
        bidderUser = (await callActionAsUser(getUserProfileData, adminUser, userRes.userId!))!;

        const auctionRes = await callActionAsUser(createAuction, adminUser, { title: `Auction Checkout ${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date() } as any);
        testAuction = (await callActionAsUser(getAuction, adminUser, auctionRes.auctionId!))!;

        const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot Checkout ${testRunId}`, auctionId: testAuction.id, price: 1000, bidIncrement: 100, status: 'ABERTO_PARA_LANCES' } as any);
        testLot = (await callActionAsUser(getLot, adminUser, lotRes.lotId!))!;
    }, 80000);

    afterAll(async () => {
        await cleanup(testRunId, 'checkout');
    });

    it('Cenário 3.1.1 & 3.1.2: Dar um lance válido e tentar um inválido', async () => {
        const invalidBid = await callActionAsUser(placeBidOnLot, bidderUser, testLot.id, testAuction.id, bidderUser.id, bidderUser.fullName!, 1050);
        expect(invalidBid.success).toBe(false);
        expect(invalidBid.message).toContain('mínimo é de R$ 1100');

        const validBid = await callActionAsUser(placeBidOnLot, bidderUser, testLot.id, testAuction.id, bidderUser.id, bidderUser.fullName!, 1100);
        expect(validBid.success).toBe(true);

        const updatedLot = await callActionAsUser(getLot, adminUser, testLot.id);
        expect(updatedLot?.price).toBe(1100);
    });

    it('Cenário 3.1.3 & 3.1.4: Arrematar um lote e fazer o checkout', async () => {
        const finalizationResult = await callActionAsUser(finalizeLot, adminUser, testLot.id);
        expect(finalizationResult.success).toBe(true);
        
        const finalLot = await callActionAsUser(getLot, adminUser, testLot.id);
        expect(finalLot?.status).toBe(LotStatus.VENDIDO);
        expect(finalLot?.winnerId).toBe(bidderUser.id);

        const winRecord = await prisma.userWin.findFirst({ where: { lotId: testLot.id, userId: bidderUser.id } });
        expect(winRecord).toBeDefined();
        userWin = winRecord!;

        const checkoutResult = await callActionAsUser(processCheckout, bidderUser, userWin.id, 'pix', 1155); // Assuming 5% commission
        expect(checkoutResult.success).toBe(true);

        const updatedWin = await prisma.userWin.findUnique({ where: { id: userWin.id } });
        expect(updatedWin?.paymentStatus).toBe('PAGO');
    });
});


afterAll(async () => {
    await prisma.$disconnect();
});
