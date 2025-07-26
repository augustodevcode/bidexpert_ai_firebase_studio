// tests/auction.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { AuctionService } from '../src/services/auction.service';
import { prisma } from '../src/lib/prisma';
import type { AuctionFormData, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const auctionService = new AuctionService();
const testRunId = `auction-e2e-${uuidv4().substring(0, 8)}`;
const testAuctionTitle = `Super Leilão de Teste ${testRunId}`;

let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdAuctionId: string | undefined;

test.describe('Auction Service E2E Tests', () => {

    test.before(async () => {
        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Starting...`);
        // Clean up previous test runs to ensure a clean slate
        await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });

        // Create dependency records
        testCategory = await prisma.lotCategory.create({
            data: { name: `Cat. Leilões ${testRunId}`, slug: `cat-leiloes-${testRunId}`, hasSubcategories: false }
        });
        testAuctioneer = await prisma.auctioneer.create({
            data: { name: `Leiloeiro Leilões ${testRunId}`, publicId: `leiloeiro-pub-${testRunId}`, slug: `leiloeiro-leiloes-${testRunId}` }
        });
        testSeller = await prisma.seller.create({
            data: { name: `Comitente Leilões ${testRunId}`, publicId: `seller-pub-${testRunId}`, slug: `comitente-leiloes-${testRunId}`, isJudicial: false }
        });
        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Complete.`);
    });

    test.after(async () => {
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdAuctionId) {
                await prisma.auction.deleteMany({ where: { id: createdAuctionId }});
            }
            if (testSeller) await prisma.seller.deleteMany({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.deleteMany({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.deleteMany({ where: { id: testCategory.id } });
        } catch (error) {
            console.error(`[AUCTION TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Complete.`);
    });

    test('should create a new auction and verify it in the database', async () => {
        // Arrange
        const newAuctionData: Partial<AuctionFormData> = {
            title: testAuctionTitle,
            description: 'Um leilão criado para o teste E2E.',
            status: 'EM_BREVE',
            auctionDate: new Date(),
            auctioneerId: testAuctioneer.id,
            sellerId: testSeller.id,
            categoryId: testCategory.id,
            auctionType: 'EXTRAJUDICIAL',
        };

        // Act
        const result = await auctionService.createAuction(newAuctionData);
        createdAuctionId = result.auctionId; // Store for cleanup

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'AuctionService.createAuction should return success: true');
        assert.ok(result.auctionId, 'AuctionService.createAuction should return an auctionId');

        // Assert: Verify directly in the database
        const createdAuctionFromDb = await prisma.auction.findUnique({
            where: { id: result.auctionId },
        });

        console.log('--- Auction Record Found in DB ---');
        console.log(createdAuctionFromDb);
        console.log('---------------------------------');

        assert.ok(createdAuctionFromDb, 'Auction should be found in the database after creation');
        assert.ok(createdAuctionFromDb.publicId, 'Auction should have a publicId generated');
        assert.strictEqual(createdAuctionFromDb.title, newAuctionData.title, 'Auction title should match');
        assert.strictEqual(createdAuctionFromDb.status, 'EM_BREVE', 'Auction status should be correct');
        assert.strictEqual(createdAuctionFromDb.sellerId, testSeller.id, 'Auction sellerId should match');
        assert.strictEqual(createdAuctionFromDb.auctioneerId, testAuctioneer.id, 'Auction auctioneerId should match');
    });
});
