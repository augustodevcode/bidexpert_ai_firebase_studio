
// tests/vehicle-make.test.ts
import { describe, it, afterAll, beforeAll } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createVehicleMake } from '@/app/admin/vehicle-makes/actions';
import type { VehicleMakeFormData } from '@/app/admin/vehicle-makes/form-schema';
import { cleanup, createTestPrerequisites, callActionAsUser } from './test-utils';
import type { UserProfileWithPermissions } from '@/types';

const testRunId = `make-e2e-${uuidv4().substring(0, 8)}`;
const testMakeName = `Marca Teste ${testRunId}`;

describe('VehicleMake Actions E2E Tests', () => {
    
    afterAll(async () => {
        await cleanup(testRunId, 'vehicle-make');
    });

    it('should create a new vehicle make via action and verify it in the database', async () => {
        // Arrange
        const { adminUser } = await createTestPrerequisites(testRunId, 'vehicle-make');
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
