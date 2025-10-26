// tests/city.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { createCity } from '../src/app/admin/cities/actions';
import { prisma } from '../src/lib/prisma';
import type { CityFormData, StateInfo, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';


// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `city-e2e-${uuidv4().substring(0, 8)}`;
const testCityName = `Cidade de Teste ${testRunId}`;
const testStateName = `Estado para Cidades ${testRunId}`;
const testStateUf = testRunId.substring(0, 2).toUpperCase();
let testState: StateInfo;
let testTenant: Tenant;
let adminUser: any;


describe('City Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-city-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For City Test ${testRunId}`,
            email: `admin-for-city-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Create the necessary State dependency
        await prisma.state.deleteMany({ where: { uf: testStateUf } });
        testState = await prisma.state.create({
            data: { name: testStateName, uf: testStateUf, slug: `estado-para-cidades-${testRunId}` }
        });
    });

    afterAll(async () => {
        try {
            await prisma.city.deleteMany({ where: { name: testCityName }});
            if (testState) await prisma.state.delete({ where: { id: testState.id }});
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[CITY TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new city via action and verify it in the database', async () => {
        // Arrange
        const newCityData: CityFormData = {
            name: testCityName,
            stateId: testState.id,
            ibgeCode: testRunId.replace(/-/g, '').substring(0, 7),
        };

        // Act
        const result = await callActionAsUser(createCity, adminUser, newCityData);

        // Assert
        assert.strictEqual(result.success, true, 'createCity action should return success: true');
        assert.ok(result.cityId, 'createCity action should return a cityId');

        const createdCityFromDb = await prisma.city.findUnique({
            where: { id: result.cityId },
        });

        assert.ok(createdCityFromDb, 'City should be found in the database after creation');
        assert.strictEqual(createdCityFromDb.name, newCityData.name, 'City name should match');
        assert.strictEqual(createdCityFromDb.stateId, testState.id, 'City stateId should match');
        assert.strictEqual(createdCityFromDb.stateUf, testState.uf, 'City stateUf should be correctly denormalized');
        assert.strictEqual(createdCityFromDb.ibgeCode, newCityData.ibgeCode, 'City ibgeCode should match');
    });
});
