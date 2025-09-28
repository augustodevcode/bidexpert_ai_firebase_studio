// tests/auctioneer.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createAuctioneer } from '../src/app/admin/auctioneers/actions';
import { prisma } from '../src/lib/prisma';
import type { AuctioneerFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `auct-e2e-${uuidv4().substring(0, 8)}`;
const testAuctioneerName = `Leiloeiro de Teste ${testRunId}`;
const testAuctioneerEmail = `leiloeiro.teste.${testRunId}@example.com`;
let testTenant: Tenant;
let adminUser: any;

describe('Auctioneer Actions E2E Tests', () => {

    beforeAll(async () => {
        // Create a dedicated tenant for this test run
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-auct-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Auctioneer Test ${testRunId}`,
            email: `admin-for-auctioneer-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
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

    it('should create a new auctioneer within a tenant context via server action and verify it', async () => {
        // Arrange
        const newAuctioneerData: AuctioneerFormData = {
            name: testAuctioneerName,
            registrationNumber: 'JUCESP/TEST/123',
            email: testAuctioneerEmail,
            phone: '11987654321',
        };

        // Act: Run the server action as the admin user
        const result = await callActionAsUser(createAuctioneer, adminUser, newAuctioneerData);

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
