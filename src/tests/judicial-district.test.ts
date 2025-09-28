// tests/judicial-district.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createJudicialDistrict } from '../src/app/admin/judicial-districts/actions';
import { prisma } from '../src/lib/prisma';
import type { JudicialDistrictFormData, Court, StateInfo, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `district-e2e-${uuidv4().substring(0, 8)}`;
const testDistrictName = `Comarca de Teste E2E ${testRunId}`;
let testCourt: Court;
let testState: StateInfo;
let testTenant: Tenant;
let adminUser: any;

describe('Judicial District Actions E2E Tests', () => {
    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-district-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For District Test ${testRunId}`,
            email: `admin-for-district-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Create dependency records
        testCourt = await prisma.court.create({
            data: { name: `Tribunal Teste Comarcas ${testRunId}`, stateUf: 'TS', slug: `trib-comarcas-${testRunId}`, website: 'http://test.com' }
        });
        testState = await prisma.state.create({
            data: { name: `Estado Teste Comarcas ${testRunId}`, uf: `T${testRunId.substring(0,1)}`, slug: `est-comarcas-${testRunId}` }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.judicialDistrict.deleteMany({ where: { name: testDistrictName } });
            if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
            if (testState) await prisma.state.delete({ where: { id: testState.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[JUDICIAL DISTRICT TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial district via action and verify it', async () => {
        // Arrange
        const newDistrictData: JudicialDistrictFormData = {
            name: testDistrictName,
            courtId: testCourt.id,
            stateId: testState.id,
            zipCode: '12345-678',
        };

        // Act
        const result = await callActionAsUser(createJudicialDistrict, adminUser, newDistrictData);

        // Assert
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.districtId, 'Action should return a districtId');

        const createdDistrictFromDb = await prisma.judicialDistrict.findUnique({
            where: { id: result.districtId },
        });

        assert.ok(createdDistrictFromDb, 'District should be found in the database');
        assert.strictEqual(createdDistrictFromDb.name, newDistrictData.name, 'District name should match');
        assert.strictEqual(createdDistrictFromDb.courtId, newDistrictData.courtId, 'District courtId should match');
        assert.strictEqual(createdDistrictFromDb.stateId, newDistrictData.stateId, 'District stateId should match');
    });
});
