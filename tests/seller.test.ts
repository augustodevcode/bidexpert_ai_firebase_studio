// tests/seller.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { SellerService } from '../src/services/seller.service';
import { prisma } from '../src/lib/prisma';
import type { SellerFormData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const sellerService = new SellerService();
const testRunId = `seller-e2e-${uuidv4().substring(0, 8)}`;
const testSellerEmail = `seller.teste.${testRunId}@example.com`;
const testSellerName = `Test Seller ${testRunId}`;
let tenant: any;


describe('Seller Service E2E Tests', () => {
    
    beforeAll(async () => {
        tenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-${testRunId}` } });
    });

    afterAll(async () => {
        try {
            await prisma.seller.deleteMany({
                where: { name: testSellerName }
            });
            await prisma.tenant.deleteMany({ where: { name: { contains: testRunId } } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    it('should create a new seller and verify it in the database', async () => {
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

        // Act
        const result = await sellerService.createSeller(tenant.id, newSellerData);

        // Assert
        assert.strictEqual(result.success, true, 'SellerService.createSeller should return success: true');
        assert.ok(result.sellerId, 'SellerService.createSeller should return a sellerId');

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
    });

});
