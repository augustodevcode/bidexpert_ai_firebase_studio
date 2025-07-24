// tests/bem.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { BemService } from '../src/services/bem.service';
import { prisma } from '../src/lib/prisma';
import type { BemFormData, SellerProfileInfo, LotCategory } from '../src/types';
import { slugify } from '@/lib/sample-data-helpers';

const bemService = new BemService();
const testBemTitle = 'Automóvel de Teste E2E (Bem)';
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;

test.describe('Bem Service E2E Tests', () => {

    test.before(async () => {
        // Create dependency records
        testCategory = await prisma.lotCategory.create({
            data: { name: 'Categoria Teste para Bens', slug: 'categoria-teste-bens', hasSubcategories: false }
        });
        testSeller = await prisma.seller.create({
            data: { name: 'Comitente Teste para Bens', publicId: 'seller-pub-id-bem-test', slug: 'comitente-teste-bens', isJudicial: false }
        });
    });

    test.after(async () => {
        try {
            await prisma.bem.deleteMany({ where: { title: testBemTitle }});
            await prisma.seller.delete({ where: { id: testSeller.id } });
            await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new bem and verify it in the database', async () => {
        // Arrange
        const newBemData: BemFormData = {
            title: testBemTitle,
            description: 'Um bem criado para o teste E2E.',
            status: 'DISPONIVEL',
            categoryId: testCategory.id,
            sellerId: testSeller.id,
            evaluationValue: 50000,
        };

        // Act
        const result = await bemService.createBem(newBemData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'BemService.createBem should return success: true');
        assert.ok(result.bemId, 'BemService.createBem should return a bemId');

        // Assert: Verify directly in the database
        const createdBemFromDb = await prisma.bem.findUnique({
            where: { id: result.bemId },
        });

        console.log('--- Bem Record Found in DB ---');
        console.log(createdBemFromDb);
        console.log('------------------------------');

        assert.ok(createdBemFromDb, 'Bem should be found in the database after creation');
        assert.ok(createdBemFromDb.publicId, 'Bem should have a publicId generated');
        assert.strictEqual(createdBemFromDb.title, newBemData.title, 'Bem title should match');
        assert.strictEqual(createdBemFromDb.status, 'DISPONIVEL', 'Bem status should be correct');
        assert.strictEqual(createdBemFromDb.sellerId, testSeller.id, 'Bem sellerId should match');
    });
});
