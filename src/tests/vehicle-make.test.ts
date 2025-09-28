// tests/vehicle-make.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createVehicleMake } from '@/app/admin/vehicle-makes/actions';
import type { VehicleMakeFormData, Tenant } from '@/app/admin/vehicle-makes/form-schema';
import { callActionAsUser } from './test-utils';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `make-e2e-action-${uuidv4().substring(0, 8)}`;
const testMakeName = `Marca Teste ${testRunId}`;
let adminUser: any;
let testTenant: Tenant;

describe('VehicleMake Actions E2E Tests', () => {
    
    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `make-test-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin Make Test ${testRunId}`,
            email: `admin-make-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user");
        adminUser = await getUserProfileData(adminRes.userId);
    });

    afterAll(async () => {
        try {
            await prisma.vehicleMake.deleteMany({ where: { name: { contains: testRunId } } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[VehicleMake TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new vehicle make via action and verify it in the database', async () => {
        // Arrange
        const newMakeData: VehicleMakeFormData = {
            name: testMakeName,
        };

        // Act
        const result = await callActionAsUser(createVehicleMake, adminUser, newMakeData);

        // Assert
        assert.ok(result.success, 'createVehicleMake action should return success: true');
        assert.ok(result.makeId, 'createVehicleMake action should return a makeId');

        const createdMakeFromDb = await prisma.vehicleMake.findUnique({
            where: { id: result.makeId },
        });

        assert.ok(createdMakeFromDb, 'Make should be found in the database');
        assert.strictEqual(createdMakeFromDb.name, newMakeData.name, 'Make name should match');
        assert.ok(createdMakeFromDb.slug, 'Slug should be generated');
    });
});
