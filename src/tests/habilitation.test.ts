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
    
    console.log(`
    ================================================================
    [E2E TEST PLAN - User Habilitation]
    ================================================================
    
    Este teste valida o fluxo completo de habilitação de um usuário.
    
    CRITÉRIOS DE ACEITE A SEREM VERIFICADOS:
    
    1.  **Bloqueio Inicial**: Um usuário recém-criado (ou com documentos pendentes) NÃO deve conseguir dar lances.
    2.  **Envio de Documentos**: O sistema deve registrar o envio de um documento e alterar o status do usuário para "Em Análise".
    3.  **Aprovação de Documentos**: Um usuário "Analista" deve conseguir aprovar os documentos, alterando o status geral do usuário para "Habilitado".
    4.  **Habilitação por Leilão**: Mesmo com o cadastro aprovado, o usuário ainda NÃO deve conseguir dar lances até se habilitar para o leilão específico.
    5.  **Lance Pós-Habilitação**: Após se habilitar para o leilão, o usuário deve conseguir registrar um lance com sucesso no lote.
    
    ================================================================
    `);

    test.before(async () => {
        console.log(`--- [Habilitation E2E Setup - ${testRunId}] Starting... ---`);
        const userRole = await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'User', nameNormalized: 'USER', permissions: ['view_auctions', 'view_lots'] } });
        const analystRole = await prisma.role.upsert({ where: { nameNormalized: 'AUCTION_ANALYST' }, update: {}, create: { name: 'Auction Analyst', nameNormalized: 'AUCTION_ANALYST', permissions: ['users:manage_habilitation'] } });
        const bidderRole = await prisma.role.upsert({ where: { nameNormalized: 'BIDDER' }, update: {}, create: { name: 'Bidder', nameNormalized: 'BIDDER', permissions: ['place_bids'] } });

        const userRes = await userService.createUser({ fullName: `Arrematante ${testRunId}`, email: `arrematante-${testRunId}@test.com`, password: 'password123', roleIds: [userRole.id], habilitationStatus: 'PENDING_DOCUMENTS' });
        assert.ok(userRes.success && userRes.userId, 'Regular user creation failed.');
        regularUser = (await userService.getUserById(userRes.userId!))!;

        const analystRes = await userService.createUser({ fullName: `Analista ${testRunId}`, email: `analista-${testRunId}@test.com`, password: 'password123', roleIds: [analystRole.id], habilitationStatus: 'HABILITADO' });
        assert.ok(analystRes.success && analystRes.userId, 'Analyst user creation failed.');
        analystUser = (await userService.getUserById(analystRes.userId!))!;
        
        testDocumentType = await prisma.documentType.upsert({ 
            where: { name: `RG Teste E2E ${testRunId}`}, 
            update: {},
            create: { name: `RG Teste E2E ${testRunId}`, description: 'Documento de RG para teste', isRequired: true, appliesTo: 'PHYSICAL,LEGAL' } 
        });

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
            if (testLot) await lotService.deleteLot(testLot.id);
            if (testAuction) await auctionService.deleteAuction(testAuction.id);
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (testDocumentType) await prisma.documentType.delete({ where: { id: testDocumentType.id } });
            await prisma.usersOnRoles.deleteMany({ where: { userId: { in: [regularUser.id, analystUser.id] } } });
            await prisma.user.deleteMany({ where: { email: { contains: testRunId } } });
        } catch (error) {
            console.error("[Habilitation E2E Teardown] Error during cleanup:", error);
        }
        await prisma.$disconnect();
        console.log(`--- [Habilitation E2E Teardown - ${testRunId}] Complete. ---`);
    });

    test('should fail to bid if user has not submitted required documents', async () => {
        console.log('\n--- Test: Bidding without submitting any documents ---');
        const bidResult = await placeBidOnLot(testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1100);
        assert.strictEqual(bidResult.success, false, 'Bidding should fail without approved documents');
        assert.match(bidResult.message, /Apenas usuários com status \'HABILITADO\'/, 'Error message should mention habilitation status.');
        console.log('- PASSED: Blocked bid for user with pending documents.');
    });

    test('should go through the full habilitation flow and place a successful bid', async () => {
        console.log('\n--- Test: Full Habilitation Flow ---');

        const saveDocResult = await saveUserDocument(regularUser.id, testDocumentType.id, `/fake/path/doc-${testRunId}.pdf`, `doc-${testRunId}.pdf`);
        assert.ok(saveDocResult.success, `Saving user document should succeed. Error: ${saveDocResult.message}`);
        
        let updatedUser = await userService.getUserById(regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'PENDING_ANALYSIS', 'User status should be PENDING_ANALYSIS after upload.');
        console.log('- Step 1: Document uploaded and user status is PENDING_ANALYSIS.');

        const userDocs = await prisma.userDocument.findMany({ where: { userId: regularUser.id } });
        const docToApprove = userDocs.find(d => d.documentTypeId === testDocumentType.id);
        assert.ok(docToApprove, 'Uploaded document should be found for approval.');
        
        const approvalResult = await approveDocument(docToApprove!.id, analystUser.id);
        assert.ok(approvalResult.success, `Document approval action should succeed. Error: ${approvalResult.message}`);
        
        updatedUser = await userService.getUserById(regularUser.id);
        assert.strictEqual(updatedUser?.habilitationStatus, 'HABILITADO', 'User status should be HABILITADO after approval.');
        console.log('- Step 2: User status correctly updated to HABILITADO.');

        const bidResultBeforeHabilitation = await placeBidOnLot(testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1100);
        assert.strictEqual(bidResultBeforeHabilitation.success, false, "Bidding should fail before auction-specific habilitation.");
        assert.match(bidResultBeforeHabilitation.message, /habilitado para este leilão/, 'Error message should mention specific auction habilitation.');
        console.log('- Step 3: Blocked bid for user not enabled for the specific auction.');

        const habilitationRes = await habilitateForAuctionAction(regularUser.id, testAuction.id);
        assert.ok(habilitationRes.success, `Auction-specific habilitation should succeed. Error: ${habilitationRes.message}`);
        const isHabilitado = await checkHabilitationForAuctionAction(regularUser.id, testAuction.id);
        assert.ok(isHabilitado, 'Check habilitation should return true after enabling.');
        console.log('- Step 4: User successfully enabled for the auction.');

        const bidResultAfterHabilitation = await placeBidOnLot(testLot.id, testAuction.id, regularUser.id, regularUser.fullName!, 1200);
        assert.ok(bidResultAfterHabilitation.success, `Bidding should succeed after all habilitation steps. Error: ${bidResultAfterHabilitation.message}`);
        const finalLot = await lotService.getLotById(testLot.id);
        assert.strictEqual(finalLot?.price, 1200, 'Lot price should be updated after successful bid.');
        console.log('- Step 5: Successful bid placed.');
    });
});
