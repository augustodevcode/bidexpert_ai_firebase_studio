// tests/relist.service.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { RelistService } from '@/services/relist.service';
import { LotService } from '@/services/lot.service';
import { AuctionService } from '@/services/auction.service';
import type { Lot, Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '@/types';

const relistService = new RelistService();
const lotService = new LotService();
const auctionService = new AuctionService();

const testRunId = `relist-e2e-${uuidv4().substring(0, 8)}`;
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let originalAuction: Auction;
let newAuction: Auction;
let originalLot: Lot;

describe('Lot Relisting Service E2E Tests', () => {

    beforeAll(async () => {
        console.log(`--- [Relist E2E Setup - ${testRunId}] Starting... ---`);
        // Create shared entities
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Relist ${testRunId}`, slug: `cat-relist-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer Relist ${testRunId}`, publicId: `leiloeiro-relist-${testRunId}`, slug: `leiloeiro-relist-${testRunId}` } });
        testSeller = await prisma.seller.create({ data: { name: `Seller Relist ${testRunId}`, publicId: `seller-relist-${testRunId}`, slug: `comitente-relist-${testRunId}`, isJudicial: false } });
        
        // Create two auctions
        const [res1, res2] = await Promise.all([
            auctionService.createAuction({ title: `Original Auction ${testRunId}`, sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'ABERTO_PARA_LANCES' } as any),
            auctionService.createAuction({ title: `New Auction ${testRunId}`, sellerId: testSeller.id, auctioneerId: testAuctioneer.id, status: 'EM_BREVE' } as any)
        ]);
        assert.ok(res1.success && res1.auctionId, "Original auction setup failed");
        assert.ok(res2.success && res2.auctionId, "New auction setup failed");
        originalAuction = (await auctionService.getAuctionById(res1.auctionId))!;
        newAuction = (await auctionService.getAuctionById(res2.auctionId))!;

        // Create the initial lot
        const lotRes = await lotService.createLot({ 
            title: `Lot to be Relisted ${testRunId}`, 
            auctionId: originalAuction.id, 
            price: 1000, 
            initialPrice: 1000,
            evaluationValue: 1000,
            type: testCategory.id, 
            status: 'NAO_VENDIDO' // Set status as if it didn't sell
        });
        assert.ok(lotRes.success && lotRes.lotId);
        originalLot = (await lotService.getLotById(lotRes.lotId))!;
    });
    
    afterAll(async () => {
        console.log(`--- [Relist E2E Teardown - ${testRunId}] Cleaning up... ---`);
        try {
            await prisma.lot.deleteMany({ where: { originalLotId: originalLot.id } }); // Delete relisted lot
            await prisma.lot.deleteMany({ where: { id: originalLot.id } });
            await prisma.auction.deleteMany({ where: { id: { in: [originalAuction.id, newAuction.id] } } });
            await prisma.seller.deleteMany({ where: { id: testSeller.id } });
            await prisma.auctioneer.deleteMany({ where: { id: testAuctioneer.id } });
            await prisma.lotCategory.deleteMany({ where: { id: testCategory.id } });
        } catch (error) {
            console.error(`[Relist TEST CLEANUP] Error during cleanup:`, error);
        }
        await prisma.$disconnect();
    });

    it('should successfully relist an unsold lot with a discount', async () => {
        // Arrange
        const discountPercentage = 50;

        // Act
        const result = await relistService.relistLot(originalLot.id, newAuction.id, discountPercentage);
        
        // Assert
        assert.ok(result.success, `Relisting should succeed. Message: ${result.message}`);
        assert.ok(result.newLotId, 'A new lot ID should be returned');

        // Verify original lot status
        const updatedOriginalLot = await lotService.getLotById(originalLot.id);
        assert.strictEqual(updatedOriginalLot?.status, 'RELISTADO', 'Original lot status should be updated to RELISTADO');
        
        // Verify new lot details
        const newLot = await lotService.getLotById(result.newLotId!);
        assert.ok(newLot, 'The new lot should exist');
        assert.strictEqual(newLot.isRelisted, true, 'isRelisted flag should be true');
        assert.strictEqual(newLot.originalLotId, originalLot.id, 'Should have a reference to the original lot');
        assert.strictEqual(newLot.auctionId, newAuction.id, 'Should be in the new auction');
        assert.strictEqual(newLot.price, 500, 'Price should be discounted by 50% from evaluation value');
    });

});
