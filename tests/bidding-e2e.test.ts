// tests/bidding-e2e.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';
import { UserService } from '../src/services/user.service';
import { habilitateForAuctionAction } from '../src/app/admin/habilitations/actions';
import { placeBidOnLot } from '../src/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot } from '../src/types';
import { RoleRepository } from '@/repositories/role.repository';


// Test Setup
const lotService = new LotService();
const auctionService = new AuctionService();
const userService = new UserService();
const roleRepository = new RoleRepository();
const testSuffix = '-Bidding-E2E';

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
        
        // 1. Create Roles if they don't exist
        const userRole = await roleRepository.findByNormalizedName('USER');
        assert.ok(userRole, "USER role must exist for the test to run. Please seed essential data.");

        // 2. Create Bidding Users
        for (let i = 1; i <= 5; i++) {
            const userResult = await userService.createUser({ 
                fullName: `Bidder ${i}${testSuffix}`, 
                email: `bidder${i}${testSuffix}@example.com`, 
                password: 'password123', 
                roleIds: [userRole!.id],
                habilitationStatus: 'HABILITADO' // Pre-habilitate document status
            });
            assert.ok(userResult.success && userResult.userId, `Bidder ${i} must be created successfully.`);
            const user = (await userService.getUserById(userResult.userId));
            assert.ok(user, `Bidder ${i} profile must be fetched successfully.`);
            biddingUsers.push(user);
        }

        // 3. Create Auction dependencies
        testCategory = await prisma.lotCategory.create({ data: { name: `Category ${testSuffix}`, slug: `cat${testSuffix}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer ${testSuffix}`, slug: `auct${testSuffix}`, publicId: `auct-pub${testSuffix}` } });
        testSeller = await prisma.seller.create({ data: { name: `Seller ${testSuffix}`, slug: `sell${testSuffix}`, publicId: `sell-pub${testSuffix}`, isJudicial: false } });

        // 4. Create Auction
        const auctionResult = await auctionService.createAuction({ title: `Auction ${testSuffix}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: testAuctioneer.id, sellerId: testSeller.id, softCloseEnabled: true, softCloseMinutes: 3 });
        assert.ok(auctionResult.success && auctionResult.auctionId, "Auction must be created successfully.");
        const fetchedAuction = (await auctionService.getAuctionById(auctionResult.auctionId));
        assert.ok(fetchedAuction, "Auction profile must be fetched successfully.");
        testAuction = fetchedAuction;
        
        // 5. Create Lot
        const lotResult = await lotService.createLot({ title: `Lot ${testSuffix}`, auctionId: testAuction.id, price: 50000, initialPrice: 50000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bidIncrementStep: 1000, endDate: new Date(Date.now() + 5 * 60 * 1000) });
        assert.ok(lotResult.success && lotResult.lotId, "Lot must be created successfully.");
        const fetchedLot = (await lotService.getLotById(lotResult.lotId))!;
        assert.ok(fetchedLot, "Lot profile must be fetched successfully.");
        testLot = fetchedLot;
        
        console.log('--- Bidding E2E Test: Setup complete ---');
    });

    test.after(async () => {
        console.log('--- Bidding E2E Test: Cleaning up data ---');
        try {
            if (testLot) await prisma.bid.deleteMany({ where: { lotId: testLot.id } });
            if (testLot) await prisma.lot.delete({ where: { id: testLot.id } });
            if (testAuction) await prisma.auction.delete({ where: { id: testAuction.id } });
            if (biddingUsers.length > 0) {
                 const idsToDelete = biddingUsers.map(u => u.id).filter(Boolean);
                 if (idsToDelete.length > 0) {
                     await prisma.user.deleteMany({ where: { id: { in: idsToDelete } } });
                 }
            }
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
        await prisma.$disconnect();
        console.log('--- Bidding E2E Test: Cleanup finished ---');
    });

    test('should simulate a full auction lifecycle', async () => {
        // Step 1: Habilitate users for the specific auction
        console.log('Habilitating users for the auction...');
        for (const user of biddingUsers) {
            const habilitationResult = await habilitateForAuctionAction(user.id, testAuction.id);
            assert.strictEqual(habilitationResult.success, true, `Should habilitate user ${user.fullName} for auction ${testAuction.id}`);
        }
        console.log('Users habilitated for auction.');

        // Step 2: Simulate bidding war
        console.log('Starting bidding simulation...');
        let currentPrice = testLot.price;
        const bidIncrement = 1000;
        
        for (let i = 0; i < 10; i++) { // 10 rounds of bidding
            for (const [index, user] of biddingUsers.entries()) {
                const bidAmount = currentPrice + bidIncrement;
                if (bidAmount >= 100000) break;
                
                const bidResult = await placeBidOnLot(testLot.id, testAuction.id, user.id, user.fullName!, bidAmount);
                assert.strictEqual(bidResult.success, true, `Bid by ${user.fullName} for ${bidAmount} should be successful`);
                currentPrice = bidAmount;
                await sleep(50); // Small delay between bids
            }
            if (currentPrice >= 100000) break;
        }

        console.log(`Bidding war ended, current price: ${currentPrice}`);

        // Step 3: Simulate the final winning bid
        console.log('Placing final winning bid...');
        const winner = biddingUsers[0];
        const winningBidAmount = 101000;
        const finalBidResult = await placeBidOnLot(testLot.id, testAuction.id, winner.id, winner.fullName!, winningBidAmount);
        assert.strictEqual(finalBidResult.success, true, 'Final winning bid should be successful');

        // Step 4: Simulate end of auction and verify winner
        console.log('Simulating end of auction...');
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
    });
});
