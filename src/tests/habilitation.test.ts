// tests/habilitation.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { UserService } from '../src/services/user.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { SellerService } from '../src/services/seller.service';
import { approveDocument, saveUserDocument } from '../src/app/dashboard/documents/actions';
import { habilitateForAuctionAction, checkHabilitationForAuctionAction } from '../src/app/admin/habilitations/actions';
import { placeBidOnLot } from '../src/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, DocumentType } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const userService = new UserService();
const auctionService = new AuctionService();
const lotService = new LotService();
const sellerService = new SellerService();

const testRunId = uuidv4().substring(0, 8);
let testAuctioneer: AuctioneerProfileInfo;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let testAuction: Auction;
let testLot: Lot;
let testDocumentType: DocumentType;
let regularUser: UserProfileWithPermissions;
let analystUser: UserProfileWithPermissions;

test.describe('User Habilitation E2E Test', () => {

    test.before(async () => {
        console.log(`--- [Habilitation E2E Setup - ${testRunId}] Starting... ---`);
        // 1. Create Roles if they don't exist (using upsert for safety)
        const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions', 'view_lots'] } });
        const analystRole = await prisma.role.upsert({ where: { nameNormalized: 'AUCTION_ANALYST' }, update: {}, create: { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', permissions: ['users:manage_habilitation'] } });
        const bidderRole = await prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } });

        // 2. Create Users
        const userRes = await userService.createUser({ fullName: `Arrematante ${testRunId}`, email: `arrematante-${testRunId}@test.com`, password: 'password123', roleIds: [userRole.id], habilitationStatus: 'PENDING_DOCUMENTS' });
        assert.ok(userRes.success && userRes.userId, 'Regular user creation failed.');
        regularUser = (await userService.getUserById(userRes.userId!))!;

        const analystRes = await userService.createUser({ fullName: `Analista ${testRunId}`, email: `analista-${testRunId}@test.com`, password: 'password123', roleIds: [analystRole.id], habilitationStatus: 'HABILITADO' });
        assert.ok(analystRes.success && analystRes.userId, 'Analyst user creation failed.');
        analystUser = (await userService.getUserById(analystRes.userId!))!;
        
        // 3. Create Document Type
        testDocumentType = await prisma.documentType.create({ data: { name: `RG Teste ${testRunId}`, description: 'Documento de RG para teste', isRequired: true, appliesTo: ['PHYSICAL'] } });

        // 4. Create Auction entities
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Hab ${testRunId}`, slug: `cat-hab-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer Hab ${testRunId}`, slug: `auct-hab-${testRunId}`, publicId: `auct-pub-hab-${testRunId}` } });
        testSeller = await prisma.seller.create({ data: { name: `Seller Hab ${testRunId}`, slug: `seller-hab-${testRunId}`, publicId: `seller-pub-hab-${testRunId}`, isJudicial: false } });
        
        const auctionRes = await auctionService.createAuction({ title: `Auction Hab ${testRunId}`, sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date() } as any);
        assert.ok(auctionRes.success && auctionRes.auctionId, 'Auction creation failed.');
        testAuction = (await auctionService.getAuctionById(auctionRes.auctionId!))!;

        const lotRes = await lotService.createLot({ title: `Lot Hab ${testRunId}`, auctionId: testAuction.id, price: 1000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) } as any);
        assert.ok(lotRes.success && lotRes.lotId, 'Lot creation failed.');
        testLot = (await lotService.getLotById(lotRes.lotId!))!;
        
        console.log(`--- [Habilitation E2E Setup - ${testRunId}] Complete. ---`);
    });

    test.after(async () => {
        console.log(`--- [Habilitation E2E Teardown - ${testRunId}] Cleaning up... ---`);
        try {
            await prisma.userDocument.deleteMany({ where: { userId: regularUser.id }});
            await prisma.bid.deleteMany({ where: { lotId: testLot.id } });
            await prisma.auctionHabilitation.deleteMany({ where: { auctionId: testAuction.id }});
            await lotService.deleteLot(testLot.id);
            await auctionService.deleteAuction(testAuction.id);
            await prisma.seller.delete({ where: { id: testSeller.id } });
            await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            await prisma.documentType.delete({ where: { id: testDocumentType.id } });
            await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
        } catch (error) {
            console.error("[Habilitation E2E Teardown] Error during cleanup:", error);
        }
        await prisma.$disconnect();
        console.log(`--- [Habilitation E2E Teardown - ${testRunId}] Complete. ---`);
    });

    test('should go through the full habilitation flow and place a successful bid', async () => {
        console.log('\n--- Test: Full Habilitation Flow ---');

        // 1. User uploads document
        const saveDocResult = await saveUserDocument(regularUser.id, testDocumentType.id, `/fake/path/doc-${testRunId}.pdf`, `doc-${testRunId}.pdf`);
        assert.ok(saveDocResult.success, 'Saving user document should succeed.');
        console.log('- Step 1: Document uploaded successfully.');
        
        let updatedUser = await userService.getUserById(regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'PENDING_ANALYSIS', 'User status should be PENDING_ANALYSIS after upload.');
        console.log('- Step 2: User status correctly updated to PENDING_ANALYSIS.');

        // 2. Analyst approves the document
        const userDocs = await prisma.userDocument.findMany({ where: { userId: regularUser.id } });
        const docToApprove = userDocs.find(d => d.documentTypeId === testDocumentType.id);
        assert.ok(docToApprove, 'Uploaded document should be found for approval.');
        
        const approvalResult = await approveDocument(docToApprove!.id, analystUser.id);
        assert.ok(approvalResult.success, 'Document approval action should succeed.');
        
        // 3. System habilitates the user automatically after all required docs are approved
        updatedUser = await userService.getUserById(regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'HABILITADO', 'User status should be HABILITADO after approval.');
        console.log('- Step 3: User status correctly updated to HABILITADO.');

        // 4. User tries to bid before enabling for this specific auction
        const bidResultBeforeHabilitation = await placeBidOnLot(testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1100);
        assert.strictEqual(bidResultBeforeHabilitation.success, false, "Bidding should fail before auction-specific habilitation.");
        assert.match(bidResultBeforeHabilitation.message, /habilitado para este leilão/, 'Error message should mention specific auction habilitation.');
        console.log('- Step 4: Blocked bid for user not enabled for the specific auction.');

        // 5. User enables themselves for the auction
        const habilitationRes = await habilitateForAuctionAction(regularUser.id, testAuction.id);
        assert.ok(habilitationRes.success, 'Auction-specific habilitation should succeed.');
        const isHabilitado = await checkHabilitationForAuctionAction(regularUser.id, testAuction.id);
        assert.ok(isHabilitado, 'Check habilitation should return true after enabling.');
        console.log('- Step 5: User successfully enabled for the auction.');

        // 6. User places a successful bid
        const bidResultAfterHabilitation = await placeBidOnLot(testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1200);
        assert.ok(bidResultAfterHabilitation.success, `Bidding should succeed after all habilitation steps. Error: ${bidResultAfterHabilitation.message}`);
        const finalLot = await lotService.getLotById(testLot.id);
        assert.strictEqual(finalLot?.price, 1200, 'Lot price should be updated after successful bid.');
        console.log('- Step 6: Successful bid placed.');
    });
});
