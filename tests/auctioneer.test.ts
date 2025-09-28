
// tests/auctioneer.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { createAuctioneer } from '../src/app/admin/auctioneers/actions';
import { prisma } from '../src/lib/prisma';
import type { AuctioneerFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { tenantContext } from '@/lib/prisma';

const testRunId = `auct-e2e-${uuidv4().substring(0, 8)}`;
const testAuctioneerName = `Leiloeiro de Teste ${testRunId}`;
const testAuctioneerEmail = `leiloeiro.teste.${testRunId}@example.com`;
let testTenant: Tenant;

describe('Auctioneer Service E2E Tests via Actions', () => {

    beforeAll(async () => {
        // Create a dedicated tenant for this test run
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-auct-${testRunId}` } });
    });

    afterAll(async () => {
        try {
            await prisma.auctioneer.deleteMany({
                where: { email: testAuctioneerEmail }
            });
            await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[AUCTIONEER TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new auctioneer within a tenant context and verify it', async () => {
        // Arrange
        const newAuctioneerData: AuctioneerFormData = {
            name: testAuctioneerName,
            registrationNumber: 'JUCESP/TEST/123',
            email: testAuctioneerEmail,
            phone: '11987654321',
        };

        // Act: Run the server action within the tenant's context
        const result = await tenantContext.run({ tenantId: testTenant.id }, () => createAuctioneer(newAuctioneerData));

        // Assert: Check the result of the action
        assert.strictEqual(result.success, true, 'createAuctioneer action should return success: true');
        assert.ok(result.auctioneerId, 'createAuctioneer action should return an auctioneerId');

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
        assert.strictEqual(createdAuctioneerFromDb.tenantId, testTenant.id, 'Auctioneer tenantId should match the context');
    });

});
