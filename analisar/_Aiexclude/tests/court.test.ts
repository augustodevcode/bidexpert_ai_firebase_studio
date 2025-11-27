// tests/court.test.ts
import { describe, it, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createCourt } from '../src/app/admin/courts/actions';
import { prisma } from '../src/lib/prisma';
import type { CourtFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `court-e2e-${uuidv4().substring(0, 8)}`;
const testCourtName = `Tribunal de Teste ${testRunId}`;
let testTenant: Tenant;
let adminUser: any;


describe('Court Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-court-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Court Test ${testRunId}`,
            email: `admin-for-court-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        await prisma.court.deleteMany({ where: { name: testCourtName } });
    });
    
    afterAll(async () => {
        try {
            await prisma.court.deleteMany({ where: { name: testCourtName } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[COURT TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new court via action and verify it in the database', async () => {
        // Arrange
        const newCourtData: CourtFormData = {
            name: testCourtName,
            stateUf: 'TS',
            website: 'https://test-court.example.com'
        };

        // Act
        const result = await callActionAsUser(createCourt, adminUser, newCourtData);

        // Assert
        assert.strictEqual(result.success, true, 'createCourt action should return success: true');
        assert.ok(result.courtId, 'createCourt action should return a courtId');

        const createdCourtFromDb = await prisma.court.findUnique({
            where: { id: result.courtId },
        });

        assert.ok(createdCourtFromDb, 'Court should be found in the database after creation');
        assert.strictEqual(createdCourtFromDb.name, newCourtData.name, 'Court name should match');
        assert.strictEqual(createdCourtFromDb.stateUf, newCourtData.stateUf, 'Court stateUf should match');
    });
});
