// tests/direct-sale-offer.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { DirectSaleOfferService } from '@/services/direct-sale-offer.service';
import type { DirectSaleOfferFormData, SellerProfileInfo, LotCategory } from '@/types';

const offerService = new DirectSaleOfferService();
const testRunId = `dso-e2e-${uuidv4().substring(0, 8)}`;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let createdOfferId: string | undefined;

describe('Direct Sale Offer Service E2E Tests', () => {

    beforeAll(async () => {
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat DSO ${testRunId}`, slug: `cat-dso-${testRunId}`, hasSubcategories: false } });
        testSeller = await prisma.seller.create({ data: { name: `Seller DSO ${testRunId}`, publicId: `seller-pub-dso-${testRunId}`, slug: `seller-dso-${testRunId}`, isJudicial: false } });
    });

    afterAll(async () => {
        try {
            if (createdOfferId) await offerService.deleteDirectSaleOffer(createdOfferId);
            await prisma.seller.delete({ where: { id: testSeller.id } });
            await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            console.error(`[DSO TEST CLEANUP] - Failed to delete records for run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new direct sale offer and verify it', async () => {
        // Arrange
        const newOfferData: DirectSaleOfferFormData = {
            title: `Item de Venda Direta ${testRunId}`,
            description: 'Item de teste para venda direta.',
            offerType: 'BUY_NOW',
            status: 'ACTIVE',
            price: 150.00,
            categoryId: testCategory.id,
            sellerId: testSeller.id,
        };

        // Act
        const result = await offerService.createDirectSaleOffer(newOfferData);
        createdOfferId = result.offerId;

        // Assert
        assert.ok(result.success, 'createDirectSaleOffer should succeed');
        assert.ok(result.offerId, 'A new offerId should be returned');

        const createdOffer = await prisma.directSaleOffer.findUnique({ where: { id: result.offerId } });
        assert.ok(createdOffer, 'Created offer should be found in DB');
        assert.strictEqual(createdOffer.title, newOfferData.title);
        assert.strictEqual(createdOffer.price, 150.00);
        assert.strictEqual(createdOffer.sellerId, testSeller.id);
    });
});
