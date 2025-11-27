// tests/category.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createLotCategory } from '../src/app/admin/categories/actions';
import { prisma } from '../src/lib/prisma';
import type { LotCategory, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `cat-e2e-action-${uuidv4().substring(0, 8)}`;
const testCategoryName = `Categoria de Teste ${testRunId}`;
const testCategorySlug = `categoria-de-teste-${testRunId}`;
let testTenant: Tenant;
let adminUser: any;


describe('Category Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-cat-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Cat Test ${testRunId}`,
            email: `admin-for-cat-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);

        await prisma.lotCategory.deleteMany({
            where: { slug: testCategorySlug }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.lotCategory.deleteMany({ where: { name: testCategoryName } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
             console.error(`[CATEGORY TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new category via action and verify it in the database', async () => {
        // Arrange
        const newCategoryData = {
            name: testCategoryName,
            description: 'Uma categoria criada para fins de teste via action.',
        };

        // Act
        const result = await callActionAsUser(createLotCategory, adminUser, newCategoryData);

        // Assert
        assert.strictEqual(result.success, true, 'createLotCategory action should return success: true');
        assert.ok(result.categoryId, 'createLotCategory action should return a categoryId');

        const createdCategoryFromDb = await prisma.lotCategory.findUnique({
            where: { id: result.categoryId },
        });

        console.log('--- Category Record Found in DB ---');
        console.log(createdCategoryFromDb);
        console.log('-----------------------------------');
        
        assert.ok(createdCategoryFromDb, 'Category should be found in the database after creation');
        assert.strictEqual(createdCategoryFromDb.name, newCategoryData.name, 'Category name should match');
        assert.strictEqual(createdCategoryFromDb.slug, testCategorySlug, 'Category slug should be correctly generated');
    });

});
