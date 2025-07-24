// tests/judicial-process.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { prisma } from '../src/lib/prisma';
import type { JudicialProcessFormData, Court, StateInfo, JudicialDistrict, JudicialBranch, SellerProfileInfo } from '../src/types';

const processService = new JudicialProcessService();
const testProcessNumber = '0000123-45.2024.8.26.0001';
let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;
let testBranch: JudicialBranch;
let testSeller: SellerProfileInfo;

test.describe('Judicial Process Service E2E Tests', () => {

    test.before(async () => {
        // Create dependency records
        testState = await prisma.state.create({
            data: { name: 'Estado de Teste para Processos', uf: 'TP', slug: 'estado-de-teste-processos' }
        });
        testCourt = await prisma.court.create({
            data: { name: 'Tribunal de Teste para Processos', stateUf: 'TP', slug: 'tribunal-teste-processos', website: 'http://test.com' }
        });
        testDistrict = await prisma.judicialDistrict.create({
            data: { 
                name: 'Comarca de Teste para Processos',
                slug: 'comarca-teste-processos',
                courtId: testCourt.id,
                stateId: testState.id,
            }
        });
        testBranch = await prisma.judicialBranch.create({
            data: { name: 'Vara de Teste para Processos', slug: 'vara-teste-processos', districtId: testDistrict.id }
        });
        testSeller = await prisma.seller.create({
            data: { name: 'Vara de Teste para Processos', publicId: 'seller-pub-id-proc-test', slug: 'vara-teste-processos', isJudicial: true, judicialBranchId: testBranch.id }
        });
    });
    
    test.after(async () => {
        try {
            // Clean up in reverse order of creation
            await prisma.judicialProcess.deleteMany({ where: { processNumber: testProcessNumber } });
            await prisma.seller.delete({ where: { id: testSeller.id } });
            await prisma.judicialBranch.delete({ where: { id: testBranch.id } });
            await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
            await prisma.court.delete({ where: { id: testCourt.id } });
            await prisma.state.delete({ where: { id: testState.id } });
        } catch (error) {
            // Ignore cleanup errors
        }
        await prisma.$disconnect();
    });

    test('should create a new judicial process with parties', async () => {
        // Arrange
        const newProcessData: JudicialProcessFormData = {
            processNumber: testProcessNumber,
            isElectronic: true,
            courtId: testCourt.id,
            districtId: testDistrict.id,
            branchId: testBranch.id,
            sellerId: testSeller.id,
            parties: [
                { name: 'Autor Teste E2E', partyType: 'AUTOR' },
                { name: 'Réu Teste E2E', partyType: 'REU' },
            ]
        };

        // Act
        const result = await processService.createJudicialProcess(newProcessData);

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.processId, 'Service should return a processId');

        // Assert: Verify directly in the database
        const createdProcessFromDb = await prisma.judicialProcess.findUnique({
            where: { id: result.processId },
            include: { parties: true },
        });

        console.log('--- Judicial Process Record Found in DB ---');
        console.log(createdProcessFromDb);
        console.log('-------------------------------------------');
        
        assert.ok(createdProcessFromDb, 'Process should be found in the database');
        assert.strictEqual(createdProcessFromDb.processNumber, newProcessData.processNumber, 'Process number should match');
        assert.strictEqual(createdProcessFromDb.branchId, newProcessData.branchId, 'Process branchId should match');
        assert.strictEqual(createdProcessFromDb.parties.length, 2, 'Should have 2 parties');
        assert.strictEqual(createdProcessFromDb.parties[0].name, 'Autor Teste E2E', 'First party name should match');
    });
});
