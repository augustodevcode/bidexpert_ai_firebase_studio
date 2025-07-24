// tests/city.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { CityService } from '../src/services/city.service';
import { prisma } from '../src/lib/prisma';
import type { CityFormData, StateInfo } from '../src/types';

const cityService = new CityService();
const testCityName = 'Cidade de Teste E2E';
const testStateName = 'Estado para Cidades E2E';
const testStateUf = 'TC';
let testState: StateInfo;

test.describe('City Service E2E Tests', () => {

    test.before(async () => {
        // Create the necessary State dependency
        testState = await prisma.state.create({
            data: {
                name: testStateName,
                uf: testStateUf,
                slug: 'estado-para-cidades-e2e',
            }
        });
    });

    test.after(async () => {
        try {
            // Clean up created records
            await prisma.city.deleteMany({ where: { name: testCityName }});
            await prisma.state.delete({ where: { id: testState.id }});
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new city and verify it in the database', async () => {
        // Arrange
        const newCityData: CityFormData = {
            name: testCityName,
            stateId: testState.id,
            ibgeCode: '1234567',
        };

        // Act
        const result = await cityService.createCity(newCityData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'CityService.createCity should return success: true');
        assert.ok(result.cityId, 'CityService.createCity should return a cityId');

        // Assert: Verify directly in the database
        const createdCityFromDb = await prisma.city.findUnique({
            where: { id: result.cityId },
        });

        console.log('--- City Record Found in DB ---');
        console.log(createdCityFromDb);
        console.log('--------------------------------');

        assert.ok(createdCityFromDb, 'City should be found in the database after creation');
        assert.strictEqual(createdCityFromDb.name, newCityData.name, 'City name should match');
        assert.strictEqual(createdCityFromDb.stateId, testState.id, 'City stateId should match');
        assert.strictEqual(createdCityFromDb.stateUf, testState.uf, 'City stateUf should be correctly denormalized');
        assert.strictEqual(createdCityFromDb.ibgeCode, newCityData.ibgeCode, 'City ibgeCode should match');
    });
});
