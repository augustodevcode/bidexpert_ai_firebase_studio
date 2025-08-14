// tests/lot.test.ts
import { test, describe, beforeAll, afterAll, it } from 'vitest';
import assert from 'node:assert';
import { LotService } from '@/services/lot.service';
import { prisma } from '@/lib/prisma';
import type { LotFormData, Auction, Bem, SellerProfileInfo, AuctioneerProfileInfo, LotCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const lotService = new LotService();
const testRunId = uuidv4().substring(0, 8); // Unique ID for this test run

const testLotTitle = `Lote de Teste E2E ${testRunId}`;
let testAuction: any;
let testBem: any;
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdLotId: string | undefined;

describe('Lot Service E2E Tests', () => {

    beforeAll(async () => {
        // Use the unique testRunId to ensure data does not conflict with other tests
        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Lotes ${testRunId}`, slug: `cat-lotes-${testRunId}`, hasSubcategories: false }
        });
        testAuctioneer = await prisma.auctioneer.create({
            data: { name: `Leiloeiro Teste Lotes ${testRunId}`, publicId: `leiloeiro-lotes-${testRunId}`, slug: `leiloeiro-lotes-${testRunId}` }
        });
        testSeller = await prisma.seller.create({
            data: { name: `Comitente Teste Lotes ${testRunId}`, publicId: `seller-lotes-${testRunId}`, slug: `comitente-lotes-${testRunId}`, isJudicial: false }
        });
        
        testAuction = await prisma.auction.create({
            data: { 
                title: `Leilão de Teste para Lotes ${testRunId}`,
                publicId: `auc-lotes-${testRunId}`,
                slug: `leilao-teste-lotes-${testRunId}`,
                auctioneerId: testAuctioneer.id,
                sellerId: testSeller.id,
                status: 'ABERTO_PARA_LANCES',
                auctionDate: new Date(),
            }
        });
        
        testBem = await prisma.bem.create({
            data: {
                title: `Bem de Teste para Lote E2E ${testRunId}`,
                publicId: `bem-lotes-${testRunId}`,
                status: 'DISPONIVEL',
                categoryId: testCategory.id,
                sellerId: testSeller.id,
                evaluationValue: 1500.00
            }
        });
    });

    afterAll(async () => {
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

    it('should create a new lot with a bem and verify it in the database', async () => {
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

  