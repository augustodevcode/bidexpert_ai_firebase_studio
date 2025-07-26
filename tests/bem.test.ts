// tests/bem.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { BemService } from '../src/services/bem.service';
import { prisma } from '../src/lib/prisma';
import type { BemFormData, SellerProfileInfo, LotCategory } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const bemService = new BemService();
const testRunId = `bem-e2e-${uuidv4().substring(0, 8)}`;
const testBemTitle = `Automóvel de Teste (Bem) ${testRunId}`;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let createdBemId: string | undefined;

test.describe('Bem Service E2E Tests', () => {

    test.before(async () => {
        // Ensure related test data is unique for this run
        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Bens ${testRunId}`, slug: `cat-bens-${testRunId}`, hasSubcategories: false }
        });
        testSeller = await prisma.seller.create({
            data: { name: `Comitente Teste Bens ${testRunId}`, publicId: `seller-pub-bem-${testRunId}`, slug: `comitente-bens-${testRunId}`, isJudicial: false }
        });
    });

    test.after(async () => {
        try {
            if (createdBemId) {
                await prisma.bem.delete({ where: { id: createdBemId } });
            }
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
        } catch (error) {
             console.error(`[BEM TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
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
        createdBemId = result.bemId;

        // Assert
        assert.strictEqual(result.success, true, 'BemService.createBem should return success: true');
        assert.ok(result.bemId, 'BemService.createBem should return a bemId');

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
