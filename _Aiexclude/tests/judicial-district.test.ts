
// tests/judicial-district.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { createJudicialDistrict } from '../src/app/admin/judicial-districts/actions';
import { prisma } from '../src/lib/prisma';
import type { JudicialDistrictFormData, Court, StateInfo } from '../src/types';
import { v4 as uuidv4 } from 'uuid';


const testRunId = `district-e2e-${uuidv4().substring(0, 8)}`;
const testDistrictName = `Comarca de Teste E2E ${testRunId}`;
let testCourt: Court;
let testState: StateInfo;

describe('Judicial District Actions E2E Tests', () => {

    beforeAll(async () => {
        // Create dependency records: Court and State
        testCourt = await prisma.court.create({
            data: { name: `Tribunal de Teste para Comarcas ${testRunId}`, stateUf: 'TS', slug: `tribunal-teste-comarcas-${testRunId}`, website: 'http://test.com' }
        });
        testState = await prisma.state.create({
            data: { name: `Estado de Teste ${testRunId}`, uf: `T${testRunId.substring(0,1)}`, slug: `estado-de-teste-${testRunId}` }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.judicialDistrict.deleteMany({ where: { name: testDistrictName } });
            if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
            if (testState) await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            console.error(`[JUDICIAL DISTRICT TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial district via action and verify it', async () => {
        // Arrange
        const newDistrictData: JudicialDistrictFormData = {
            name: testDistrictName,
            courtId: testCourt.id,
            stateId: testState.id,
            zipCode: '12345-678',
        };

        // Act
        const result = await createJudicialDistrict(newDistrictData);

        // Assert: Check the action result
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.districtId, 'Action should return a districtId');

        // Assert: Verify directly in the database
        const createdDistrictFromDb = await prisma.judicialDistrict.findUnique({
            where: { id: result.districtId },
        });

        console.log('--- Judicial District Record Found in DB ---');
        console.log(createdDistrictFromDb);
        console.log('------------------------------------------');
        
        assert.ok(createdDistrictFromDb, 'District should be found in the database');
        assert.strictEqual(createdDistrictFromDb.name, newDistrictData.name, 'District name should match');
        assert.strictEqual(createdDistrictFromDb.courtId, newDistrictData.courtId, 'District courtId should match');
        assert.strictEqual(createdDistrictFromDb.stateId, newDistrictData.stateId, 'District stateId should match');
    });

});
