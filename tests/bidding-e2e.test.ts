// tests/bidding-e2e.test.ts
import { describe, test, beforeAll, afterAll, expect, it, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { tenantContext } from '@/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Bem, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, AuctionFormData, LotFormData, BemFormData, JudicialProcessFormData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));


// Import Server Actions
import { createAuction, getAuction, deleteAuction } from '@/app/admin/auctions/actions';
import { createLot, getLot, deleteLot, finalizeLot } from '@/app/admin/lots/actions';
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';
import { createSeller, getSeller, deleteSeller } from '@/app/admin/sellers/actions';
import { createJudicialProcessAction, deleteJudicialProcess } from '@/app/admin/judicial-processes/actions';
import { createAsset, deleteAsset } from '@/app/admin/assets/actions';
import { createRole, getRoles } from '@/app/admin/roles/actions';
import { habilitateForAuctionAction } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';


const testRunId = `bidding-e2e-action-${uuidv4().substring(0, 8)}`;
let testAnalyst: UserProfileWithPermissions;
let biddingUsers: UserProfileWithPermissions[] = [];
let consignorUser: UserProfileWithPermissions;
let testSeller: SellerProfileInfo;
let testJudicialSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let testState: StateInfo;
let testCourt: Court, testDistrict: JudicialDistrict, testBranch: JudicialBranch, testJudicialProcess: JudicialProcess;
let testAssetJudicial: Asset, testAssetExtrajudicial: Asset;
let judicialAuction: Auction, extrajudicialAuction: Auction;
let judicialLot: Lot, extrajudicialLot: Lot;
let testTenant: any;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const originalGetSession = require('@/app/auth/actions').getSession;
    const tenantId = user?.tenants?.[0]?.id || testTenant.id;
    require('@/app/auth/actions').getSession = async () => user ? { userId: user.id, tenantId: tenantId, permissions: user.permissions } : null;
    try {
        return await tenantContext.run({ tenantId }, () => action(...args));
    } finally {
        require('@/app/auth/actions').getSession = originalGetSession;
    }
}

async function cleanup() {
    console.log(`--- [E2E Teardown - ${testRunId}] Cleaning up test data ---`);
    if (!testTenant) return;
    await tenantContext.run({ tenantId: testTenant.id }, async () => {
        try {
            const userIds = [testAnalyst?.id, consignorUser?.id, ...biddingUsers.map(u => u.id)].filter(Boolean) as string[];
            if (userIds.length > 0) {
              await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
              await prisma.bid.deleteMany({ where: { bidderId: { in: userIds } } });
              await prisma.usersOnRoles.deleteMany({where: {userId: {in: userIds}}});
              await prisma.user.deleteMany({ where: { id: { in: userIds } } });
            }
    
            const lotIds = [judicialLot?.id, extrajudicialLot?.id].filter(Boolean) as string[];
            for (const lotId of lotIds) { await deleteLot(lotId); }
            
            const auctionIds = [judicialAuction?.id, extrajudicialAuction?.id].filter(Boolean) as string[];
            for (const auctionId of auctionIds) { await deleteAuction(auctionId); }
    
            const assetIds = [testAssetJudicial?.id, testAssetExtrajudicial?.id].filter(Boolean) as string[];
            for (const assetId of assetIds) { await deleteAsset(assetId); }
            
            if (testJudicialProcess) await deleteJudicialProcess(testJudicialProcess.id);
            if (testSeller) await deleteSeller(testSeller.id);
            if (testJudicialSeller) await deleteSeller(testJudicialSeller.id);
            if (testBranch) await prisma.judicialBranch.delete({ where: { id: testBranch.id } });
            if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
            if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (testState) await prisma.state.delete({ where: { id: testState.id } });
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
    
        } catch (error) {
            console.error("[E2E Teardown] Error during cleanup:", error);
        }
    });
     await prisma.$disconnect();
}


describe(`[E2E] Full Auction & Bidding Lifecycle (via Actions) (ID: ${testRunId})`, () => {

    beforeAll(async () => {
        await cleanup();
        console.log(`--- [E2E Setup - ${testRunId}] Starting... ---`);
        
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `bidding-${testRunId}` } });

        const [userRole, bidderRole, analystRole, consignorRole] = await Promise.all([
             prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions'] } }),
             prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } }),
             prisma.role.upsert({ where: { nameNormalized: 'AUCTION_ANALYST' }, update: {}, create: { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', permissions: ['users:manage_habilitation'] } }),
             prisma.role.upsert({ where: { nameNormalized: 'CONSIGNOR' }, update: {}, create: { name: 'Consignor', nameNormalized: 'CONSIGNOR', permissions: ['consignor_dashboard:view'] } }),
        ]);

        for (let i = 1; i <= 3; i++) {
            const userRes = await callActionAsUser(createUser, null, { 
                fullName: `Bidder ${i} ${testRunId}`, email: `bidder${i}-${testRunId}@test.com`, password: 'password123', 
                roleIds: [userRole!.id, bidderRole!.id], habilitationStatus: 'HABILITADO' 
            });
            assert.ok(userRes.success && userRes.userId, `Bidder ${i} creation failed.`);
            biddingUsers.push((await callActionAsUser(getUserProfileData, null, userRes.userId))!);
        }
        
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Bidding ${testRunId}`, slug: `cat-bidding-${testRunId}`, hasSubcategories: false } });
        
        await tenantContext.run({ tenantId: testTenant.id }, async () => {
            const auctioneerRes = await createAuctioneer({ name: `Auctioneer Bidding ${testRunId}` } as any);
            const sellerRes = await createSeller({ name: `Seller Bidding ${testRunId}`, isJudicial: false } as any);
            assert.ok(auctioneerRes.success && auctioneerRes.auctioneerId && sellerRes.success && sellerRes.sellerId, "Auctioneer/Seller setup failed.");
            testAuctioneer = (await prisma.auctioneer.findUnique({ where: { id: auctioneerRes.auctioneerId } }))!;
            testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;
        });

        const aucRes = await tenantContext.run({ tenantId: testTenant.id }, () => createAuction({ title: `Extrajudicial Auction ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctionStages: [{name: 'Praça Única', startDate: new Date(), endDate: new Date(Date.now() + 10 * 60 * 1000)}] } as any));
        assert.ok(aucRes.success && aucRes.auctionId, "Auction creation failed.");
        extrajudicialAuction = (await callActionAsUser(getAuction, null, aucRes.auctionId))!;

        const lotRes = await tenantContext.run({ tenantId: testTenant.id }, () => createLot({ title: `Lot Bidding ${testRunId}`, auctionId: extrajudicialAuction.id, price: 25000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', endDate: new Date(Date.now() + 5 * 60 * 1000) } as Partial<LotFormData>));
        assert.ok(lotRes.success && lotRes.lotId);
        extrajudicialLot = (await callActionAsUser(getLot, null, lotRes.lotId))!;

        console.log(`--- [E2E Setup - ${testRunId}] Complete. ---`);
    }, 60000);

    afterAll(async () => {
        await cleanup();
    });

    it('Standard Bidding: should allow habilitated users to bid and determine a winner via actions', async () => {
        console.log('\n--- Test: Standard Bidding on Extrajudicial Lot via Actions ---');
        assert.ok(extrajudicialLot, 'Extrajudicial Lot must be defined');

        console.log("- CRITÉRIO: Usuário deve estar habilitado para o leilão específico.");
        await callActionAsUser(habilitateForAuctionAction, biddingUsers[0], biddingUsers[0].id, extrajudicialAuction.id);
        await callActionAsUser(habilitateForAuctionAction, biddingUsers[1], biddingUsers[1].id, extrajudicialAuction.id);
        
        console.log(`- AÇÃO: Habilitar usuários ${biddingUsers[0].fullName} e ${biddingUsers[1].fullName} para o leilão.`);
        const isHabilitado1 = await prisma.auctionHabilitation.findFirst({where: {userId: biddingUsers[0].id, auctionId: extrajudicialAuction.id}});
        assert.ok(isHabilitado1, "User 1 should be habilitated.");
        console.log("- STATUS: ✅ PASSOU");

        console.log("- CRITÉRIO: Um lance maior que o preço atual deve ser aceito.");
        const bid1 = await callActionAsUser(placeBidOnLot, biddingUsers[0], extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[0].id, biddingUsers[0].fullName!, 26000);
        assert.ok(bid1.success, `Bid 1 should be successful. Error: ${bid1.message}`);
        console.log(`- AÇÃO: ${biddingUsers[0].fullName} dá um lance de R$ 26.000.`);
        let updatedLot = await callActionAsUser(getLot, null, extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 26000, "Lot price should be 26000.");
        console.log("- VERIFICAÇÃO: Preço do lote atualizado para R$ 26.000.");
        console.log("- STATUS: ✅ PASSOU");
        
        console.log("- CRITÉRIO: Um lance subsequente mais alto de outro usuário deve ser aceito.");
        const bid2 = await callActionAsUser(placeBidOnLot, biddingUsers[1], extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[1].id, biddingUsers[1].fullName!, 27000);
        assert.ok(bid2.success, `Bid 2 should be successful. Error: ${bid2.message}`);
        console.log(`- AÇÃO: ${biddingUsers[1].fullName} dá um lance de R$ 27.000.`);
        updatedLot = await callActionAsUser(getLot, null, extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 27000, "Lot price should be updated to 27000.");
        console.log("- VERIFICAÇÃO: Preço do lote atualizado para R$ 27.000.");
        console.log("- STATUS: ✅ PASSOU");
        
        console.log("- CRITÉRIO: No fim do leilão, o maior licitante é o vencedor.");
        const finalizationResult = await callActionAsUser(finalizeLot, adminUser, extrajudicialLot.id);
        assert.ok(finalizationResult.success, `Lot finalization should succeed. Message: ${finalizationResult.message}`);
        
        const finalLot = await callActionAsUser(getLot, null, extrajudicialLot.id);
        assert.strictEqual(finalLot?.status, 'VENDIDO', 'Lot status should be VENDIDO.');
        assert.strictEqual(finalLot?.winnerId, biddingUsers[1].id, 'Winner should be the highest bidder.');
        console.log("- AÇÃO: Leilão encerrado e vencedor declarado.");
        console.log("- VERIFICAÇÃO: Status e vencedor corretos.");
        console.log("- STATUS: ✅ PASSOU");
    });
});
