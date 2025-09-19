// tests/judicial-branch.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { prisma } from '../src/lib/prisma';
import type { JudicialBranchFormData, Court, StateInfo, JudicialDistrict } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const branchService = new JudicialBranchService();
const testRunId = `branch-e2e-${uuidv4().substring(0, 8)}`;
const testBranchName = `Vara de Teste ${testRunId}`;
let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;

test.describe('Judicial Branch Service E2E Tests', () => {

    test.before(async () => {
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
    
    test.after(async () => {
        try {
            await prisma.judicialBranch.deleteMany({ where: { name: testBranchName } });
            await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            await prisma.court.delete({ where: { id: testCourt.id } });
            await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            console.error(`[JUDICIAL BRANCH TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    test('should create a new judicial branch and verify it', async () => {
        // Arrange
        const newBranchData: JudicialBranchFormData = {
            name: testBranchName,
            districtId: testDistrict.id,
            email: `vara.teste.${testRunId}@example.com`
        };

        // Act
        const result = await branchService.createJudicialBranch(newBranchData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.branchId, 'Service should return a branchId');

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
        assert.strictEqual(createdBranchFromDb.email, newBranchData.email, 'Branch email should match');
    });
});