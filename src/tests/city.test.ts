// tests/city.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { CityService } from '../services/city.service';
import { prisma } from '../lib/prisma';
import type { CityFormData, StateInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

const cityService = new CityService();
const testRunId = `city-e2e-${uuidv4().substring(0, 8)}`;
const testCityName = `Cidade de Teste ${testRunId}`;
const testStateName = `Estado para Cidades ${testRunId}`;
const testStateUf = testRunId.substring(0, 2).toUpperCase();
let testState: StateInfo;

test.describe('City Service E2E Tests', () => {

    test.before(async () => {
        // Create the necessary State dependency
        await prisma.state.deleteMany({ where: { uf: testStateUf } });
        testState = await prisma.state.create({
            data: {
                name: testStateName,
                uf: testStateUf,
                slug: `estado-para-cidades-${testRunId}`,
            }
        });
    });

    test.after(async () => {
        try {
            await prisma.city.deleteMany({ where: { name: testCityName }});
            if (testState) {
                await prisma.state.delete({ where: { id: testState.id }});
            }
        } catch (error) {
            console.error(`[CITY TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    test('should create a new city and verify it in the database', async () => {
        // Arrange
        const newCityData: CityFormData = {
            name: testCityName,
            stateId: testState.id,
            ibgeCode: testRunId.replace(/-/g, '').substring(0, 7),
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