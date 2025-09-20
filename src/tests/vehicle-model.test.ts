// tests/vehicle-model.test.ts
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createVehicleMake } from '@/app/admin/vehicle-makes/actions';
import { createVehicleModel } from '@/app/admin/vehicle-models/actions';
import type { VehicleModelFormData } from '@/app/admin/vehicle-models/form-schema';
import type { VehicleMake, Tenant } from '@/types';
import { callActionAsUser } from './test-utils';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `model-e2e-action-${uuidv4().substring(0, 8)}`;
const testModelName = `Modelo Teste ${testRunId}`;
let testMake: VehicleMake;
let adminUser: any;
let testTenant: Tenant;


describe('VehicleModel Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `model-test-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin Model Test ${testRunId}`,
            email: `admin-model-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user");
        adminUser = await getUserProfileData(adminRes.userId);
        
        const makeRes = await callActionAsUser(createVehicleMake, adminUser, { name: `Marca para Modelo ${testRunId}`});
        assert.ok(makeRes.success && makeRes.makeId);
        testMake = (await prisma.vehicleMake.findUnique({ where: { id: makeRes.makeId } }))!;
    });
    
    afterAll(async () => {
        try {
            await prisma.vehicleModel.deleteMany({ where: { name: { contains: testRunId } } });
            if (testMake) {
                await prisma.vehicleMake.delete({ where: { id: testMake.id } });
            }
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[VehicleModel TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new vehicle model linked to a make via action', async () => {
        // Arrange
        const newModelData: VehicleModelFormData = {
            name: testModelName,
            makeId: testMake.id,
        };

        // Act
        const result = await callActionAsUser(createVehicleModel, adminUser, newModelData);

        // Assert
        assert.ok(result.success, 'createVehicleModel action should return success: true');
        assert.ok(result.modelId, 'createVehicleModel action should return a modelId');

        const createdModelFromDb = await prisma.vehicleModel.findUnique({
            where: { id: result.modelId },
            include: { make: true }
        });

        assert.ok(createdModelFromDb, 'Model should be found in the database');
        assert.strictEqual(createdModelFromDb.name, newModelData.name, 'Model name should match');
        assert.strictEqual(createdModelFromDb.makeId, testMake.id, 'Model makeId should match');
        assert.strictEqual(createdModelFromDb.make.name, testMake.name, 'Associated make name should be correct');
    });
});
