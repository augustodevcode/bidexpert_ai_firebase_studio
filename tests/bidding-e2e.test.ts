// tests/bidding-e2e.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';
import { UserService } from '../src/services/user.service';
import { SellerService } from '../src/services/seller.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { BemService } from '../src/services/bem.service';
import { habilitateForAuctionAction } from '../src/app/admin/habilitations/actions';
import { placeBidOnLot } from '../src/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Bem, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch } from '../src/types';
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
const testRunId = uuidv4().substring(0, 8);
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
let judicialAuction: Auction, extrajudicialAuction: Auction;
let judicialLot: Lot, extrajudicialLot: Lot;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test.describe('Full Auction E2E Simulation Test', () => {

    test.before(async () => {
        console.log(`--- [E2E Setup - ${testRunId}] Starting prerequisite data setup ---`);
        
        // 1. Roles
        const userRole = await roleRepository.findByNormalizedName('USER');
        const bidderRole = await roleRepository.findByNormalizedName('BIDDER');
        const analystRole = await roleRepository.findByNormalizedName('AUCTION_ANALYST');
        const consignorRole = await roleRepository.findByNormalizedName('CONSIGNOR');
        assert.ok(userRole && bidderRole && analystRole && consignorRole, "Essential roles (USER, BIDDER, AUCTION_ANALYST, CONSIGNOR) must exist.");

        // 2. Users
        const analystRes = await userService.createUser({ fullName: `Analyst ${testRunId}`, email: `analyst-${testRunId}@test.com`, password: 'password123', roleIds: [analystRole!.id] });
        testAnalyst = (await userService.getUserById(analystRes.userId!))!;

        for (let i = 1; i <= 2; i++) {
            const userRes = await userService.createUser({ fullName: `Bidder ${i} ${testRunId}`, email: `bidder${i}-${testRunId}@test.com`, password: 'password123', roleIds: [userRole!.id] });
            biddingUsers.push((await userService.getUserById(userRes.userId!))!);
        }

        const consignorRes = await userService.createUser({ fullName: `Consignor User ${testRunId}`, email: `consignor-${testRunId}@test.com`, password: 'password123', roleIds: [userRole!.id, consignorRole!.id] });
        consignorUser = (await userService.getUserById(consignorRes.userId!))!;

        // 3. Core Entities
        testCategory = await prisma.lotCategory.create({ data: { name: `Category ${testRunId}`, slug: `cat-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer ${testRunId}`, slug: `auct-${testRunId}`, publicId: `auct-pub-${testRunId}` } });

        // 4. Extrajudicial Seller (Consignor)
        const sellerRes = await sellerService.createSeller({ name: `Consignor Seller ${testRunId}`, isJudicial: false, userId: consignorUser.id } as any);
        testSeller = (await sellerService.getSellerById(sellerRes.sellerId!))!;
        await prisma.user.update({ where: { id: consignorUser.id }, data: { sellerId: testSeller.id } }); // Link back

        // 5. Judicial Entities
        testState = await prisma.state.create({ data: { name: `State ${testRunId}`, uf: `T${testRunId.charAt(0)}`, slug: `st-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Court ${testRunId}`, stateUf: testState.uf, slug: `court-${testRunId}` } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `District ${testRunId}`, slug: `dist-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Branch ${testRunId}`, slug: `branch-${testRunId}`, districtId: testDistrict.id } });
        
        // 6. Judicial Seller (Vara)
        const judicialSellerRes = await sellerService.createSeller({ name: `Vara ${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id } as any);
        testJudicialSeller = (await sellerService.getSellerById(judicialSellerRes.sellerId!))!;

        console.log(`--- [E2E Setup - ${testRunId}] Setup complete ---`);
    });

    test.after(async () => {
        // Comprehensive cleanup
    });

    test('should simulate the full lifecycle of a JUDICIAL auction', async () => {
        console.log('\n--- Running JUDICIAL Auction Simulation ---');
        // 1. Create Judicial Process
        const procRes = await judicialProcessService.createJudicialProcess({ processNumber: `123-${testRunId}`, isElectronic: true, courtId: testCourt.id, districtId: testDistrict.id, branchId: testBranch.id, sellerId: testJudicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] });
        assert.ok(procRes.success && procRes.processId, 'Judicial process should be created');
        testJudicialProcess = (await judicialProcessService.getJudicialProcessById(procRes.processId!))!;
        console.log(`- Judicial Process ${testJudicialProcess.processNumber} created.`);

        // 2. Create Bem linked to the process
        const bemRes = await bemService.createBem({ title: `Bem Judicial ${testRunId}`, judicialProcessId: testJudicialProcess.id, categoryId: testCategory.id, status: 'DISPONIVEL', evaluationValue: 12000 } as any);
        assert.ok(bemRes.success && bemRes.bemId, 'Judicial Bem should be created');
        testBemJudicial = (await bemService.getBemById(bemRes.bemId!))!;
        console.log(`- Judicial Bem "${testBemJudicial.title}" created.`);

        // 3. Create Judicial Auction
        const auctionRes = await auctionService.createAuction({ title: `Leilão Judicial ${testRunId}`, auctionType: 'JUDICIAL', judicialProcessId: testJudicialProcess.id, sellerId: testJudicialSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date() });
        assert.ok(auctionRes.success && auctionRes.auctionId, 'Judicial Auction should be created');
        judicialAuction = (await auctionService.getAuctionById(auctionRes.auctionId!))!;
        console.log(`- Judicial Auction "${judicialAuction.title}" created.`);

        // 4. Create Lot from the Bem
        const endDate = new Date(Date.now() + 5 * 60000); // 5 mins
        const lotRes = await lotService.createLot({ title: testBemJudicial.title, auctionId: judicialAuction.id, price: 12000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bemIds: [testBemJudicial.id], endDate });
        assert.ok(lotRes.success && lotRes.lotId, 'Judicial Lot should be created');
        judicialLot = (await lotService.getLotById(lotRes.lotId!))!;
        console.log(`- Judicial Lot "${judicialLot.title}" created in auction.`);
    });
    
    test('should simulate the full lifecycle of an EXTRAJUDICIAL auction', async () => {
        console.log('\n--- Running EXTRAJUDICIAL Auction Simulation ---');
        // 1. Create Bem linked to the consignor
        const bemRes = await bemService.createBem({ title: `Bem Extrajudicial ${testRunId}`, sellerId: testSeller.id, categoryId: testCategory.id, status: 'DISPONIVEL', evaluationValue: 25000 } as any);
        assert.ok(bemRes.success && bemRes.bemId, 'Extrajudicial Bem should be created');
        testBemExtrajudicial = (await bemService.getBemById(bemRes.bemId!))!;
        console.log(`- Extrajudicial Bem "${testBemExtrajudicial.title}" created.`);

        // 2. Create Extrajudicial Auction
        const auctionRes = await auctionService.createAuction({ title: `Leilão Extrajudicial ${testRunId}`, auctionType: 'EXTRAJUDICIAL', sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES', auctionDate: new Date() });
        assert.ok(auctionRes.success && auctionRes.auctionId, 'Extrajudicial Auction should be created');
        extrajudicialAuction = (await auctionService.getAuctionById(auctionRes.auctionId!))!;
        console.log(`- Extrajudicial Auction "${extrajudicialAuction.title}" created.`);

        // 3. Create Lot from the Bem
        const endDate = new Date(Date.now() + 10 * 60000); // 10 mins
        const lotRes = await lotService.createLot({ title: testBemExtrajudicial.title, auctionId: extrajudicialAuction.id, price: 25000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bemIds: [testBemExtrajudicial.id], endDate });
        assert.ok(lotRes.success && lotRes.lotId, 'Extrajudicial Lot should be created');
        extrajudicialLot = (await lotService.getLotById(lotRes.lotId!))!;
        console.log(`- Extrajudicial Lot "${extrajudicialLot.title}" created in auction.`);
    });
    
    test('should simulate bidding on the judicial lot', async () => {
        console.log(`\n--- Simulating Bidding on Judicial Lot: ${judicialLot.title} ---`);
        // Habilitate users
        for (const user of biddingUsers) {
            const res = await habilitateForAuctionAction(user.id, judicialAuction.id);
            assert.ok(res.success, `Habilitation should succeed for ${user.fullName}`);
        }
        console.log('- All bidders habilitated.');
        
        // Place bids
        const bid1 = await placeBidOnLot(judicialLot.id, judicialAuction.id, biddingUsers[0].id, biddingUsers[0].fullName!, 13000);
        assert.ok(bid1.success, 'Bid 1 should be successful');
        const bid2 = await placeBidOnLot(judicialLot.id, judicialAuction.id, biddingUsers[1].id, biddingUsers[1].fullName!, 14000);
        assert.ok(bid2.success, 'Bid 2 should be successful');
        
        const updatedLot = await lotService.getLotById(judicialLot.id);
        assert.strictEqual(updatedLot?.price, 14000, 'Lot price should be updated to the latest bid');
        console.log('- Bidding successful, price updated.');
    });
});
