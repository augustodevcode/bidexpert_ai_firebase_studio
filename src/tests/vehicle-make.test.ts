// tests/vehicle-make.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { VehicleMakeService } from '@/services/vehicle-make.service';
import type { VehicleMakeFormData } from '@/app/admin/vehicle-makes/form-schema';

const makeService = new VehicleMakeService();
const testRunId = `make-e2e-${uuidv4().substring(0, 8)}`;
const testMakeName = `Marca Teste ${testRunId}`;

describe('VehicleMake Service E2E Tests', () => {
    
    afterAll(async () => {
        try {
            await prisma.vehicleMake.deleteMany({ where: { name: { contains: testRunId } } });
        } catch (error) {
            console.error(`[VehicleMake TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new vehicle make and verify it in the database', async () => {
        // Arrange
        const newMakeData: VehicleMakeFormData = {
            name: testMakeName,
        };

        // Act
        const result = await makeService.createVehicleMake(newMakeData);

        // Assert
        assert.ok(result.success, 'createVehicleMake should return success: true');
        assert.ok(result.makeId, 'createVehicleMake should return a makeId');

        const createdMakeFromDb = await prisma.vehicleMake.findUnique({
            where: { id: result.makeId },
        });

        assert.ok(createdMakeFromDb, 'Make should be found in the database');
        assert.strictEqual(createdMakeFromDb.name, newMakeData.name, 'Make name should match');
        assert.ok(createdMakeFromDb.slug, 'Slug should be generated');
    });
});
