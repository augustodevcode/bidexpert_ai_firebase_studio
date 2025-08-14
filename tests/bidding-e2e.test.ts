// tests/bidding-e2e.test.ts
import { test, describe, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { LotService } from '@/services/lot.service';
import { AuctionService } from '@/services/auction.service';
import { UserService } from '@/services/user.service';
import { SellerService } from '@/services/seller.service';
import { JudicialProcessService } from '@/services/judicial-process.service';
import { BemService } from '@/services/bem.service';
import { habilitateForAuctionAction } from '@/app/admin/habilitations/actions';
import { placeBidOnLot } from '@/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Bem, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch } from '@/types';
import { RoleRepository } from '@/repositories/role.repository';
import { v4 as uuidv4 } from 'uuid';

// Services
const lotService = new LotService();
const auctionService = new AuctionService();
const userService = new UserService();
const sellerService = new SellerService();
const judicialProcessService = new JudicialProcessService();
const bemService = new BemService();
const roleRepository = new RoleRepository();

// Test data holders
const testRunId = `bidding-e2e-${uuidv4().substring(0, 8)}`;
let testAnalyst: UserProfileWithPermissions;
let biddingUsers: UserProfileWithPermissions[] = [];
let consignorUser: UserProfileWithPermissions;
let testSeller: SellerProfileInfo;
let testJudicialSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let testState: StateInfo;
let testCourt: Court, testDistrict: JudicialDistrict, testBranch: JudicialBranch, testJudicialProcess: JudicialProcess;
let testBemJudicial: Bem, testBemExtrajudicial: Bem;
let judicialAuction: Auction, extrajudicialAuction: Auction, silentAuction: Auction, dutchAuction: Auction, tomadaPrecos: Auction;
let judicialLot: Lot, extrajudicialLot: Lot, silentAuctionLot: Lot, dutchAuctionLot: Lot;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanup() {
    console.log(`--- [E2E Teardown - ${testRunId}] Cleaning up test data ---`);
    try {
        const userIds = [testAnalyst?.id, consignorUser?.id, ...biddingUsers.map(u => u.id)].filter(Boolean) as string[];
        if (userIds.length > 0) {
          await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
          await prisma.bid.deleteMany({ where: { bidderId: { in: userIds } } });
          await prisma.usersOnRoles.deleteMany({where: {userId: {in: userIds}}});
          await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }

        const lotIds = [judicialLot?.id, extrajudicialLot?.id, silentAuctionLot?.id, dutchAuctionLot?.id].filter(Boolean) as string[];
        if (lotIds.length > 0) {
          await prisma.lotBens.deleteMany({ where: { lotId: { in: lotIds } }});
          await prisma.userWin.deleteMany({ where: { lotId: { in: lotIds } } });
          await prisma.lot.deleteMany({ where: { id: { in: lotIds } } });
        }
        
        const auctionIds = [judicialAuction?.id, extrajudicialAuction?.id, silentAuction?.id, dutchAuction?.id, tomadaPrecos?.id].filter(Boolean) as string[];
        if (auctionIds.length > 0) {
             await prisma.auctionHabilitation.deleteMany({ where: { auctionId: { in: auctionIds } } });
             await prisma.auctionStage.deleteMany({where: {auctionId: {in: auctionIds}}});
             await prisma.auction.deleteMany({ where: { id: { in: auctionIds } } });
        }

        const bemIds = [testBemJudicial?.id, testBemExtrajudicial?.id].filter(Boolean) as string[];
        for (const bemId of bemIds) { await bemService.deleteBem(bemId); }
        
        if (testJudicialProcess) await judicialProcessService.deleteJudicialProcess(testJudicialProcess.id);
        if (testSeller) await sellerService.deleteSeller(testSeller.id);
        if (testJudicialSeller) await sellerService.deleteSeller(testJudicialSeller.id);
        if (testBranch) await prisma.judicialBranch.delete({ where: { id: testBranch.id } });
        if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
        if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
        if (testState) await prisma.state.delete({ where: { id: testState.id } });
        if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
        if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });

    } catch (error) {
        console.error("[E2E Teardown] Error during cleanup:", error);
    }
}


describe(`[E2E] Full Auction & Bidding Lifecycle Simulation (ID: ${testRunId})`, () => {

    beforeAll(async () => {
        await cleanup();
        console.log(`--- [E2E Setup - ${testRunId}] Starting prerequisite data setup ---`);
        
        // 1. Roles
        const userRole = await roleRepository.findByNormalizedName('USER');
        const bidderRole = await roleRepository.findByNormalizedName('BIDDER');
        const analystRole = await roleRepository.findByNormalizedName('AUCTION_ANALYST');
        const consignorRole = await roleRepository.findByNormalizedName('CONSIGNOR');
        assert.ok(userRole && bidderRole && analystRole && consignorRole, "Essential roles (USER, BIDDER, AUCTION_ANALYST, CONSIGNOR) must exist.");
        console.log('- Step 1: Essential roles verified.');

        // 2. Users
        for (let i = 1; i <= 3; i++) { // Create 3 bidders
            const userRes = await userService.createUser({ 
                fullName: `Bidder ${i} ${testRunId}`, 
                email: `bidder${i}-${testRunId}@test.com`, 
                password: 'password123', 
                roleIds: [userRole!.id, bidderRole!.id],
                habilitationStatus: 'HABILITADO' // Create user as already habilitated
            });
            assert.ok(userRes.success && userRes.userId, `Bidder ${i} user creation failed.`);
            biddingUsers.push((await userService.getUserById(userRes.userId!))!);
        }
        console.log(`- Step 2: ${biddingUsers.length} Bidders created.`);
        
        // 3. Core Entities
        testCategory = await prisma.lotCategory.create({ data: { name: `Category ${testRunId}`, slug: `cat-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer ${testRunId}`, slug: `auct-${testRunId}`, publicId: `auct-pub-${testRunId}` } });

        // 4. Extrajudicial Seller
        const sellerRes = await sellerService.createSeller({ name: `Consignor Seller ${testRunId}`, isJudicial: false } as any);
        assert.ok(sellerRes.success && sellerRes.sellerId, 'Extrajudicial seller creation failed');
        testSeller = (await sellerService.getSellerById(sellerRes.sellerId!))!;
        
        // 5. Judicial Seller & Entities
        const uniqueUf = testRunId.substring(0, 2).toUpperCase();
        testState = await prisma.state.create({ data: { name: `State ${testRunId}`, uf: uniqueUf, slug: `st-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Court ${testRunId}`, stateUf: testState.uf, slug: `court-${testRunId}` } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `District ${testRunId}`, slug: `dist-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Branch ${testRunId}`, slug: `branch-${testRunId}`, districtId: testDistrict.id } });
        const judicialSellerRes = await sellerService.createSeller({ name: `Vara ${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id, publicId: `seller-pub-judicial-${testRunId}` } as any);
        assert.ok(judicialSellerRes.success && judicialSellerRes.sellerId, 'Judicial seller creation failed');
        testJudicialSeller = (await sellerService.getSellerById(judicialSellerRes.sellerId!))!;
        console.log('- Step 3 & 4: Core entities (Category, Auctioneer, Sellers) created.');
        
        const procRes = await judicialProcessService.createJudicialProcess({ processNumber: `123-${testRunId}`, isElectronic: true, courtId: testCourt.id, districtId: testDistrict.id, branchId: testBranch.id, sellerId: testJudicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] });
        assert.ok(procRes.success && procRes.processId, 'Judicial process should be created');
        testJudicialProcess = (await judicialProcessService.getJudicialProcessById(procRes.processId!))!;
        console.log('- Step 5: Judicial process created.');
        
        // 6. Create Bens
        const bemJudicialRes = await bemService.createBem({ title: `Bem Judicial ${testRunId}`, judicialProcessId: testJudicialProcess.id, categoryId: testCategory.id, status: 'DISPONIVEL', evaluationValue: 12000 } as any);
        const bemExtrajudicialRes = await bemService.createBem({ title: `Bem Extrajudicial ${testRunId}`, sellerId: testSeller.id, categoryId: testCategory.id, status: 'DISPONIVEL', evaluationValue: 25000 } as any);
        assert.ok(bemJudicialRes.success && bemExtrajudicialRes.success, 'Bens creation failed');
        testBemJudicial = (await bemService.getBemById(bemJudicialRes.bemId!))!;
        testBemExtrajudicial = (await bemService.getBemById(bemExtrajudicialRes.bemId!))!;
        console.log('- Step 6: Judicial and Extrajudicial Bens created.');
        
        // 7. Create Auctions of all types
        const now = new Date();
        const endDate = (minutes: number) => new Date(now.getTime() + minutes * 60000);
        
        const [judAucRes, extAucRes, silAucRes, tomPreRes, dutAucRes] = await Promise.all([
          auctionService.createAuction({ title: `Leilão Judicial ${testRunId}`, auctionType: 'JUDICIAL', judicialProcessId: testJudicialProcess.id, sellerId: testJudicialSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: now, isFeaturedOnMarketplace: true, allowInstallmentBids: true, auctionStages: [{name: '1ª Praça', startDate: now, endDate: endDate(30)}] }),
          auctionService.createAuction({ title: `Leilão Extrajudicial ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: now, participation: 'HIBRIDO', address: 'Rua do Teste Híbrido, 123', onlineUrl: 'https://meet.google.com/test-hybrid', auctionStages: [{name: 'Praça Única', startDate: now, endDate: endDate(10)}] }),
          auctionService.createAuction({ title: `Leilão Silencioso ${testRunId}`, auctionType: 'PARTICULAR', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: now, auctionMethod: 'SILENT', silentBiddingEnabled: true, auctionStages: [{name: 'Período de Lances', startDate: now, endDate: endDate(15)}] }),
          auctionService.createAuction({ title: `Tomada de Preços ${testRunId}`, auctionType: 'TOMADA_DE_PRECOS', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO', auctionDate: now, auctionStages: [{name: 'Fase de Propostas', startDate: now, endDate: endDate(25)}]}),
          auctionService.createAuction({ title: `Leilão Holandês ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO', auctionDate: now, auctionMethod: 'DUTCH', decrementAmount: 100, decrementIntervalSeconds: 3, floorPrice: 8000, auctionStages: [{name: 'Leilão Holandês', startDate: now, endDate: endDate(20)}] }),
        ]);

        assert.ok(judAucRes.success && extAucRes.success && silAucRes.success && tomPreRes.success && dutAucRes.success, "All auction types should be created successfully.");
        judicialAuction = (await auctionService.getAuctionById(judAucRes.auctionId!))!;
        extrajudicialAuction = (await auctionService.getAuctionById(extAucRes.auctionId!))!;
        silentAuction = (await auctionService.getAuctionById(silAucRes.auctionId!))!;
        tomadaPrecos = (await auctionService.getAuctionById(tomPreRes.auctionId!))!;
        dutchAuction = (await auctionService.getAuctionById(dutAucRes.auctionId!))!;
        console.log('- Step 7: All auction types created.');

        // 8. Create Lots for the auctions
        const [judLotRes, extLotRes, silLotRes, dutLotRes] = await Promise.all([
             lotService.createLot({ title: testBemJudicial.title, auctionId: judicialAuction.id, price: 12000, initialPrice: 12000, secondInitialPrice: 8000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bemIds: [testBemJudicial.id], endDate: endDate(5), isExclusive: true, condition: 'Usado' }),
             lotService.createLot({ title: testBemExtrajudicial.title, auctionId: extrajudicialAuction.id, price: 25000, initialPrice: 25000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bemIds: [testBemExtrajudicial.id], endDate: endDate(10), condition: 'Novo' }),
             lotService.createLot({ title: `Lote Silencioso ${testRunId}`, auctionId: silentAuction.id, price: 5000, initialPrice: 5000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', endDate: endDate(15) }),
             lotService.createLot({ title: `Lote Holandês ${testRunId}`, auctionId: dutchAuction.id, price: 10000, initialPrice: 10000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', endDate: endDate(20) }),
        ]);

        assert.ok(judLotRes.success && extLotRes.success && silLotRes.success && dutLotRes.success, "All lots should be created successfully.");
        judicialLot = (await lotService.getLotById(judLotRes.lotId!))!;
        extrajudicialLot = (await lotService.getLotById(extLotRes.lotId!))!;
        silentAuctionLot = (await lotService.getLotById(silLotRes.lotId!))!;
        dutchAuctionLot = (await lotService.getLotById(dutLotRes.lotId!))!;
        console.log('- Step 8: Lots for each auction type created.');
        
        console.log(`--- [E2E Setup - ${testRunId}] Complete. ---`);
    }, 60000); // 60-second timeout for setup

    afterAll(async () => {
        await cleanup();
        await prisma.$disconnect();
        console.log(`--- [E2E Teardown - ${testRunId}] Final cleanup complete. ---`);
    }, 60000);

    it('Standard Bidding: should allow users to bid and determine a winner', async () => {
        console.log('\n--- Test: Standard Bidding on Extrajudicial Lot ---');
        assert.ok(extrajudicialLot, 'Extrajudicial Lot must be defined');

        // CRITERION: Users must be enabled for a specific auction to bid.
        console.log("- CRITÉRIO: Usuário deve estar habilitado para o leilão específico.");
        await habilitateForAuctionAction(biddingUsers[0].id, extrajudicialAuction.id);
        await habilitateForAuctionAction(biddingUsers[1].id, extrajudicialAuction.id);
        console.log(`- AÇÃO: Habilitar usuários ${biddingUsers[0].fullName} e ${biddingUsers[1].fullName} para o leilão.`);
        const isHabilitado1 = await prisma.auctionHabilitation.findFirst({where: {userId: biddingUsers[0].id, auctionId: extrajudicialAuction.id}});
        assert.ok(isHabilitado1, "Usuário 1 deve estar habilitado.");
        console.log("- STATUS: ✅ PASSOU");

        // CRITERION: A bid higher than the current price should be accepted.
        console.log("- CRITÉRIO: Um lance maior que o preço atual deve ser aceito.");
        const bid1 = await placeBidOnLot(extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[0].id, biddingUsers[0].fullName!, 26000);
        assert.ok(bid1.success, `Bid 1 should be successful. Error: ${bid1.message}`);
        console.log(`- AÇÃO: ${biddingUsers[0].fullName} dá um lance de R$ 26.000.`);
        let updatedLot = await lotService.getLotById(extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 26000, "Lot price should be 26000.");
        console.log("- VERIFICAÇÃO: Preço do lote atualizado para R$ 26.000.");
        console.log("- STATUS: ✅ PASSOU");
        
        // CRITERION: A subsequent higher bid from another user should be accepted and update the price.
        console.log("- CRITÉRIO: Um lance subsequente mais alto de outro usuário deve ser aceito.");
        const bid2 = await placeBidOnLot(extrajudicialLot.id, extrajudicialAuction.id, biddingUsers[1].id, biddingUsers[1].fullName!, 27000);
        assert.ok(bid2.success, `Bid 2 should be successful. Error: ${bid2.message}`);
        console.log(`- AÇÃO: ${biddingUsers[1].fullName} dá um lance de R$ 27.000.`);
        updatedLot = await lotService.getLotById(extrajudicialLot.id);
        assert.strictEqual(updatedLot?.price, 27000, "Lot price should be updated to 27000.");
        console.log("- VERIFICAÇÃO: Preço do lote atualizado para R$ 27.000.");
        console.log("- STATUS: ✅ PASSOU");
        
        // CRITERION: At the end of the auction, the highest bidder is the winner.
        console.log("- CRITÉRIO: No fim do leilão, o maior licitante é o vencedor.");
        const finalizationResult = await lotService.finalizeLot(extrajudicialLot.id);
        assert.ok(finalizationResult.success, `Lot finalization should succeed. Message: ${finalizationResult.message}`);
        
        const finalLot = await lotService.getLotById(extrajudicialLot.id);
        assert.strictEqual(finalLot?.status, 'VENDIDO', 'Lot status should be VENDIDO.');
        assert.strictEqual(finalLot?.winnerId, biddingUsers[1].id, 'Winner should be the highest bidder.');
        console.log("- AÇÃO: Leilão encerrado e vencedor declarado.");
        console.log("- VERIFICAÇÃO: Status e vencedor corretos.");
        console.log("- STATUS: ✅ PASSOU");
    });
});

  