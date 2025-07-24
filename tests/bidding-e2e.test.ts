// tests/bidding-e2e.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';
import { UserService } from '../src/services/user.service';
import { habilitateUserAction, habilitateForAuctionAction } from '../src/app/admin/habilitations/actions';
import { placeBidOnLot } from '../src/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot } from '../src/types';
import { RoleRepository } from '@/repositories/role.repository';


// Test Setup
const lotService = new LotService();
const auctionService = new AuctionService();
const userService = new UserService();
const roleRepository = new RoleRepository();
const testSuffix = '-Bidding-E2E';

let testAnalyst: UserProfileWithPermissions;
let biddingUsers: UserProfileWithPermissions[] = [];
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let testAuction: Auction;
let testLot: Lot;

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test.describe('Full Bidding E2E Test with Soft-Close', () => {

    test.before(async () => {
        console.log('--- Bidding E2E Test: Setting up prerequisite data ---');
        
        // 1. Find necessary roles
        const allRoles = await roleRepository.findAll();
        console.log('Found roles in DB:', allRoles.map(r => r.nameNormalized));

        const userRole = allRoles.find(r => r.nameNormalized === 'USER');
        const bidderRole = allRoles.find(r => r.nameNormalized === 'BIDDER');
        const analystRole = allRoles.find(r => r.nameNormalized === 'AUCTION_ANALYST');
        
        assert.ok(userRole, "USER role must exist for the test to run. Please seed essential data.");
        assert.ok(bidderRole, "BIDDER role must exist for the test to run. Please seed essential data.");
        assert.ok(analystRole, "AUCTION_ANALYST role must exist for the test to run. Please seed essential data.");

        // 2. Create Analyst and Bidding Users
        console.log('Creating test users...');
        const analystResult = await userService.createUser({ fullName: `Analyst ${testSuffix}`, email: `analyst${testSuffix}@example.com`, password: 'password123', roleIds: [analystRole!.id] });
        assert.ok(analystResult.success && analystResult.userId, `Analyst user creation failed: ${analystResult.message}`);
        const fetchedAnalyst = await userService.getUserById(analystResult.userId);
        assert.ok(fetchedAnalyst, "Analyst profile must be fetched successfully.");
        testAnalyst = fetchedAnalyst;
        console.log(`- Created Analyst: ${testAnalyst.fullName} (ID: ${testAnalyst.id})`);

        for (let i = 1; i <= 5; i++) {
            const userResult = await userService.createUser({ 
                fullName: `Bidder ${i}${testSuffix}`, 
                email: `bidder${i}${testSuffix}@example.com`, 
                password: 'password123', 
                roleIds: [userRole!.id],
            });
            assert.ok(userResult.success && userResult.userId, `Bidder ${i} creation failed: ${userResult.message}`);
            const user = (await userService.getUserById(userResult.userId!));
            assert.ok(user, `Bidder ${i} profile must be fetched successfully.`);
            biddingUsers.push(user);
            console.log(`- Created Bidder: ${user.fullName} (ID: ${user.id})`);
        }
        console.log(`${biddingUsers.length} bidding users created.`);


        // 3. Create Auction dependencies
        console.log('Creating auction dependencies...');
        testCategory = await prisma.lotCategory.create({ data: { name: `Category ${testSuffix}`, slug: `cat${testSuffix}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer ${testSuffix}`, slug: `auct${testSuffix}`, publicId: `auct-pub${testSuffix}` } });
        testSeller = await prisma.seller.create({ data: { name: `Seller ${testSuffix}`, slug: `sell${testSuffix}`, publicId: `sell-pub${testSuffix}`, isJudicial: false } });
        console.log(`- Created Category ID: ${testCategory.id}, Auctioneer ID: ${testAuctioneer.id}, Seller ID: ${testSeller.id}`);


        // 4. Create Auction
        console.log('Creating test auction...');
        const auctionResult = await auctionService.createAuction({ title: `Auction ${testSuffix}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: testAuctioneer.id, sellerId: testSeller.id, softCloseEnabled: true, softCloseMinutes: 3 });
        assert.ok(auctionResult.success && auctionResult.auctionId, `Auction creation failed: ${auctionResult.message}`);
        const fetchedAuction = (await auctionService.getAuctionById(auctionResult.auctionId));
        assert.ok(fetchedAuction, "Auction profile must be fetched successfully.");
        testAuction = fetchedAuction;
        console.log(`- Created Auction ID: ${testAuction.id}`);
        
        // 5. Create Lot
        console.log('Creating test lot...');
        const endDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const lotResult = await lotService.createLot({ title: `Lot ${testSuffix}`, auctionId: testAuction.id, price: 50000, initialPrice: 50000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bidIncrementStep: 1000, endDate: endDate });
        assert.ok(lotResult.success && lotResult.lotId, `Lot creation failed: ${lotResult.message}`);
        const fetchedLot = (await lotService.getLotById(lotResult.lotId))!;
        assert.ok(fetchedLot, "Lot profile must be fetched successfully.");
        testLot = fetchedLot;
        console.log(`- Created Lot ID: ${testLot.id} with endDate: ${endDate.toISOString()}`);
        
        console.log('--- Bidding E2E Test: Setup complete ---');
    });

    test.after(async () => {
        console.log('--- Bidding E2E Test: Cleaning up data ---');
        try {
            if (testLot?.id) await prisma.bid.deleteMany({ where: { lotId: testLot.id } });
            if (testLot?.id) await lotService.deleteLot(testLot.id);
            if (testAuction?.id) await auctionService.deleteAuction(testAuction.id);
            const userIds = biddingUsers.map(u => u.id).concat(testAnalyst ? [testAnalyst.id] : []).filter(Boolean);
            if (userIds.length > 0) {
                await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIds } } });
                await prisma.user.deleteMany({ where: { id: { in: userIds } } });
            }
            if (testSeller?.id) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testAuctioneer?.id) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory?.id) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
        await prisma.$disconnect();
        console.log('--- Bidding E2E Test: Cleanup finished ---');
    });

    test('should simulate a full auction lifecycle', async () => {
        // Step 1: Habilitate users via Analyst
        console.log('Step 1: Habilitating users via Analyst...');
        for (const user of biddingUsers) {
            const habilitationResult = await habilitateUserAction(user.id);
            assert.strictEqual(habilitationResult.success, true, `Should habilitate user ${user.fullName}`);
            
            const auctionHabilitationResult = await habilitateForAuctionAction(user.id, testAuction.id);
            assert.strictEqual(auctionHabilitationResult.success, true, `Should enable user ${user.fullName} for auction ${testAuction.id}`);
            console.log(` - User ${user.fullName} habilitado.`);
        }
        console.log('All users habilitated for auction.');

        // Step 2: Simulate bidding war
        console.log('Step 2: Starting bidding simulation...');
        let currentPrice = testLot.price;
        const bidIncrement = 1000;
        
        for (let i = 0; i < 10; i++) { // 10 rounds of bidding
            for (const user of biddingUsers) {
                const bidAmount = currentPrice + bidIncrement;
                if (bidAmount >= 100000) break;
                
                console.log(` - Bid by ${user.fullName} for R$ ${bidAmount}`);
                const bidResult = await placeBidOnLot(testLot.id, testAuction.id, user.id, user.fullName!, bidAmount);
                assert.strictEqual(bidResult.success, true, `Bid by ${user.fullName} for ${bidAmount} should be successful. Message: ${bidResult.message}`);
                currentPrice = bidAmount;
                await sleep(50);
            }
            if (currentPrice >= 100000) break;
        }

        console.log(`Bidding war ended, current price: R$ ${currentPrice}`);

        // Step 3: Simulate the final winning bid
        console.log('Step 3: Placing final winning bid...');
        const winner = biddingUsers[0];
        const winningBidAmount = 101000;
        const finalBidResult = await placeBidOnLot(testLot.id, testAuction.id, winner.id, winner.fullName!, winningBidAmount);
        console.log(` - Final bid by ${winner.fullName} for R$ ${winningBidAmount}`);
        assert.strictEqual(finalBidResult.success, true, 'Final winning bid should be successful');

        // Step 4: Simulate end of auction and verify winner
        console.log('Step 4: Simulating end of auction...');
        await prisma.lot.update({
            where: { id: testLot.id },
            data: { status: 'VENDIDO', winnerId: winner.id, price: winningBidAmount }
        });

        const finalLotState = await prisma.lot.findUnique({ where: { id: testLot.id } });
        
        console.log('--- Final Lot State ---');
        console.log(finalLotState);
        console.log('-----------------------');
        
        assert.ok(finalLotState, 'Final lot state should exist');
        assert.strictEqual(finalLotState.status, 'VENDIDO', 'Lot status should be VENDIDO');
        assert.strictEqual(finalLotState.winnerId, winner.id, 'The winnerId should be correctly set');
        assert.strictEqual(finalLotState.price, winningBidAmount, 'The final price should be the winning bid amount');
        console.log('--- TEST PASSED: Full lifecycle simulated successfully! ---');
    });
});
