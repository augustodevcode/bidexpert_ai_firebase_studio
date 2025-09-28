// tests/subcategory.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createSubcategoryAction } from '../src/app/admin/subcategories/actions';
import { prisma } from '../src/lib/prisma';
import type { SubcategoryFormData, LotCategory, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `subcat-e2e-action-${uuidv4().substring(0, 8)}`;
const testCategoryName = `Categoria Pai ${testRunId}`;
const testSubcategoryName = `Subcategoria ${testRunId}`;
let testParentCategory: LotCategory;
let testTenant: Tenant;
let adminUser: any;


describe('Subcategory Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-subcat-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Subcat Test ${testRunId}`,
            email: `admin-for-subcat-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Create the parent category
        testParentCategory = await prisma.lotCategory.create({
            data: { 
                name: testCategoryName, 
                slug: `cat-pai-${testRunId}`, 
                hasSubcategories: false 
            }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.subcategory.deleteMany({ where: { name: testSubcategoryName } });
            await prisma.lotCategory.delete({ where: { id: testParentCategory.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[SUBCATEGORY TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new subcategory via action and verify it', async () => {
        // Arrange
        const newSubcategoryData: SubcategoryFormData = {
            name: testSubcategoryName,
            parentCategoryId: testParentCategory.id,
            description: 'Subcategoria para teste E2E via action.',
            displayOrder: 1,
            iconUrl: null,
            iconMediaId: null,
            dataAiHintIcon: null
        };

        // Act
        const result = await callActionAsUser(createSubcategoryAction, adminUser, newSubcategoryData);

        // Assert
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.subcategoryId, 'Action should return a subcategoryId');

        const createdSubcategoryFromDb = await prisma.subcategory.findUnique({
            where: { id: result.subcategoryId },
        });

        assert.ok(createdSubcategoryFromDb, 'Subcategory should be found in the database');
        assert.strictEqual(createdSubcategoryFromDb.name, newSubcategoryData.name, 'Subcategory name should match');
        assert.strictEqual(createdSubcategoryFromDb.parentCategoryId, testParentCategory.id, 'Subcategory parentCategoryId should match');

        const parentCategoryAfter = await prisma.lotCategory.findUnique({
            where: { id: testParentCategory.id }
        });
        assert.strictEqual(parentCategoryAfter?.hasSubcategories, true, 'Parent category hasSubcategories should be updated to true');
    });
});
