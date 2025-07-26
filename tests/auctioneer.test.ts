// tests/auctioneer.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { prisma } from '../src/lib/prisma';
import type { AuctioneerFormData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const auctioneerService = new AuctioneerService();
const testRunId = `auct-e2e-${uuidv4().substring(0,8)}`;
const testAuctioneerName = `Leiloeiro de Teste ${testRunId}`;
const testAuctioneerEmail = `leiloeiro.teste.${testRunId}@example.com`;

test.describe('Auctioneer Service E2E Tests', () => {

    test.beforeEach(async () => {
        // Clean up previous test runs to ensure a clean slate
        await prisma.auctioneer.deleteMany({
            where: { email: testAuctioneerEmail }
        });
    });
    
    test.after(async () => {
        try {
            await prisma.auctioneer.deleteMany({
                where: { email: testAuctioneerEmail }
            });
        } catch (error) {
            // Ignore errors during cleanup
        }
        await prisma.$disconnect();
    });

    test('should create a new auctioneer and verify it in the database', async () => {
        // Arrange
        const newAuctioneerData: AuctioneerFormData = {
            name: testAuctioneerName,
            registrationNumber: 'JUCESP/TEST/123',
            email: testAuctioneerEmail,
            phone: '11987654321',
        };

        // Act
        const result = await auctioneerService.createAuctioneer(newAuctioneerData);

        // Assert: Check the result of the service method
        assert.strictEqual(result.success, true, 'AuctioneerService.createAuctioneer should return success: true');
        assert.ok(result.auctioneerId, 'AuctioneerService.createAuctioneer should return an auctioneerId');

        // Assert: Verify directly in the database
        const createdAuctioneerFromDb = await prisma.auctioneer.findUnique({
            where: { id: result.auctioneerId },
        });

        assert.ok(createdAuctioneerFromDb, 'Auctioneer should be found in the database after creation');
        
        console.log('--- Auctioneer Record Found in DB ---');
        console.log(createdAuctioneerFromDb);
        console.log('-----------------------------------');

        assert.ok(createdAuctioneerFromDb.publicId, 'Auctioneer should have a publicId generated');
        assert.strictEqual(createdAuctioneerFromDb.name, newAuctioneerData.name, 'Auctioneer name should match');
        assert.strictEqual(createdAuctioneerFromDb.email, newAuctioneerData.email, 'Auctioneer email should match');
        assert.strictEqual(createdAuctioneerFromDb.registrationNumber, newAuctioneerData.registrationNumber, 'Auctioneer registration number should match');
    });

});
