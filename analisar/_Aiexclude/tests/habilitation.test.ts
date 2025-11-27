// tests/habilitation.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, DocumentType, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';
import { createAuction } from '@/app/admin/auctions/actions';
import { createLot } from '@/app/admin/lots/actions';
import { saveUserDocument, approveDocument, habilitateForAuctionAction, checkHabilitationForAuctionAction } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';


const testRunId = `hab-e2e-action-${uuidv4().substring(0, 8)}`;
let testAuctioneer: AuctioneerProfileInfo;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let testAuction: Auction;
let testLot: Lot;
let testDocumentType: DocumentType;
let regularUser: UserProfileWithPermissions;
let analystUser: UserProfileWithPermissions;
let testTenant: Tenant;

describe('User Habilitation E2E Test (via Actions)', () => {

    beforeAll(async () => {
        console.log(`--- [Habilitation E2E Setup - ${testRunId}] Starting... ---`);
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant Hab ${testRunId}`, subdomain: `hab-${testRunId}` } });

        const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions', 'view_lots'] } });
        const analystRole = await prisma.role.upsert({ where: { nameNormalized: 'AUCTION_ANALYST' }, update: {}, create: { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', permissions: ['users:manage_habilitation'] } });
        const bidderRole = await prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } });

        const userRes = await createUser({ fullName: `Arrematante ${testRunId}`, email: `arrematante-${testRunId}@test.com`, password: 'password123', roleIds: [userRole.id], habilitationStatus: 'PENDING_DOCUMENTS', tenantId: testTenant.id });
        assert.ok(userRes.success && userRes.userId, 'Regular user creation failed.');
        regularUser = (await getUserProfileData(userRes.userId))!;
        
        const analystRes = await createUser({ fullName: `Analista ${testRunId}`, email: `analista-${testRunId}@test.com`, password: 'password123', roleIds: [analystRole.id], habilitationStatus: 'HABILITADO', tenantId: testTenant.id });
        assert.ok(analystRes.success && analystRes.userId, 'Analyst user creation failed.');
        analystUser = (await getUserProfileData(analystRes.userId))!;

        testDocumentType = await prisma.documentType.upsert({ 
            where: { name: `RG Teste E2E ${testRunId}`}, 
            update: {},
            create: { name: `RG Teste E2E ${testRunId}`, description: 'Documento de RG para teste', isRequired: true, appliesTo: 'PHYSICAL,LEGAL' } 
        });

        await tenantContext.run({ tenantId: testTenant.id }, async () => {
            testCategory = await prisma.lotCategory.create({ data: { name: `Cat Hab ${testRunId}`, slug: `cat-hab-${testRunId}`, hasSubcategories: false } });
            testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer Hab ${testRunId}`, slug: `auct-hab-${testRunId}`, publicId: `auct-pub-hab-${testRunId}`, tenantId: testTenant.id } });
            testSeller = await prisma.seller.create({ data: { name: `Seller Hab ${testRunId}`, slug: `seller-hab-${testRunId}`, publicId: `seller-pub-hab-${testRunId}`, isJudicial: false, tenantId: testTenant.id } });
            
            const auctionRes = await createAuction({ title: `Auction Hab ${testRunId}`, sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date() } as any);
            assert.ok(auctionRes.success && auctionRes.auctionId, 'Auction creation failed.');
            testAuction = (await prisma.auction.findUnique({where: {id: auctionRes.auctionId}})) as Auction;

            const lotRes = await createLot({ title: `Lot Hab ${testRunId}`, auctionId: testAuction.id, price: 1000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) } as any);
            assert.ok(lotRes.success && lotRes.lotId);
            testLot = (await prisma.lot.findUnique({where: {id: lotRes.lotId}})) as Lot;
        });

        console.log(`--- [Habilitation E2E Setup - ${testRunId}] Complete. ---`);
    });

    afterAll(async () => {
        console.log(`--- [Habilitation E2E Teardown - ${testRunId}] Cleaning up... ---`);
        try {
            if (regularUser) await deleteUser(regularUser.id);
            if (analystUser) await deleteUser(analystUser.id);
            if (testLot) await prisma.lot.deleteMany({ where: { id: testLot.id } });
            if (testAuction) await prisma.auction.deleteMany({ where: { id: testAuction.id } });
            if (testSeller) await prisma.seller.deleteMany({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.deleteMany({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.deleteMany({ where: { id: testCategory.id } });
            if (testDocumentType) await prisma.documentType.deleteMany({ where: { id: testDocumentType.id } });
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error("[Habilitation E2E Teardown] Error during cleanup:", error);
        }
        await prisma.$disconnect();
    });

    it('should go through the full habilitation flow and place a successful bid via actions', async () => {
        console.log('\n--- Test: Full Habilitation Flow via Actions ---');
        
        console.log("- Step 1: User attempts to bid while document is pending.");
        let bidResult = await callActionAsUser(placeBidOnLot, regularUser, testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1100);
        assert.strictEqual(bidResult.success, false, 'Bidding should fail with PENDING_DOCUMENTS status.');
        assert.match(bidResult.message, /Apenas usuários com status 'HABILITADO'/, 'Error message should mention habilitation status.');
        console.log("- PASSED: Blocked bid for user with pending documents.");

        console.log("- Step 2: User submits a required document.");
        const saveDocResult = await callActionAsUser(saveUserDocument, regularUser, regularUser.id, testDocumentType.id, `/fake/path/doc-${testRunId}.pdf`, `doc-${testRunId}.pdf`);
        assert.ok(saveDocResult.success, `Saving user document should succeed. Error: ${saveDocResult.message}`);
        let updatedUser = await callActionAsUser(getUserProfileData, adminUser, regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'PENDING_ANALYSIS', 'User status should be PENDING_ANALYSIS after upload.');
        console.log("- PASSED: Document submitted, status is now PENDING_ANALYSIS.");

        console.log("- Step 3: Analyst approves the document.");
        const userDocs = await prisma.userDocument.findMany({ where: { userId: regularUser.id } });
        const docToApprove = userDocs.find(d => d.documentTypeId === testDocumentType.id);
        assert.ok(docToApprove, 'Uploaded document should be found for approval.');
        
        const approvalResult = await callActionAsUser(approveDocument, analystUser, docToApprove!.id, analystUser.id);
        assert.ok(approvalResult.success, `Document approval action should succeed. Error: ${approvalResult.message}`);
        updatedUser = await callActionAsUser(getUserProfileData, adminUser, regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'HABILITADO', 'User status should be HABILITADO after approval.');
        console.log("- PASSED: Document approved, user status is HABILITADO.");

        console.log("- Step 4: User attempts to bid before auction-specific habilitation.");
        bidResult = await callActionAsUser(placeBidOnLot, regularUser, testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1100);
        assert.strictEqual(bidResult.success, false, "Bidding should fail before auction-specific habilitation.");
        assert.match(bidResult.message, /Você não está habilitado para dar lances neste leilão/, 'Error message should mention specific auction habilitation.');
        console.log("- PASSED: Blocked bid for user not enabled for the specific auction.");

        console.log(`- Step 5: User self-habilitates for the auction.`);
        const habilitationRes = await callActionAsUser(habilitateForAuctionAction, regularUser, regularUser.id, testAuction.id);
        assert.ok(habilitationRes.success, `Auction-specific habilitation should succeed. Error: ${habilitationRes.message}`);
        const isHabilitado = await callActionAsUser(checkHabilitationForAuctionAction, regularUser, regularUser.id, testAuction.id);
        assert.ok(isHabilitado, 'Check habilitation should return true after enabling.');
        console.log("- PASSED: User successfully enabled for the auction.");
        
        console.log("- Step 6: User places a final, valid bid.");
        bidResult = await callActionAsUser(placeBidOnLot, regularUser, testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1200);
        assert.ok(bidResult.success, `Bidding should succeed after all habilitation steps. Error: ${bidResult.message}`);
        const finalLot = await callActionAsUser(getLot, adminUser, testLot.id);
        assert.strictEqual(finalLot?.price, 1200, 'Lot price should be updated after successful bid.');
        console.log("- PASSED: Successful bid placed.");
    });
});
