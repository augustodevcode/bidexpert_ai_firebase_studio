// tests/category.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { CategoryService } from '../src/services/category.service';
import { prisma } from '../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const categoryService = new CategoryService();
const testRunId = `cat-e2e-${uuidv4().substring(0, 8)}`;
const testCategoryName = `Categoria de Teste ${testRunId}`;
const testCategorySlug = `categoria-de-teste-${testRunId}`;

test.describe('Category Service E2E Tests', () => {

    // Before each test, ensure no conflicting category exists
    test.beforeEach(async () => {
        await prisma.lotCategory.deleteMany({
            where: { slug: testCategorySlug }
        });
    });
    
    test.after(async () => {
        try {
            await prisma.lotCategory.deleteMany({
                where: { name: testCategoryName }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new category and verify it in the database', async () => {
        // Arrange
        const newCategoryData = {
            name: testCategoryName,
            description: 'Uma categoria criada para fins de teste.',
        };

        // Act
        const result = await categoryService.createCategory(newCategoryData);

        // Assert: Check the result of the service method
        assert.strictEqual(result.success, true, 'CategoryService.createCategory should return success: true');
        assert.ok(result.categoryId, 'CategoryService.createCategory should return a categoryId');

        // Assert: Verify directly in the database
        const createdCategoryFromDb = await prisma.lotCategory.findUnique({
            where: { id: result.categoryId },
        });

        console.log('--- Category Record Found in DB ---');
        console.log(createdCategoryFromDb);
        console.log('-----------------------------------');
        
        assert.ok(createdCategoryFromDb, 'Category should be found in the database after creation');
        assert.strictEqual(createdCategoryFromDb.name, newCategoryData.name, 'Category name should match');
        assert.strictEqual(createdCategoryFromDb.slug, testCategorySlug, 'Category slug should be correctly generated');
        assert.strictEqual(createdCategoryFromDb.description, newCategoryData.description, 'Category description should match');
    });

});
