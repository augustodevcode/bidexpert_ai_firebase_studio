// tests/subcategory.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { SubcategoryService } from '../src/services/subcategory.service';
import { prisma } from '../src/lib/prisma';
import type { SubcategoryFormData, LotCategory } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const subcategoryService = new SubcategoryService();
const testRunId = `subcat-e2e-${uuidv4().substring(0, 8)}`;
const testCategoryName = `Categoria Pai ${testRunId}`;
const testSubcategoryName = `Subcategoria ${testRunId}`;
let testParentCategory: LotCategory;

test.describe('Subcategory Service E2E Tests', () => {

    test.before(async () => {
        // Create the parent category
        testParentCategory = await prisma.lotCategory.create({
            data: { 
                name: testCategoryName, 
                slug: `cat-pai-${testRunId}`, 
                hasSubcategories: false 
            }
        });
    });
    
    test.after(async () => {
        try {
            await prisma.subcategory.deleteMany({ where: { name: testSubcategoryName } });
            await prisma.lotCategory.delete({ where: { id: testParentCategory.id } });
        } catch (error) {
            console.error(`[SUBCATEGORY TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
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

        // Assert
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.subcategoryId, 'Service should return a subcategoryId');

        const createdSubcategoryFromDb = await prisma.subcategory.findUnique({
            where: { id: result.subcategoryId },
        });

        console.log('--- Subcategory Record Found in DB ---');
        console.log(createdSubcategoryFromDb);
        console.log('------------------------------------');
        
        assert.ok(createdSubcategoryFromDb, 'Subcategory should be found in the database');
        assert.strictEqual(createdSubcategoryFromDb.name, newSubcategoryData.name, 'Subcategory name should match');
        assert.strictEqual(createdSubcategoryFromDb.parentCategoryId, testParentCategory.id, 'Subcategory parentCategoryId should match');

        const parentCategoryAfter = await prisma.lotCategory.findUnique({
            where: { id: testParentCategory.id }
        });
        assert.strictEqual(parentCategoryAfter?.hasSubcategories, true, 'Parent category hasSubcategories should be updated to true');
    });
});
