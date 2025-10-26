// tests/judicial-branch.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createJudicialBranch } from '../src/app/admin/judicial-branches/actions';
import { prisma } from '../src/lib/prisma';
import type { JudicialBranchFormData, Court, StateInfo, JudicialDistrict, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';


// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `branch-e2e-${uuidv4().substring(0, 8)}`;
const testBranchName = `Vara de Teste ${testRunId}`;
let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;
let testTenant: Tenant;
let adminUser: any;


describe('Judicial Branch Actions E2E Tests', () => {
    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-branch-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Branch Test ${testRunId}`,
            email: `admin-for-branch-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Create dependency records: State -> Court -> District
        const uf = testRunId.substring(0, 2).toUpperCase();
        testState = await prisma.state.create({
            data: { name: `Estado Varas ${testRunId}`, uf: uf, slug: `estado-varas-${testRunId}` }
        });
        testCourt = await prisma.court.create({
            data: { name: `Tribunal Varas ${testRunId}`, stateUf: uf, slug: `tribunal-varas-${testRunId}`, website: 'http://test.com' }
        });
        testDistrict = await prisma.judicialDistrict.create({
            data: { name: `Comarca Varas ${testRunId}`, slug: `comarca-varas-${testRunId}`, courtId: testCourt.id, stateId: testState.id }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.judicialBranch.deleteMany({ where: { name: testBranchName } });
            if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
            if (testState) await prisma.state.delete({ where: { id: testState.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[JUDICIAL BRANCH TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial branch via action and verify it', async () => {
        // Arrange
        const newBranchData: JudicialBranchFormData = {
            name: testBranchName,
            districtId: testDistrict.id,
            email: `vara.teste.${testRunId}@example.com`
        };

        // Act
        const result = await callActionAsUser(createJudicialBranch, adminUser, newBranchData);

        // Assert
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.branchId, 'Action should return a branchId');

        const createdBranchFromDb = await prisma.judicialBranch.findUnique({
            where: { id: result.branchId },
        });
        
        assert.ok(createdBranchFromDb, 'Branch should be found in the database');
        assert.strictEqual(createdBranchFromDb.name, newBranchData.name, 'Branch name should match');
        assert.strictEqual(createdBranchFromDb.districtId, newBranchData.districtId, 'Branch districtId should match');
    });
});
