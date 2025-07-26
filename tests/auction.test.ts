// tests/auction.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { AuctionService } from '../src/services/auction.service';
import { prisma } from '../src/lib/prisma';
import type { AuctionFormData, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const auctionService = new AuctionService();
const testRunId = uuidv4().substring(0, 8); // Unique ID for this test run
const testAuctionTitle = `Super Leilão de Teste E2E ${testRunId}`;
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;

test.describe('Auction Service E2E Tests', () => {

    test.before(async () => {
        // Create dependency records
        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Leilões ${testRunId}`, slug: `cat-leiloes-${testRunId}`, hasSubcategories: false }
        });
        testAuctioneer = await prisma.auctioneer.create({
            data: { name: `Leiloeiro Teste Leilões ${testRunId}`, publicId: `leiloeiro-pub-id-leilao-test-${testRunId}`, slug: `leiloeiro-teste-leiloes-${testRunId}` }
        });
        testSeller = await prisma.seller.create({
            data: { name: `Comitente Teste Leilões ${testRunId}`, publicId: `seller-pub-id-leilao-test-${testRunId}`, slug: `comitente-teste-leiloes-${testRunId}`, isJudicial: false }
        });
    });

    test.after(async () => {
        try {
            await prisma.auction.deleteMany({ where: { title: testAuctionTitle }});
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
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
