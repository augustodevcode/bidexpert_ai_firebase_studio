
// tests/seller.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { createSeller } from '../src/app/admin/sellers/actions';
import { prisma } from '../src/lib/prisma';
import type { SellerFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { tenantContext } from '@/lib/prisma';

const testRunId = `seller-e2e-${uuidv4().substring(0, 8)}`;
const testSellerEmail = `seller.teste.${testRunId}@example.com`;
const testSellerName = `Test Seller ${testRunId}`;
let testTenant: Tenant;


describe('Seller Service E2E Tests via Actions', () => {
    
    beforeAll(async () => {
        // Create a dedicated tenant for this test run
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-seller-${testRunId}` } });
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

    it('should create a new seller within a tenant context and verify it in the database', async () => {
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

        // Act: Run the action within the tenant's context
        const result = await tenantContext.run({ tenantId: testTenant.id }, () => createSeller(newSellerData));
        

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
