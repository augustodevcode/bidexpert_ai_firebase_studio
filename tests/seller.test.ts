// tests/seller.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { SellerService } from '../src/services/seller.service';
import { prisma } from '../src/lib/prisma';
import type { SellerFormData } from '../src/types';

const sellerService = new SellerService();

test.describe('Seller Service E2E Tests', () => {
    
    // Clean up any test data before and after tests
    test.after(async () => {
        try {
            await prisma.seller.deleteMany({
                where: { email: 'test.seller.service@example.com' }
            });
        } catch (error) {
            // Ignore errors during cleanup
        }
        await prisma.$disconnect();
    });

    test('should create a new seller and verify it in the database', async () => {
        // Arrange: Define the test data for the new seller
        const newSellerData: SellerFormData = {
            name: 'Test Service Seller Inc.',
            contactName: 'Jane Doe',
            email: 'test.seller.service@example.com',
            phone: '9876543210',
            address: '456 Test Ave',
            city: 'Testburg',
            state: 'TS',
            zipCode: '54321',
            website: 'https://testserviceseller.example.com',
            isJudicial: false,
        };

        // Act: Call the SellerService directly
        const result = await sellerService.createSeller(newSellerData);

        // Assert: Check the result of the service method
        assert.strictEqual(result.success, true, 'SellerService.createSeller should return success: true');
        assert.ok(result.sellerId, 'SellerService.createSeller should return a sellerId');

        // Assert: Verify directly in the database
        const createdSellerFromDb = await prisma.seller.findUnique({
            where: { id: result.sellerId },
        });

        // Log the created record for debugging purposes
        console.log('--- Seller Record Found in DB ---');
        console.log(createdSellerFromDb);
        console.log('---------------------------------');

        assert.ok(createdSellerFromDb, 'Seller should be found in the database after creation');
        assert.ok(createdSellerFromDb.publicId, 'Seller should have a publicId generated');
        assert.strictEqual(createdSellerFromDb.name, newSellerData.name, 'Seller name should match');
        assert.strictEqual(createdSellerFromDb.email, newSellerData.email, 'Seller email should match');
        assert.strictEqual(createdSellerFromDb.isJudicial, newSellerData.isJudicial, 'Seller isJudicial flag should match');
    });

});
