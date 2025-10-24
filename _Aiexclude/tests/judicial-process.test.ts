// tests/judicial-process.test.ts
import { test, describe, beforeAll, afterAll, it } from 'vitest';
import assert from 'node:assert';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { prisma } from '../src/lib/prisma';
import type { JudicialProcessFormData, Court, StateInfo, JudicialDistrict, JudicialBranch, SellerProfileInfo, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { tenantContext } from '@/lib/prisma';

const processService = new JudicialProcessService();
const testRunId = `proc-e2e-${uuidv4().substring(0, 8)}`;
const testProcessNumber = `0000123-45.${new Date().getFullYear()}.${testRunId}`;

let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;
let testBranch: JudicialBranch;
let testSeller: SellerProfileInfo;
let testTenant: Tenant;
let createdProcessId: string;

describe('Judicial Process Service E2E Tests', () => {

    beforeAll(async () => {
        // Create dependency records
        testTenant = await prisma.tenant.create({ data: { name: `Proc Tenant ${testRunId}`, subdomain: `proc-${testRunId}` } });
        const uf = testRunId.substring(0, 2).toUpperCase();
        testState = await prisma.state.create({ data: { name: `Estado Proc ${testRunId}`, uf: uf, slug: `estado-proc-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Tribunal Proc ${testRunId}`, stateUf: uf, slug: `tribunal-proc-${testRunId}`, website: 'http://test.com' } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `Comarca Proc ${testRunId}`, slug: `comarca-proc-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Vara Proc ${testRunId}`, slug: `vara-proc-${testRunId}`, districtId: testDistrict.id } });
        testSeller = await tenantContext.run({ tenantId: testTenant.id }, () => 
            prisma.seller.create({ data: { name: `Vara ${testRunId}`, publicId: `seller-pub-proc-${testRunId}`, slug: `vara-proc-${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id, tenantId: testTenant.id } })
        );
    });
    
    afterAll(async () => {
        try {
            if (createdProcessId) {
                await tenantContext.run({ tenantId: testTenant.id }, () => processService.deleteJudicialProcess(testTenant.id, createdProcessId));
            }
            await prisma.seller.deleteMany({ where: { name: { contains: `Vara ${testRunId}` } } });
            await prisma.judicialBranch.deleteMany({ where: { name: { contains: `Vara Proc ${testRunId}` } } });
            await prisma.judicialDistrict.deleteMany({ where: { name: { contains: `Comarca Proc ${testRunId}` } } });
            await prisma.court.deleteMany({ where: { name: { contains: `Tribunal Proc ${testRunId}` } } });
            await prisma.state.deleteMany({ where: { name: { contains: `Estado Proc ${testRunId}` } } });
            await prisma.tenant.deleteMany({ where: { name: { contains: `Proc Tenant ${testRunId}` } } });
        } catch (error) {
             console.error(`[JUDICIAL PROCESS TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial process with parties via action', async () => {
        // Arrange
        const newProcessData: JudicialProcessFormData = {
            processNumber: testProcessNumber,
            isElectronic: true,
            courtId: testCourt.id,
            districtId: testDistrict.id,
            branchId: testBranch.id,
            sellerId: testSeller.id,
            parties: [
                { name: `Autor Teste ${testRunId}`, partyType: 'AUTOR' },
                { name: `Réu Teste ${testRunId}`, partyType: 'REU' },
            ]
        };

        // Act
        const result = await tenantContext.run({ tenantId: testTenant.id }, () => createJudicialProcessAction(newProcessData));
        if (result.processId) createdProcessId = result.processId;

        // Assert
        assert.strictEqual(result.success, true, 'Service should return success: true');
        assert.ok(result.processId, 'Service should return a processId');

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
        assert.strictEqual(createdProcessFromDb.tenantId, testTenant.id, 'Process should belong to the correct tenant');
        assert.strictEqual(createdProcessFromDb.parties.length, 2, 'Should have 2 parties');
        assert.strictEqual(createdProcessFromDb.parties[0].name, `Autor Teste ${testRunId}`, 'First party name should match');
    });
});
