// tests/judicial-process.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { JudicialProcessFormData, Court, StateInfo, JudicialDistrict, JudicialBranch, SellerProfileInfo, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createJudicialProcessAction, deleteJudicialProcess } from '@/app/admin/judicial-processes/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `proc-e2e-action-${uuidv4().substring(0, 8)}`;
const testProcessNumber = `0000123-45.${new Date().getFullYear()}.${testRunId}`;

let testCourt: Court;
let testState: StateInfo;
let testDistrict: JudicialDistrict;
let testBranch: JudicialBranch;
let testSeller: SellerProfileInfo;
let testTenant: Tenant;
let adminUser: any;
let createdProcessId: string;

describe('Judicial Process Actions E2E Tests', () => {

    beforeAll(async () => {
        // Create a dedicated tenant for this test run
        testTenant = await prisma.tenant.create({ data: { name: `Proc Tenant ${testRunId}`, subdomain: `proc-${testRunId}` } });
        
        // Create an admin user for the tenant
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        const adminRes = await createUser({
            fullName: `Admin For Proc Test ${testRunId}`,
            email: `admin-for-proc-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        assert.ok(adminUser, "Could not retrieve admin user profile");


        // Create dependency records
        const uf = testRunId.substring(0, 2).toUpperCase();
        testState = await prisma.state.create({ data: { name: `Estado Proc ${testRunId}`, uf: uf, slug: `estado-proc-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Tribunal Proc ${testRunId}`, stateUf: uf, slug: `tribunal-proc-${testRunId}`, website: 'http://test.com' } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `Comarca Proc ${testRunId}`, slug: `comarca-proc-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Vara Proc ${testRunId}`, slug: `vara-proc-${testRunId}`, districtId: testDistrict.id } });
        
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Vara ${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id } as any);
        assert.ok(sellerRes.success && sellerRes.sellerId, "Failed to create test judicial seller");
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;
    });
    
    afterAll(async () => {
        try {
            if (createdProcessId) await callActionAsUser(deleteJudicialProcess, adminUser, createdProcessId);
            await prisma.seller.deleteMany({ where: { name: { contains: `Vara ${testRunId}` } } });
            await prisma.judicialBranch.deleteMany({ where: { name: { contains: `Vara Proc ${testRunId}` } } });
            await prisma.judicialDistrict.deleteMany({ where: { name: { contains: `Comarca Proc ${testRunId}` } } });
            await prisma.court.deleteMany({ where: { name: { contains: `Tribunal Proc ${testRunId}` } } });
            await prisma.state.deleteMany({ where: { name: { contains: `Estado Proc ${testRunId}` } } });
            if (adminUser) await deleteUser(adminUser.id);
            await prisma.tenant.deleteMany({ where: { name: { contains: `Proc Tenant ${testRunId}` } } });
        } catch (error) {
             console.error(`[JUDICIAL PROCESS TEST CLEANUP] - Failed to delete records:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new judicial process with parties via server action', async () => {
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
        const result = await callActionAsUser(createJudicialProcessAction, adminUser, newProcessData);
        if (result.processId) createdProcessId = result.processId;

        // Assert
        assert.strictEqual(result.success, true, 'Action should return success: true');
        assert.ok(result.processId, 'Action should return a processId');

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
