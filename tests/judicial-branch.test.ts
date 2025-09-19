
// tests/judicial-branch.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { createJudicialBranch } from '../src/app/admin/judicial-branches/actions';
import { prisma } from '../src/lib/prisma';
import type { JudicialBranchFormData, Court, StateInfo, JudicialDistrict } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const testRunId = `branch-e2e-${uuidv4().substring(0, 8)}`;
const testBranchName = `Vara de Teste ${testRunId}`;
let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;

describe('Judicial Branch Actions E2E Tests', () => {

    beforeAll(async () => {
        // Create dependency records: State -> Court -> District
        const uf = testRunId.substring(0, 2).toUpperCase();
        testState = await prisma.state.create({
            data: { name: `Estado Varas ${testRunId}`, uf: uf, slug: `estado-varas-${testRunId}` }
        });
        testCourt = await prisma.court.create({
            data: { name: `Tribunal Varas ${testRunId}`, stateUf: uf, slug: `tribunal-varas-${testRunId}`, website: 'http://test.com' }
        });
        testDistrict = await prisma.judicialDistrict.create({
            data: { name: `Comarca Varas ${testRunId}`, slug: `comarca-varas-${testRunId}`, courtId: testCourt.id, stateId: testState.id }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.judicialBranch.deleteMany({ where: { name: testBranchName } });
            if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
            if (testState) await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            console.error(`[JUDICIAL BRANCH TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial branch via action and verify it', async () => {
        // Arrange
        const newBranchData: JudicialBranchFormData = {
            name: testBranchName,
            districtId: testDistrict.id,
            email: `vara.teste.${testRunId}@example.com`
        };

        // Act
        const result = await createJudicialBranch(newBranchData);

        // Assert: Check the action result
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.branchId, 'Action should return a branchId');

        // Assert: Verify directly in the database
        const createdBranchFromDb = await prisma.judicialBranch.findUnique({
            where: { id: result.branchId },
        });

        console.log('--- Judicial Branch Record Found in DB ---');
        console.log(createdBranchFromDb);
        console.log('------------------------------------------');
        
        assert.ok(createdBranchFromDb, 'Branch should be found in the database');
        assert.strictEqual(createdBranchFromDb.name, newBranchData.name, 'Branch name should match');
        assert.strictEqual(createdBranchFromDb.districtId, newBranchData.districtId, 'Branch districtId should match');
    });
});
