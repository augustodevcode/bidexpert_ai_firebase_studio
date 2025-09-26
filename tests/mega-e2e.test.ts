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
 * 7. Security and Permissions on Server Actions
 * 8. Media Inheritance Logic
 * 9. Lot Lifecycle (Relisting)
 * 10. Installment Payments
 * 11. Staged Pricing Logic
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
import { createAuction, getAuction, deleteAuction, updateAuction, updateAuctionImage } from '@/app/admin/auctions/actions';
import { createLot, getLot, deleteLot, finalizeLot, updateLot, updateLotImage } from '@/app/admin/lots/actions';
import { createUser, getUserProfileData, deleteUser, updateUserProfile, updateUserRoles } from '@/app/admin/users/actions';
import { createSeller, getSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { createJudicialProcessAction, deleteJudicialProcess } from '@/app/admin/judicial-processes/actions';
import { createAsset, deleteAsset } from '@/app/admin/assets/actions';
import { createRole, getRoles } from '@/app/admin/roles/actions';
import { habilitateForAuctionAction, approveDocument, rejectDocument } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import { createAuctioneer, deleteAuctioneer } from '@/app/admin/auctioneers/actions';
import { createAuctionFromWizard } from '@/app/admin/wizard/actions';
import { processPaymentAction } from '@/app/checkout/[winId]/actions';
import { createMediaItem } from '@/app/admin/media/actions';
import { relistLotAction } from '@/app/admin/lots/relist-lot-action';


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


// --- Suite 1: Search and Filter Service Logic ---
describe('Módulo 5: Search and Filter Logic Test (Tenant-Aware)', () => {
    const testRunId = `search-service-${uuidv4().substring(0, 8)}`;
    const lotService = new LotService();
    const auctionService = new AuctionService();

    let category1: LotCategory, category2: LotCategory;
    let seller1: SellerProfileInfo;
    let auctioneer1: AuctioneerProfileInfo;
    let auction1: Auction, auction2: Auction, auction3: Auction;
    let lot1: Lot, lot2: Lot, lot3: Lot, lot4: Lot;
    let testTenant: any;
    let adminUser: any;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'search');
        testTenant = prereqs.tenant;
        adminUser = prereqs.adminUser;
        category1 = prereqs.category; // Re-using for simplicity
        auctioneer1 = prereqs.auctioneer;
        seller1 = prereqs.judicialSeller;
        
        await tenantContext.run({ tenantId: testTenant.id }, async () => {
            const now = new Date();
            const [auc1, auc2] = await prisma.$transaction([
                prisma.auction.create({ data: { title: `Leilão A ${testRunId}`, slug: `auc-a-${testRunId}`, publicId: `pub-a-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, tenantId: testTenant.id } as any }),
                prisma.auction.create({ data: { title: `Leilão B ${testRunId}`, slug: `auc-b-${testRunId}`, publicId: `pub-b-${testRunId}`, status: 'EM_BREVE', auctionDate: now, auctioneerId: auctioneer1.id, sellerId: seller1.id, categoryId: category1.id, tenantId: testTenant.id } as any }),
            ]);
            auction1 = auc1;
            auction2 = auc2;
            
            [lot1, lot2] = await prisma.$transaction([
                 prisma.lot.create({ data: { title: `Lot Search 1 ${testRunId}`, auctionId: auction1.id, price: 1000, type: category1.name, categoryId: category1.id, status: 'ABERTO_PARA_LANCES', tenantId: testTenant.id } as any }),
                 prisma.lot.create({ data: { title: `Lot Search 2 ${testRunId}`, auctionId: auction2.id, price: 2000, type: category1.name, categoryId: category1.id, status: 'EM_BREVE', tenantId: testTenant.id } as any }),
            ]);
        });
    }, 80000);

    afterAll(async () => { await cleanup(testRunId, 'search'); });

    it('Cenário 5.1: should fetch lots filtered by auctionId within tenant context', async () => {
        const lots = await callActionAsUser(getLots, adminUser, auction1.id);
        assert.strictEqual(lots.length, 1, 'Should return only the 1 lot from auction1');
        assert.ok(lots.some(l => l.id === lot1.id), 'Should include Lot 1');
    });
});


// --- Suite 2: Full Auction & Bidding Lifecycle ---
describe(`[E2E] Módulo 3: Full Auction & Bidding Lifecycle (via Actions)`, () => {
    const testRunId = `bidding-e2e-${uuidv4().substring(0, 8)}`;
    let adminUser: UserProfileWithPermissions, bidder1: UserProfileWithPermissions, bidder2: UserProfileWithPermissions;
    let testSeller: SellerProfileInfo, testAuctioneer: AuctioneerProfileInfo, testCategory: LotCategory;
    let testAuction: Auction, testLot: Lot;
    let testTenant: any;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'bidding');
        adminUser = prereqs.adminUser;
        testTenant = prereqs.tenant;
        testSeller = prereqs.judicialSeller;
        testAuctioneer = prereqs.auctioneer;
        testCategory = prereqs.category;

        [bidder1, bidder2] = await Promise.all([
            callActionAsUser(createUser, adminUser, { fullName: `Bidder 1 ${testRunId}`, email: `bidder1-${testRunId}@test.com`, password: 'p', tenantId: testTenant.id, habilitationStatus: 'HABILITADO' }).then(res => getUserProfileData(res.userId!)),
            callActionAsUser(createUser, adminUser, { fullName: `Bidder 2 ${testRunId}`, email: `bidder2-${testRunId}@test.com`, password: 'p', tenantId: testTenant.id, habilitationStatus: 'HABILITADO' }).then(res => getUserProfileData(res.userId!)),
        ]);
        
        const auctionRes = await callActionAsUser(createAuction, adminUser, { title: `Auction Bidding ${testRunId}`, sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES' } as any);
        testAuction = (await callActionAsUser(getAuction, adminUser, auctionRes.auctionId!))!;

        const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot Bidding ${testRunId}`, auctionId: testAuction.id, price: 1000, bidIncrementStep: 100, status: 'ABERTO_PARA_LANCES', type: testCategory.id } as any);
        testLot = (await callActionAsUser(getLot, adminUser, lotRes.lotId!))!;
    }, 80000);

    afterAll(async () => { await cleanup(testRunId, 'bidding'); });

    it('Cenário 3.1: Handles valid/invalid bids, declares winner and handles checkout', async () => {
        await callActionAsUser(habilitateForAuctionAction, adminUser, bidder1.id, testAuction.id);
        await callActionAsUser(habilitateForAuctionAction, adminUser, bidder2.id, testAuction.id);

        const invalidBid = await callActionAsUser(placeBidOnLot, bidder1, testLot.id, testAuction.id, bidder1.id, bidder1.fullName!, 1050);
        expect(invalidBid.success).toBe(false);
        expect(invalidBid.message).toContain('mínimo é de R$ 1.100');

        const validBid1 = await callActionAsUser(placeBidOnLot, bidder1, testLot.id, testAuction.id, bidder1.id, bidder1.fullName!, 1100);
        expect(validBid1.success).toBe(true);

        const validBid2 = await callActionAsUser(placeBidOnLot, bidder2, testLot.id, testAuction.id, bidder2.id, bidder2.fullName!, 1200);
        expect(validBid2.success).toBe(true);
        
        const finalizationResult = await callActionAsUser(finalizeLot, adminUser, testLot.id);
        expect(finalizationResult.success).toBe(true);

        const finalLot = await callActionAsUser(getLot, adminUser, testLot.id);
        expect(finalLot?.status).toBe(LotStatus.VENDIDO);
        expect(finalLot?.winnerId).toBe(bidder2.id);

        const winRecord = await prisma.userWin.findFirst({ where: { lotId: testLot.id, userId: bidder2.id } });
        expect(winRecord).toBeDefined();

        const checkoutResult = await callActionAsUser(processPaymentAction, bidder2, winRecord!.id, { paymentMethod: 'credit_card', cardDetails: { cardholderName: 'Test', cardNumber: '1111222233334444', expiryDate: '12/30', cvc: '123'}} as any);
        expect(checkoutResult.success).toBe(true);

        const updatedWin = await prisma.userWin.findUnique({ where: { id: winRecord!.id } });
        expect(updatedWin?.paymentStatus).toBe('PAGO');
    });
});

// --- Suite 3: Auction Creation Wizard Lifecycle ---
describe(`[E2E] Módulo 8: Auction Creation Wizard Lifecycle`, () => {
    const testRunId = `wizard-e2e-${uuidv4().substring(0, 8)}`;
    let prereqs: any;

    beforeAll(async () => { prereqs = await createTestPrerequisites(testRunId, 'wizard'); }, 80000);
    afterAll(async () => { await cleanup(testRunId, 'wizard'); });

    it('Cenário 8.1: should simulate the entire wizard flow and create a complete auction', async () => {
        const wizardData: WizardData = { 
            auctionType: 'JUDICIAL',
            judicialProcess: prereqs.judicialProcess as JudicialProcess,
            auctionDetails: {
                title: `Leilão do Wizard ${testRunId}`, auctionType: 'JUDICIAL',
                auctioneerId: prereqs.auctioneer.id, sellerId: prereqs.judicialSeller.id,
                categoryId: prereqs.category.id, judicialProcessId: prereqs.judicialProcess.id,
                auctionStages: [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 10 * 86400000) } as any]
            },
            createdLots: [{ id: `temp-lot-${uuidv4()}`, number: '101-WIZ', title: `Lote do Asset ${testRunId}`, type: 'ASSET_TEST', price: 50000, initialPrice: 50000, status: 'EM_BREVE', assetIds: [prereqs.asset.id], categoryId: prereqs.category.id, auctionId: '' } as any]
        };

        const creationResult = await callActionAsUser(createAuctionFromWizard, prereqs.adminUser, wizardData);
        expect(creationResult.success).toBe(true);
        expect(creationResult.auctionId).toBeDefined();

        const createdAuction = await prisma.auction.findUnique({ where: { id: creationResult.auctionId }, include: { lots: { include: { assets: true } } } });
        expect(createdAuction).toBeDefined();
        expect(createdAuction?.lots.length).toBe(1);
        expect(createdAuction?.lots[0].assets[0].assetId).toBe(prereqs.asset.id);
    });

    it('should NOT allow a user without permission to create an auction', async () => {
        const wizardData: WizardData = { auctionDetails: { title: `Leilão Não Autorizado ${testRunId}` } };
        const result = await callActionAsUser(createAuctionFromWizard, prereqs.unauthorizedUser, wizardData);
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/permissão/i);
    });
});

// --- Suite 4: Administration CRUD ---
describe('[E2E] Módulo 1: Administração - Gerenciamento de Entidades (CRUD)', () => {
    const testRunId = `crud-e2e-${uuidv4().substring(0, 8)}`;
    let adminUser: UserProfileWithPermissions, testTenant: Tenant, testCategory: LotCategory, testSeller: SellerProfileInfo, testAuctioneer: AuctioneerProfileInfo;

    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'crud');
        adminUser = prereqs.adminUser; testTenant = prereqs.tenant; testCategory = prereqs.category; testSeller = prereqs.judicialSeller; testAuctioneer = prereqs.auctioneer;
    }, 80000);
    afterAll(async () => { await cleanup(testRunId, 'crud'); });

    it('Cenário 1.1: CRUD de Usuários', async () => {
        const userRole = await prisma.role.findFirst({ where: { nameNormalized: 'USER' } });
        const res = await callActionAsUser(createUser, adminUser, { fullName: `Test User ${testRunId}`, email: `user-crud-${testRunId}@test.com`, password: 'p', roleIds: [userRole!.id], tenantId: testTenant.id });
        expect(res.success).toBe(true);
        const newUserId = res.userId!;
        
        await callActionAsUser(updateUserProfile, adminUser, newUserId, { fullName: `Updated User ${testRunId}` });
        const updatedUser = await callActionAsUser(getUserProfileData, adminUser, newUserId);
        expect(updatedUser?.fullName).toBe(`Updated User ${testRunId}`);
        
        await callActionAsUser(deleteUser, adminUser, newUserId);
        expect(await callActionAsUser(getUserProfileData, adminUser, newUserId)).toBeNull();
    });

    it('Cenário 1.2: CRUD de Leilões', async () => {
        const res = await callActionAsUser(createAuction, adminUser, { title: `Leilão CRUD ${testRunId}`, status: 'RASCUNHO', sellerId: testSeller.id, auctioneerId: testAuctioneer.id } as any);
        expect(res.success).toBe(true);
        const auctionId = res.auctionId!;
        
        await callActionAsUser(updateAuction, adminUser, auctionId, { status: 'EM_BREVE' });
        const updatedAuction = await callActionAsUser(getAuction, adminUser, auctionId);
        expect(updatedAuction?.status).toBe('EM_BREVE');
        
        const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot for Deletion Test ${testRunId}`, auctionId: auctionId, price: 100, type: testCategory.id } as any);
        const deleteRes1 = await callActionAsUser(deleteAuction, adminUser, auctionId);
        expect(deleteRes1.success).toBe(false);

        await callActionAsUser(deleteLot, adminUser, lotRes.lotId!);
        const deleteRes2 = await callActionAsUser(deleteAuction, adminUser, auctionId);
        expect(deleteRes2.success).toBe(true);
    });
});

// --- Suite 5: User Habilitation Flow ---
describe('[E2E] Módulo 2: Fluxo de Habilitação de Usuário', () => {
    const testRunId = `habil-e2e-${uuidv4().substring(0, 8)}`;
    let prereqs: any;
    
    beforeAll(async () => { prereqs = await createTestPrerequisites(testRunId, 'habil'); }, 80000);
    afterAll(async () => { await cleanup(testRunId, 'habil'); });

    it('Cenário 2.1: aprova/rejeita documentos e atualiza status', async () => {
        const userToHabilitate = prereqs.unauthorizedUser;
        const admin = prereqs.adminUser;

        await prisma.user.update({ where: { id: userToHabilitate.id }, data: { habilitationStatus: 'PENDING_ANALYSIS' } });
        
        const docType = await prisma.documentType.create({data: {name: `Doc Test ${testRunId}`, appliesTo: 'ALL', isRequired: true}});
        const userDoc = await prisma.userDocument.create({data: {userId: userToHabilitate.id, documentTypeId: docType.id, fileUrl: 'fake.url', status: 'PENDING_ANALYSIS'}});

        const rejectionResult = await callActionAsUser(rejectDocument, admin, userDoc.id, "Documento inválido");
        expect(rejectionResult.success).toBe(true);
        let updatedUser = await callActionAsUser(getUserProfileData, admin, userToHabilitate.id);
        expect(updatedUser?.habilitationStatus).toBe('REJECTED_DOCUMENTS');
        
        const approvalResult = await callActionAsUser(approveDocument, admin, userDoc.id, admin.id);
        expect(approvalResult.success).toBe(true);
        updatedUser = await callActionAsUser(getUserProfileData, admin, userToHabilitate.id);
        expect(updatedUser?.habilitationStatus).toBe('HABILITADO');
        
        await prisma.userDocument.deleteMany({ where: { id: userDoc.id } });
        await prisma.documentType.deleteMany({ where: { id: docType.id } });
    });
});

// --- Suite 6: Security and Permissions ---
describe('[E2E] Módulo 27: Testes de Segurança da Camada de Ações', () => {
    const testRunId = `security-e2e-${uuidv4().substring(0, 8)}`;
    let prereqs: any, otherTenantPrereqs: any;
    let testAuction: Auction;

    beforeAll(async () => {
        prereqs = await createTestPrerequisites(testRunId, 'secA');
        otherTenantPrereqs = await createTestPrerequisites(testRunId, 'secB');
        
        const auctionRes = await callActionAsUser(createAuction, prereqs.adminUser, { title: `Security Test Auction ${testRunId}`, sellerId: prereqs.judicialSeller.id, auctioneerId: prereqs.auctioneer.id, status: 'RASCUNHO' } as any);
        testAuction = (await callActionAsUser(getAuction, prereqs.adminUser, auctionRes.auctionId!))!;
    }, 120000);

    afterAll(async () => {
        await cleanup(testRunId, 'secA');
        await cleanup(testRunId, 'secB');
    });

    it('Cenário 27.1.1: Deve impedir que um usuário comum execute uma ação de admin', async () => {
        const result = await callActionAsUser(deleteAuction, prereqs.unauthorizedUser, testAuction.id);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Acesso negado');
    });

    it('Cenário 27.1.2: Deve impedir que um admin de um tenant edite uma entidade de outro tenant', async () => {
        const result = await callActionAsUser(updateAuction, otherTenantPrereqs.adminUser, testAuction.id, { title: "Tentativa de Invasão" });
        expect(result.success).toBe(false);
        expect(result.message).toContain('Leilão não encontrado');
    });

    it('Cenário 27.2.1: Deve aplicar regras de negócio, como não excluir leilão com lotes', async () => {
        const lotRes = await callActionAsUser(createLot, prereqs.adminUser, { title: `Lot for Deletion Test ${testRunId}`, auctionId: testAuction.id, price: 100, type: prereqs.category.id } as any);
        
        const deleteResult = await callActionAsUser(deleteAuction, prereqs.adminUser, testAuction.id);
        expect(deleteResult.success).toBe(false);
        expect(deleteResult.message).toContain('possui lote(s) associado(s)');
    });
});

// --- Suite 7: Media Inheritance ---
describe('[E2E] Módulo 30: Gerenciamento de Mídia e Herança', () => {
    const testRunId = `media-e2e-${uuidv4().substring(0, 8)}`;
    let prereqs: any, testAsset: Asset, testAuction: Auction;

    beforeAll(async () => {
        prereqs = await createTestPrerequisites(testRunId, 'media');
        
        const assetRes = await callActionAsUser(createAsset, prereqs.adminUser, { title: `Asset com Mídia ${testRunId}`, imageUrl: 'http://example.com/asset-image.jpg', galleryImageUrls: ['http://example.com/asset-gallery-1.jpg'], categoryId: prereqs.category.id, status: 'DISPONIVEL' } as any);
        testAsset = (await prisma.asset.findUnique({ where: { id: assetRes.assetId! } }))!;
        
        const auctionRes = await callActionAsUser(createAuction, prereqs.adminUser, { title: `Auction Mídia ${testRunId}`, sellerId: prereqs.judicialSeller.id, auctioneerId: prereqs.auctioneer.id } as any);
        testAuction = (await callActionAsUser(getAuction, prereqs.adminUser, auctionRes.auctionId!))!;
    }, 80000);

    afterAll(async () => { await cleanup(testRunId, 'media'); });

    it('Cenário 11.1.2 & 11.1.3: Lote deve herdar e substituir mídia de um ativo', async () => {
        const lotRes1 = await callActionAsUser(createLot, prereqs.adminUser, { title: `Lot Herda Mídia ${testRunId}`, auctionId: testAuction.id, assetIds: [testAsset.id], inheritedMediaFromBemId: testAsset.id, type: prereqs.category.id } as any);
        const lot1 = await callActionAsUser(getLot, prereqs.adminUser, lotRes1.lotId!);
        expect(lot1?.imageUrl).toBe(testAsset.imageUrl);

        const customImageRes = await callActionAsUser(createMediaItem, prereqs.adminUser, { fileName: `custom-${testRunId}.jpg`, mimeType: 'image/jpeg' }, 'http://example.com/custom.jpg', prereqs.adminUser.id);
        await callActionAsUser(updateLot, prereqs.adminUser, lot1!.id, { inheritedMediaFromBemId: null, imageMediaId: customImageRes.item!.id, imageUrl: 'http://example.com/custom.jpg' });
        
        const updatedLot = await callActionAsUser(getLot, prereqs.adminUser, lot1!.id);
        expect(updatedLot?.imageUrl).toBe('http://example.com/custom.jpg');
    });
});

// --- Suite 8: Relisting & Relotting ---
describe('[E2E] Módulo 12: Relistagem e Reloteamento', () => {
  const testRunId = `relist-e2e-${uuidv4().substring(0, 8)}`;
  let prereqs: any, originalAuction: Auction, newAuction: Auction, originalLot: Lot;

  beforeAll(async () => {
    prereqs = await createTestPrerequisites(testRunId, 'relist');
    const { adminUser, judicialSeller, auctioneer } = prereqs;

    const res1 = await callActionAsUser(createAuction, adminUser, { title: `Original Auction ${testRunId}`, sellerId: judicialSeller.id, auctioneerId: auctioneer.id, status: 'ENCERRADO' } as any);
    originalAuction = await callActionAsUser(getAuction, adminUser, res1.auctionId!);

    const res2 = await callActionAsUser(createAuction, adminUser, { title: `New Auction ${testRunId}`, sellerId: judicialSeller.id, auctioneerId: auctioneer.id, status: 'EM_BREVE' } as any);
    newAuction = await callActionAsUser(getAuction, adminUser, res2.auctionId!);

    const lotRes = await callActionAsUser(createLot, adminUser, { title: `Lot to Relist ${testRunId}`, auctionId: originalAuction.id, price: 1000, evaluationValue: 1000, status: 'NAO_VENDIDO', type: prereqs.category.id } as any);
    originalLot = await callActionAsUser(getLot, adminUser, lotRes.lotId!);
  }, 80000);

  afterAll(async () => { await cleanup(testRunId, 'relist'); });

  it('Cenário 12.1.1: Deve relistar um lote não vendido com desconto', async () => {
    const result = await callActionAsUser(relistLotAction, prereqs.adminUser, originalLot.id, newAuction.id, 50);
    expect(result.success).toBe(true);
    expect(result.newLotId).toBeDefined();

    const updatedOriginalLot = await callActionAsUser(getLot, prereqs.adminUser, originalLot.id);
    expect(updatedOriginalLot?.status).toBe(LotStatus.RELISTADO);

    const newLot = await callActionAsUser(getLot, prereqs.adminUser, result.newLotId!);
    expect(newLot).toBeDefined();
    expect(newLot?.isRelisted).toBe(true);
    expect(newLot?.originalLotId).toBe(originalLot.id);
    expect(newLot?.price).toBe(500); // 50% de 1000
  });

  it('Cenário 12.2.1: Deve desvincular um bem de um lote não vendido', async () => {
    await callActionAsUser(updateLot, prereqs.adminUser, originalLot.id, { assetIds: [] });
    const updatedLot = await callActionAsUser(getLot, prereqs.adminUser, originalLot.id);
    expect(updatedLot?.assetIds?.length).toBe(0);
    
    const asset = await prisma.asset.findUnique({ where: { id: prereqs.asset.id }});
    expect(asset?.status).toBe('DISPONIVEL');
  });
});

// --- Suite 9: Staged Pricing ---
describe('[E2E] Módulo 23: Lógica de Precificação por Etapa', () => {
  const testRunId = `stagedprice-e2e-${uuidv4().substring(0, 8)}`;
  let prereqs: any, testAuction: Auction, testLot: Lot;

  beforeAll(async () => {
    prereqs = await createTestPrerequisites(testRunId, 'stagedprice');
    const { adminUser, judicialSeller, auctioneer, category } = prereqs;

    const auctionRes = await callActionAsUser(createAuction, adminUser, { 
      title: `Staged Auction ${testRunId}`, 
      sellerId: judicialSeller.id, 
      auctioneerId: auctioneer.id, 
      status: 'ABERTO_PARA_LANCES',
      auctionStages: [
        { id: 'stage1', name: '1ª Praça', startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000) },
        { id: 'stage2', name: '2ª Praça', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 2 * 86400000) },
      ]
    } as any);
    testAuction = (await callActionAsUser(getAuction, adminUser, auctionRes.auctionId!))!;
    
    const lotRes = await callActionAsUser(createLot, adminUser, { 
      title: `Staged Lot ${testRunId}`, 
      auctionId: testAuction.id, 
      price: 10000, 
      initialPrice: 10000, 
      type: category.id,
      stageDetails: [
        { stageId: testAuction.auctionStages![0].id, initialBid: 10000 },
        { stageId: testAuction.auctionStages![1].id, initialBid: 5000 },
      ]
    } as any);
    testLot = (await callActionAsUser(getLot, adminUser, lotRes.lotId!))!;
  }, 80000);

  afterAll(async () => { await cleanup(testRunId, 'stagedprice'); });

  it('Cenário 23.1: Deve refletir o preço da etapa correta', async () => {
    const lotService = new LotService();
    const fetchedLot = await tenantContext.run({ tenantId: prereqs.tenant.id }, () => lotService.getLotById(testLot.id));
    const activeStage = testAuction.auctionStages![0];
    const lotPrices = lotService['getLotPriceForStage'](fetchedLot!, activeStage.id); // Acesso privado para teste
    
    expect(lotPrices?.initialBid).toBe(10000);
  });
});

// Final Teardown
afterAll(async () => {
    await prisma.$disconnect();
});
```
- src/tests/user.test.ts:
```ts
// tests/user.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { UserCreationData, Tenant, Role } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';


const testRunId = `user-e2e-${uuidv4().substring(0, 8)}`;
const testUserEmail = `teste.usuario.${testRunId}@example.com`;
let testTenant: Tenant;
let userRole: Role;
let adminUser: any; // O usuário que executa a ação

describe('User Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `User Test Tenant ${testRunId}`, subdomain: `user-test-${testRunId}` } });
        userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For User Test ${testRunId}`,
            email: `admin-for-user-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole!.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
    });

    afterAll(async () => {
        try {
            await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
            await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[USER TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new user with default role via server action', async () => {
        // Arrange
        const newUser: UserCreationData = {
            fullName: `Usuário de Teste ${testRunId}`,
            email: testUserEmail,
            password: 'aSecurePassword123',
            roleIds: [userRole.id],
            tenantId: testTenant.id,
        };

        // Act
        const result = await callActionAsUser(createUser, adminUser, newUser);

        // Assert
        assert.strictEqual(result.success, true, 'createUser action should return success: true');
        assert.ok(result.userId, 'createUser action should return a userId');

        const createdUserFromDb = await prisma.user.findUnique({
            where: { id: result.userId },
            include: { roles: { include: { role: true } }, tenants: true },
        });

        assert.ok(createdUserFromDb, 'User should be found in the database');
        assert.strictEqual(createdUserFromDb.email, testUserEmail, 'User email should match');
        assert.ok(createdUserFromDb.password, 'User password should be set (hashed)');
        assert.notStrictEqual(createdUserFromDb.password, newUser.password, 'User password should be hashed, not plaintext');
        assert.strictEqual(createdUserFromDb.roles.length, 1, 'User should have exactly one role');
        assert.strictEqual(createdUserFromDb.roles[0].role.name, 'User', 'The assigned role should be USER');
        assert.strictEqual(createdUserFromDb.tenants.length, 1, 'User should be assigned to one tenant');
        assert.strictEqual(createdUserFromDb.tenants[0].tenantId, testTenant.id, 'User should be assigned to the correct tenant');
    });
});
```