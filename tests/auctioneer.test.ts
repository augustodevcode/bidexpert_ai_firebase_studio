// tests/auctioneer.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { prisma } from '../src/lib/prisma';
import type { AuctioneerFormData } from '../src/types';

const auctioneerService = new AuctioneerService();

test.describe('Auctioneer Service E2E Tests', () => {
    
    // Clean up any test data before and after tests
    test.after(async () => {
        try {
            await prisma.auctioneer.deleteMany({
                where: { email: 'test.auctioneer.service@example.com' }
            });
        } catch (error) {
            // Ignore errors during cleanup, as the test might have failed before creation
        }
        await prisma.$disconnect();
    });

    test('should create a new auctioneer and verify it in the database', async () => {
        // Arrange: Define the test data for the new auctioneer
        const newAuctioneerData: AuctioneerFormData = {
            name: 'Test Service Auctioneer',
            registrationNumber: 'JUCESP/TEST/123',
            email: 'test.auctioneer.service@example.com',
            phone: '11987654321',
        };

        // Act: Call the AuctioneerService directly to create the auctioneer
        const result = await auctioneerService.createAuctioneer(newAuctioneerData);

        // Assert: Check the result of the service method
        assert.strictEqual(result.success, true, 'AuctioneerService.createAuctioneer should return success: true');
        assert.ok(result.auctioneerId, 'AuctioneerService.createAuctioneer should return an auctioneerId');

        // Assert: Verify directly in the database
        const createdAuctioneerFromDb = await prisma.auctioneer.findUnique({
            where: { id: result.auctioneerId },
        });

        assert.ok(createdAuctioneerFromDb, 'Auctioneer should be found in the database after creation');
        
        // Log the created record for debugging purposes
        console.log('--- Auctioneer Record Found in DB ---');
        console.log(createdAuctioneerFromDb);
        console.log('-----------------------------------');

        assert.ok(createdAuctioneerFromDb.publicId, 'Auctioneer should have a publicId generated');
        assert.strictEqual(createdAuctioneerFromDb.name, newAuctioneerData.name, 'Auctioneer name should match');
        assert.strictEqual(createdAuctioneerFromDb.email, newAuctioneerData.email, 'Auctioneer email should match');
        assert.strictEqual(createdAuctioneerFromDb.registrationNumber, newAuctioneerData.registrationNumber, 'Auctioneer registration number should match');
    });

});
