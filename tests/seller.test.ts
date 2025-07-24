
// tests/seller.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { createSeller } from '../src/app/admin/sellers/actions';
import { prisma } from '../src/lib/prisma';
import type { SellerFormData } from '../src/types';

test.describe('Seller Service E2E Tests', () => {
    
    // Clean up any test data before and after tests
    test.after(async () => {
        try {
            await prisma.seller.deleteMany({
                where: { email: 'test.seller@example.com' }
            });
        } catch (error) {
            // Ignore errors during cleanup, as the test might have failed before creating the record
        }
        await prisma.$disconnect();
    });

    test('should create a new seller and verify it in the database', async () => {
        // Arrange: Define the test data for the new seller
        const newSellerData: SellerFormData = {
            name: 'Test Seller Inc.',
            contactName: 'John Doe',
            email: 'test.seller@example.com',
            phone: '1234567890',
            address: '123 Test St',
            city: 'Testville',
            state: 'TS',
            zipCode: '12345',
            website: 'https://testseller.example.com',
            isJudicial: false,
        };

        // Act: Call the createSeller server action
        const result = await createSeller(newSellerData);

        // Assert: Check the result of the action
        assert.strictEqual(result.success, true, 'createSeller action should return success: true');
        assert.ok(result.sellerId, 'createSeller action should return a sellerId');

        // Assert: Verify directly in the database
        const createdSellerFromDb = await prisma.seller.findUnique({
            where: { id: result.sellerId },
        });

        assert.ok(createdSellerFromDb, 'Seller should be found in the database');
        assert.ok(createdSellerFromDb.publicId, 'Seller should have a publicId generated');
        assert.strictEqual(createdSellerFromDb.name, newSellerData.name, 'Seller name should match');
        assert.strictEqual(createdSellerFromDb.email, newSellerData.email, 'Seller email should match');
        assert.strictEqual(createdSellerFromDb.isJudicial, newSellerData.isJudicial, 'Seller isJudicial flag should match');
    });

});
