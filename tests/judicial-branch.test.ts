// tests/judicial-branch.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { prisma } from '../src/lib/prisma';
import type { JudicialBranchFormData, Court, StateInfo, JudicialDistrict } from '../src/types';

const branchService = new JudicialBranchService();
const testBranchName = 'Vara de Teste E2E';
let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;

test.describe('Judicial Branch Service E2E Tests', () => {

    test.before(async () => {
        // Create dependency records: State -> Court -> District
        testState = await prisma.state.create({
            data: { name: 'Estado de Teste para Varas', uf: 'TV', slug: 'estado-de-teste-varas' }
        });
        testCourt = await prisma.court.create({
            data: { name: 'Tribunal de Teste para Varas', stateUf: 'TV', slug: 'tribunal-teste-varas', website: 'http://test.com' }
        });
        testDistrict = await prisma.judicialDistrict.create({
            data: { 
                name: 'Comarca de Teste para Varas',
                slug: 'comarca-teste-varas',
                courtId: testCourt.id,
                stateId: testState.id,
            }
        });
    });
    
    test.after(async () => {
        try {
            // Clean up in reverse order of creation
            await prisma.judicialBranch.deleteMany({
                where: { name: testBranchName }
            });
            await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            await prisma.court.delete({ where: { id: testCourt.id } });
            await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new judicial branch and verify it', async () => {
        // Arrange
        const newBranchData: JudicialBranchFormData = {
            name: testBranchName,
            districtId: testDistrict.id,
            email: 'test.vara@example.com'
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
