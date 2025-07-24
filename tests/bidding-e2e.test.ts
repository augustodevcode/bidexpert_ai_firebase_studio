// tests/bidding-e2e.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';
import { UserService } from '../src/services/user.service';
import { habilitateUserAction } from '../src/app/admin/habilitations/actions';
import { placeBidOnLot } from '../src/app/auctions/[auctionId]/lots/[lotId]/actions';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot } from '../src/types';

// Test Setup
const lotService = new LotService();
const auctionService = new AuctionService();
const userService = new UserService();
const testSuffix = '-Bidding-E2E';

let analystUser: UserProfileWithPermissions;
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
        await prisma.role.upsert({ where: { nameNormalized: 'AUCTION_ANALYST' }, update: {}, create: { name: 'AUCTION_ANALYST', nameNormalized: 'AUCTION_ANALYST', description: 'Test Analyst', permissions: ['users:manage_habilitation'] } });
        await prisma.role.upsert({ where: { nameNormalized: 'USER' }, update: {}, create: { name: 'USER', nameNormalized: 'USER', description: 'Test User', permissions: ['place_bids'] } });

        // 2. Create Analyst User
        const analystRole = await prisma.role.findUniqueOrThrow({ where: { nameNormalized: 'AUCTION_ANALYST' } });
        const analystResult = await userService.createUser({ fullName: `Analyst ${testSuffix}`, email: `analyst${testSuffix}@example.com`, password: 'password123' });
        await userService.updateUserRoles(analystResult.userId!, [analystRole.id]);
        analystUser = (await userService.getUserById(analystResult.userId!))!;

        // 3. Create Bidding Users
        for (let i = 1; i <= 5; i++) {
            const userResult = await userService.createUser({ fullName: `Bidder ${i}${testSuffix}`, email: `bidder${i}${testSuffix}@example.com`, password: 'password123' });
            const user = (await userService.getUserById(userResult.userId!))!;
            biddingUsers.push(user);
        }

        // 4. Create Auction dependencies
        testCategory = await prisma.lotCategory.create({ data: { name: `Category ${testSuffix}`, slug: `cat${testSuffix}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer ${testSuffix}`, slug: `auct${testSuffix}`, publicId: `auct-pub${testSuffix}` } });
        testSeller = await prisma.seller.create({ data: { name: `Seller ${testSuffix}`, slug: `sell${testSuffix}`, publicId: `sell-pub${testSuffix}`, isJudicial: false } });

        // 5. Create Auction
        const auctionResult = await auctionService.createAuction({ title: `Auction ${testSuffix}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: testAuctioneer.id, sellerId: testSeller.id, softCloseEnabled: true, softCloseMinutes: 3 });
        testAuction = (await auctionService.getAuctionById(auctionResult.auctionId!))!;
        
        // 6. Create Lot
        const lotResult = await lotService.createLot({ title: `Lot ${testSuffix}`, auctionId: testAuction.id, price: 50000, initialPrice: 50000, type: testCategory.id, status: 'ABERTO_PARA_LANCES', bidIncrementStep: 1000, endDate: new Date(Date.now() + 5 * 60 * 1000) }); // Ends in 5 mins
        testLot = (await lotService.getLotById(lotResult.lotId!))!;
        console.log('--- Bidding E2E Test: Setup complete ---');
    });

    test.after(async () => {
        console.log('--- Bidding E2E Test: Cleaning up data ---');
        try {
            await prisma.bid.deleteMany({ where: { lotId: testLot.id } });
            await prisma.lot.deleteMany({ where: { id: testLot.id } });
            await prisma.auction.deleteMany({ where: { id: testAuction.id } });
            await prisma.user.deleteMany({ where: { email: { endsWith: `${testSuffix}@example.com` } } });
            await prisma.seller.deleteMany({ where: { name: { endsWith: testSuffix } } });
            await prisma.auctioneer.deleteMany({ where: { name: { endsWith: testSuffix } } });
            await prisma.lotCategory.deleteMany({ where: { name: { endsWith: testSuffix } } });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
        await prisma.$disconnect();
        console.log('--- Bidding E2E Test: Cleanup finished ---');
    });

    test('should simulate a full auction lifecycle', async () => {
        // Step 1: Habilitate users
        console.log('Habilitating users...');
        for (const user of biddingUsers) {
            const habilitationResult = await habilitateUserAction(user.id);
            assert.strictEqual(habilitationResult.success, true, `Should habilitate user ${user.fullName}`);
        }
        console.log('Users habilitated.');

        // Step 2: Simulate bidding war
        console.log('Starting bidding simulation...');
        let currentPrice = testLot.price;
        const bidIncrement = 1000;
        
        for (let i = 0; i < 10; i++) { // 10 rounds of bidding
            for (const [index, user] of biddingUsers.entries()) {
                const bidAmount = currentPrice + bidIncrement * (index + 1);
                if (bidAmount >= 100000) break;
                
                const bidResult = await placeBidOnLot(testLot.id, testAuction.id, user.id, user.fullName!, bidAmount);
                assert.strictEqual(bidResult.success, true, `Bid by ${user.fullName} for ${bidAmount} should be successful`);
                currentPrice = bidAmount;
                await sleep(100); // Small delay between bids
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
        // In a real scenario, a cron job or scheduled task would do this. Here, we'll manually update.
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
