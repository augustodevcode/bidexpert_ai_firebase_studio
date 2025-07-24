// tests/subcategory.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { SubcategoryService } from '../src/services/subcategory.service';
import { prisma } from '../src/lib/prisma';
import type { SubcategoryFormData, LotCategory } from '../src/types';

const subcategoryService = new SubcategoryService();
const testCategoryName = 'Categoria Pai para Teste de Sub';
const testSubcategoryName = 'Subcategoria de Teste E2E';
let testParentCategory: LotCategory;

test.describe('Subcategory Service E2E Tests', () => {

    test.before(async () => {
        // Create the parent category
        testParentCategory = await prisma.lotCategory.create({
            data: { 
                name: testCategoryName, 
                slug: 'categoria-pai-teste-sub', 
                hasSubcategories: false 
            }
        });
    });
    
    test.after(async () => {
        try {
            await prisma.subcategory.deleteMany({
                where: { name: testSubcategoryName }
            });
            await prisma.lotCategory.delete({
                where: { id: testParentCategory.id }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new subcategory and verify it', async () => {
        // Arrange
        const newSubcategoryData: SubcategoryFormData = {
            name: testSubcategoryName,
            parentCategoryId: testParentCategory.id,
            description: 'Subcategoria para teste E2E.',
            displayOrder: 1,
        };

        // Act
        const result = await subcategoryService.createSubcategory(newSubcategoryData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.subcategoryId, 'Service should return a subcategoryId');

        // Assert: Verify directly in the database
        const createdSubcategoryFromDb = await prisma.subcategory.findUnique({
            where: { id: result.subcategoryId },
        });

        console.log('--- Subcategory Record Found in DB ---');
        console.log(createdSubcategoryFromDb);
        console.log('------------------------------------');
        
        assert.ok(createdSubcategoryFromDb, 'Subcategory should be found in the database');
        assert.strictEqual(createdSubcategoryFromDb.name, newSubcategoryData.name, 'Subcategory name should match');
        assert.strictEqual(createdSubcategoryFromDb.parentCategoryId, testParentCategory.id, 'Subcategory parentCategoryId should match');

        // Also verify that the parent category was updated
        const parentCategoryAfter = await prisma.lotCategory.findUnique({
            where: { id: testParentCategory.id }
        });
        assert.strictEqual(parentCategoryAfter?.hasSubcategories, true, 'Parent category hasSubcategories should be updated to true');
    });
});
