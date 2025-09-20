// tests/seller.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createSeller } from '../src/app/admin/sellers/actions';
import { prisma } from '../src/lib/prisma';
import type { SellerFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { tenantContext } from '@/lib/prisma';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `seller-e2e-${uuidv4().substring(0, 8)}`;
const testSellerEmail = `seller.teste.${testRunId}@example.com`;
const testSellerName = `Test Seller ${testRunId}`;
let testTenant: Tenant;
let adminUser: any;

describe('Seller Actions E2E Tests', () => {
    
    beforeAll(async () => {
        // Create a dedicated tenant for this test run
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-seller-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Seller Test ${testRunId}`,
            email: `admin-for-seller-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
    });

    afterAll(async () => {
        try {
            await prisma.seller.deleteMany({
                where: { name: testSellerName, tenantId: testTenant.id }
            });
             await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[SELLER TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new seller within a tenant context via server action and verify it', async () => {
        // Arrange
        const newSellerData: SellerFormData = {
            name: testSellerName,
            contactName: 'Jane Doe',
            email: testSellerEmail,
            phone: '9876543210',
            address: '456 Test Ave',
            city: 'Testburg',
            state: 'TS',
            zipCode: '54321',
            website: 'https://testserviceseller.example.com',
            isJudicial: false,
        };

        // Act: Run the action as the admin user
        const result = await callActionAsUser(createSeller, adminUser, newSellerData);
        
        // Assert
        assert.strictEqual(result.success, true, 'createSeller action should return success: true');
        assert.ok(result.sellerId, 'createSeller action should return a sellerId');

        const createdSellerFromDb = await prisma.seller.findUnique({
            where: { id: result.sellerId },
        });

        assert.ok(createdSellerFromDb, 'Seller should be found in the database after creation');
        console.log('--- Seller Record Found in DB ---');
        console.log(createdSellerFromDb);
        console.log('---------------------------------');

        assert.ok(createdSellerFromDb.publicId, 'Seller should have a publicId generated');
        assert.strictEqual(createdSellerFromDb.name, newSellerData.name, 'Seller name should match');
        assert.strictEqual(createdSellerFromDb.email, newSellerData.email, 'Seller email should match');
        assert.strictEqual(createdSellerFromDb.isJudicial, newSellerData.isJudicial, 'Seller isJudicial flag should match');
        assert.strictEqual(createdSellerFromDb.tenantId, testTenant.id, 'Seller tenantId should match the context');
    });

});
