
// tests/state.test.ts
import { describe, it, beforeEach, afterAll } from 'vitest';
import assert from 'node:assert';
import { createState } from '../src/app/admin/states/actions';
import { prisma } from '../src/lib/prisma';
import type { StateFormData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { StateService } from '@/services/state.service'; // Service for direct interaction if needed

const testRunId = `state-e2e-${uuidv4().substring(0, 8)}`;
const testStateName = `Estado de Teste ${testRunId}`;
const testStateUf = testRunId.substring(0, 2).toUpperCase();

describe('State Actions E2E Tests', () => {

    beforeEach(async () => {
        // Clean up previous test runs to ensure a clean slate
        await prisma.state.deleteMany({
            where: { OR: [{ uf: testStateUf }, {name: {contains: testRunId}}] }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.state.deleteMany({
                where: { OR: [{ uf: testStateUf }, {name: {contains: testRunId}}] }
            });
        } catch (error) {
            // Ignore cleanup errors
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
        const result = await createState(newStateData);

        // Assert
        assert.strictEqual(result.success, true, 'createState action should return success: true');
        assert.ok(result.stateId, 'createState action should return a stateId');

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

    it('should prevent creating a state with a duplicate UF via action', async () => {
        // Arrange: Create the first state
        const stateService = new StateService();
        const firstStateUf = `DU${testRunId.substring(0,1)}`;
        await prisma.state.deleteMany({ where: { uf: firstStateUf } }); // Ensure it does not exist
        const firstStateData: StateFormData = {
            name: `${testStateName} Original`,
            uf: firstStateUf,
        };
        await stateService.createState(firstStateData);

        // Arrange: Prepare data for the second state with the same UF
        const duplicateStateData: StateFormData = {
            name: `${testStateName} Duplicado`,
            uf: firstStateUf,
        };

        // Act: Attempt to create the second state via the action
        const result = await createState(duplicateStateData);

        // Assert
        assert.strictEqual(result.success, false, 'Should fail to create a state with a duplicate UF');
        assert.strictEqual(result.message, `Já existe um estado com a UF '${firstStateUf}'.`);
    });
});
