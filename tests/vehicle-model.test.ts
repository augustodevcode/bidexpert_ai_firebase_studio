// tests/vehicle-model.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { VehicleMakeService } from '@/services/vehicle-make.service';
import { VehicleModelService } from '@/services/vehicle-model.service';
import type { VehicleModelFormData } from '@/app/admin/vehicle-models/form-schema';
import type { VehicleMake } from '@/types';

const modelService = new VehicleModelService();
const makeService = new VehicleMakeService();
const testRunId = `model-e2e-${uuidv4().substring(0, 8)}`;
const testModelName = `Modelo Teste ${testRunId}`;
let testMake: VehicleMake;

describe('VehicleModel Service E2E Tests', () => {

    beforeAll(async () => {
        const makeRes = await makeService.createVehicleMake({ name: `Marca para Modelo ${testRunId}`});
        assert.ok(makeRes.success && makeRes.makeId);
        testMake = (await makeService.getVehicleMakeById(makeRes.makeId))!;
    });
    
    afterAll(async () => {
        try {
            await prisma.vehicleModel.deleteMany({ where: { name: { contains: testRunId } } });
            if (testMake) {
                await prisma.vehicleMake.delete({ where: { id: testMake.id } });
            }
        } catch (error) {
            console.error(`[VehicleModel TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new vehicle model linked to a make', async () => {
        // Arrange
        const newModelData: VehicleModelFormData = {
            name: testModelName,
            makeId: testMake.id,
        };

        // Act
        const result = await modelService.createVehicleModel(newModelData);

        // Assert
        assert.ok(result.success, 'createVehicleModel should return success: true');
        assert.ok(result.modelId, 'createVehicleModel should return a modelId');

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
