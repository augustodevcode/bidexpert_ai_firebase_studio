// tests/state.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { StateService } from '../src/services/state.service';
import { prisma } from '../src/lib/prisma';
import type { StateFormData } from '../src/types';

const stateService = new StateService();
const testStateName = 'Estado de Teste E2E';
const testStateUf = 'TE';

test.describe('State Service E2E Tests', () => {

    test.after(async () => {
        try {
            await prisma.state.deleteMany({
                where: { uf: testStateUf }
            });
        } catch (error) {
            // Ignore cleanup errors, test might have failed before creation
        }
        await prisma.$disconnect();
    });

    test('should create a new state and verify it in the database', async () => {
        // Arrange
        const newStateData: StateFormData = {
            name: testStateName,
            uf: testStateUf,
        };

        // Act
        const result = await stateService.createState(newStateData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'StateService.createState should return success: true');
        assert.ok(result.stateId, 'StateService.createState should return a stateId');

        // Assert: Verify directly in the database
        const createdStateFromDb = await prisma.state.findUnique({
            where: { id: result.stateId },
        });
        
        console.log('--- State Record Found in DB ---');
        console.log(createdStateFromDb);
        console.log('--------------------------------');

        assert.ok(createdStateFromDb, 'State should be found in the database after creation');
        assert.strictEqual(createdStateFromDb.name, newStateData.name, 'State name should match');
        assert.strictEqual(createdStateFromDb.uf, newStateData.uf.toUpperCase(), 'State UF should match and be uppercase');
        assert.ok(createdStateFromDb.slug, 'State slug should be generated');
    });

    test('should prevent creating a state with a duplicate UF', async () => {
        // Arrange: Create the first state
        const firstStateData: StateFormData = {
            name: `${testStateName} Original`,
            uf: testStateUf,
        };
        await stateService.createState(firstStateData);

        // Arrange: Prepare data for the second state with the same UF
        const duplicateStateData: StateFormData = {
            name: `${testStateName} Duplicado`,
            uf: testStateUf,
        };

        // Act: Attempt to create the second state
        const result = await stateService.createState(duplicateStateData);

        // Assert
        assert.strictEqual(result.success, false, 'Should fail to create a state with a duplicate UF');
        assert.strictEqual(result.message, `Já existe um estado com a UF '${testStateUf}'.`);
    });
});
