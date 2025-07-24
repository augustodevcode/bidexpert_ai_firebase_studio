// tests/lot.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { LotService } from '../src/services/lot.service';
import { prisma } from '../src/lib/prisma';
import type { LotFormData, Auction, Bem, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '../src/types';

const lotService = new LotService();
const testLotTitle = 'Lote de Teste E2E (Notebook Dell)';
let testAuction: any;
let testBem: any;
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdLotId: string | undefined;

test.describe('Lot Service E2E Tests', () => {

    test.before(async () => {
        testCategory = await prisma.lotCategory.create({
            data: { name: 'Categoria Teste para Lotes', slug: 'categoria-teste-lotes', hasSubcategories: false }
        });
        testAuctioneer = await prisma.auctioneer.create({
            data: { name: 'Leiloeiro de Teste para Lotes', publicId: 'leiloeiro-pub-id-lot-test', slug: 'leiloeiro-teste-lotes' }
        });
        testSeller = await prisma.seller.create({
            data: { name: 'Comitente de Teste para Lotes', publicId: 'seller-pub-id-lot-test', slug: 'comitente-teste-lotes', isJudicial: false }
        });
        
        testAuction = await prisma.auction.create({
            data: { 
                title: 'Leilão de Teste para Lotes',
                publicId: 'auc-pub-id-lot-test',
                slug: 'leilao-teste-lotes',
                auctioneerId: testAuctioneer.id,
                sellerId: testSeller.id,
                status: 'ABERTO_PARA_LANCES',
                auctionDate: new Date(),
            }
        });
        
        testBem = await prisma.bem.create({
            data: {
                title: 'Bem de Teste para Lote E2E',
                publicId: 'bem-pub-id-lot-test',
                status: 'DISPONIVEL',
                categoryId: testCategory.id,
                sellerId: testSeller.id,
                evaluationValue: 1500.00
            }
        });
    });

    test.after(async () => {
        try {
             if (createdLotId) {
                // The repository now handles the cascade deletion within a transaction
                await lotService.deleteLot(createdLotId);
            }
            // Clean up dependencies in reverse order of creation
            if (testBem) await prisma.bem.delete({ where: { id: testBem.id } });
            if (testAuction) await prisma.auction.delete({ where: { id: testAuction.id } });
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.delete({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            console.error("Cleanup error:", error);
        }
        await prisma.$disconnect();
    });

    test('should create a new lot with a bem and verify it in the database', async () => {
        // Arrange
        const newLotData: Partial<LotFormData> = {
            title: testLotTitle,
            number: '001-TEST',
            description: 'Um lote criado para o teste E2E, contendo um bem.',
            status: 'ABERTO_PARA_LANCES',
            auctionId: testAuction.id,
            price: 2000,
            initialPrice: 1500,
            type: testCategory.id, // 'type' no form é o nosso 'categoryId'
            bemIds: [testBem.id], // Link the bem
        };

        // Act
        const result = await lotService.createLot(newLotData);
        createdLotId = result.lotId; // Store for cleanup

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'LotService.createLot should return success: true');
        assert.ok(result.lotId, 'LotService.createLot should return a lotId');

        // Assert: Verify directly in the database
        const createdLotFromDb = await prisma.lot.findUnique({
            where: { id: result.lotId },
            include: { bens: true }
        });

        console.log('--- Lot Record Found in DB ---');
        console.log(createdLotFromDb);
        console.log('------------------------------');

        assert.ok(createdLotFromDb, 'Lot should be found in the database after creation');
        assert.ok(createdLotFromDb.publicId, 'Lot should have a publicId generated');
        assert.strictEqual(createdLotFromDb.title, newLotData.title, 'Lot title should match');
        assert.strictEqual(createdLotFromDb.auctionId, testAuction.id, 'Lot auctionId should match');
        assert.strictEqual(createdLotFromDb.bens.length, 1, 'Lot should be linked to 1 bem');
        
        const joinRecord = await prisma.lotBens.findFirst({
            where: {
                lotId: createdLotFromDb.id,
                bemId: testBem.id
            }
        });
        assert.ok(joinRecord, 'A record should exist in the LotBens join table');
    });
});
