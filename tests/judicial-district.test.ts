// tests/judicial-district.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { prisma } from '../src/lib/prisma';
import type { JudicialDistrictFormData, Court, StateInfo } from '../src/types';

const districtService = new JudicialDistrictService();
const testDistrictName = 'Comarca de Teste E2E';
let testCourt: Court;
let testState: StateInfo;

test.describe('Judicial District Service E2E Tests', () => {

    test.before(async () => {
        // Create dependency records: Court and State
        testCourt = await prisma.court.create({
            data: { name: 'Tribunal de Teste para Comarcas', stateUf: 'TS', slug: 'tribunal-teste-comarcas', website: 'http://test.com' }
        });
        testState = await prisma.state.create({
            data: { name: 'Estado de Teste', uf: 'TS', slug: 'estado-de-teste' }
        });
    });
    
    test.after(async () => {
        try {
            await prisma.judicialDistrict.deleteMany({
                where: { name: testDistrictName }
            });
            await prisma.court.delete({ where: { id: testCourt.id } });
            await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new judicial district and verify it', async () => {
        // Arrange
        const newDistrictData: JudicialDistrictFormData = {
            name: testDistrictName,
            courtId: testCourt.id,
            stateId: testState.id,
            zipCode: '12345-678',
        };

        // Act
        const result = await districtService.createJudicialDistrict(newDistrictData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.districtId, 'Service should return a districtId');

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
