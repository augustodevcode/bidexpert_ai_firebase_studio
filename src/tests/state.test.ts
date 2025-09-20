// tests/state.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createState } from '../src/app/admin/states/actions';
import { prisma } from '../src/lib/prisma';
import type { StateFormData, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `state-e2e-${uuidv4().substring(0, 8)}`;
const testStateName = `Estado de Teste ${testRunId}`;
const testStateUf = testRunId.substring(0, 2).toUpperCase();
let adminUser: any;
let testTenant: Tenant;

describe('State Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-state-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        const adminRes = await createUser({
            fullName: `Admin For State Test ${testRunId}`,
            email: `admin-for-state-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        await prisma.state.deleteMany({
            where: { OR: [{ uf: testStateUf }, {name: {contains: testRunId}}] }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.state.deleteMany({
                where: { OR: [{ uf: testStateUf }, {name: {contains: testRunId}}] }
            });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[STATE TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new state via action and verify it in the database', async () => {
        // Arrange
        const newStateData: StateFormData = {
            name: testStateName,
            uf: testStateUf,
        };

        // Act
        const result = await callActionAsUser(createState, adminUser, newStateData);

        // Assert
        assert.strictEqual(result.success, true, 'createState action should return success: true');
        assert.ok(result.stateId, 'createState action should return a stateId');

        const createdStateFromDb = await prisma.state.findUnique({
            where: { id: result.stateId },
        });
        
        assert.ok(createdStateFromDb, 'State should be found in the database');
        assert.strictEqual(createdStateFromDb.name, newStateData.name, 'State name should match');
        assert.strictEqual(createdStateFromDb.uf, newStateData.uf.toUpperCase(), 'State UF should match and be uppercase');
        assert.ok(createdStateFromDb.slug, 'State slug should be generated');
    });

    it('should prevent creating a state with a duplicate UF via action', async () => {
        // Arrange: Create the first state
        const firstStateUf = `DU${testRunId.substring(0,1)}`;
        await prisma.state.deleteMany({ where: { uf: firstStateUf } });
        const firstStateData: StateFormData = { name: `${testStateName} Original`, uf: firstStateUf };
        await callActionAsUser(createState, adminUser, firstStateData);
        
        // Arrange: Prepare data for the second state with the same UF
        const duplicateStateData: StateFormData = { name: `${testStateName} Duplicado`, uf: firstStateUf };

        // Act: Attempt to create the second state via the action
        const result = await callActionAsUser(createState, adminUser, duplicateStateData);

        // Assert
        assert.strictEqual(result.success, false, 'Should fail to create a state with a duplicate UF');
        assert.strictEqual(result.message, `Já existe um estado com a UF '${firstStateUf}'.`);
    });
});
