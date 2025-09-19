// tests/wizard-e2e.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Bem, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, WizardData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

import { getWizardInitialData, createAuctionFromWizard } from '@/app/admin/wizard/actions';
import { SellerService } from '@/services/seller.service';
import { JudicialProcessService } from '@/services/judicial-process.service';
import { BemService } from '@/services/bem.service';
import { RoleRepository } from '@/repositories/role.repository';
import { UserService } from '@/services/user.service';
import { tenantContext } from '@/lib/prisma';

const testRunId = `wizard-e2e-${uuidv4().substring(0, 8)}`;

// Test Data Holders
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let testJudicialSeller: SellerProfileInfo;
let testState: StateInfo;
let testCourt: Court;
let testDistrict: JudicialDistrict;
let testBranch: JudicialBranch;
let testJudicialProcess: JudicialProcess;
let testBem: Bem;
let testTenant: any;
let unauthorizedUser: UserProfileWithPermissions;
let adminUser: UserProfileWithPermissions;

// Helper to run code within a tenant context for tests
async function runInTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run({ tenantId }, fn);
}

// Helper to simulate calling an action as a specific user
// NOTE: This is a simplified mock for testing. In a real scenario, you'd mock the session provider.
async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const originalGetSession = require('@/app/auth/actions').getSession;
    const tenantId = user?.tenants?.[0]?.id || '1';
    
    // Mock getSession to return a session object for the specified user and their first tenant
    require('@/app/auth/actions').getSession = async () => user ? { userId: user.id, tenantId: tenantId, permissions: user.permissions } : null;

    try {
        // Run the action within the tenant context
        return await tenantContext.run({ tenantId }, () => action(...args));
    } finally {
        // Restore original getSession
        require('@/app/auth/actions').getSession = originalGetSession;
    }
}


async function cleanup() {
    console.log(`--- [Wizard E2E Teardown - ${testRunId}] Cleaning up... ---`);
    try {
        const auctions = await prisma.auction.findMany({ where: { title: { contains: testRunId } } });
        if (auctions.length > 0) {
            const auctionIds = auctions.map(a => a.id);
            await prisma.auctionStage.deleteMany({ where: { auctionId: { in: auctionIds } } });
            await prisma.lotBens.deleteMany({ where: { lot: { auctionId: { in: auctionIds } } } });
            await prisma.lot.deleteMany({ where: { auctionId: { in: auctionIds } } });
            await prisma.auction.deleteMany({ where: { id: { in: auctionIds } } });
        }
        
        await prisma.bem.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.judicialProcess.deleteMany({ where: { processNumber: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialBranch.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.judicialDistrict.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.court.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.state.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
        
        const userIdsToDelete = [unauthorizedUser?.id, adminUser?.id].filter(Boolean) as string[];
        if (userIdsToDelete.length > 0) {
            await prisma.usersOnRoles.deleteMany({ where: { userId: { in: userIdsToDelete } } });
            await prisma.usersOnTenants.deleteMany({ where: { userId: { in: userIdsToDelete } } });
            await prisma.user.deleteMany({ where: { id: { in: userIdsToDelete } } });
        }

        if (testTenant) {
            await prisma.tenant.delete({ where: { id: testTenant.id } });
        }

    } catch (error) {
        console.error(`[Wizard E2E Teardown] Error during cleanup for run ${testRunId}:`, error);
    }
}

describe(`[E2E] Auction Creation Wizard Lifecycle (ID: ${testRunId})`, () => {
    const sellerService = new SellerService();
    const judicialProcessService = new JudicialProcessService();
    const bemService = new BemService();
    const roleRepository = new RoleRepository();
    const userService = new UserService();

    beforeAll(async () => {
        await cleanup(); 
        console.log(`--- [Wizard E2E Setup - ${testRunId}] Starting... ---`);
        
        testTenant = await prisma.tenant.create({ data: { name: `Wizard Tenant ${testRunId}`, subdomain: `wizard-${testRunId}` }});
        
        const adminRole = await roleRepository.findByNormalizedName('ADMINISTRATOR');
        assert.ok(adminRole, 'ADMINISTRATOR role must exist.');
        
        const adminRes = await userService.createUser({
            fullName: `Admin Wizard ${testRunId}`,
            email: `admin-wizard-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole!.id],
            tenantId: testTenant.id,
            habilitationStatus: 'HABILITADO'
        });
        assert.ok(adminRes.success && adminRes.userId, "Admin user for test failed to create.");
        adminUser = (await userService.getUserById(adminRes.userId))!;
        assert.ok(adminUser, "Could not fetch created admin user.");


        const uniqueUf = `W${testRunId.substring(0, 1)}`;
        
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Wizard ${testRunId}`, slug: `cat-wiz-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await runInTenant(testTenant.id, () => prisma.auctioneer.create({ data: { name: `Auctioneer Wiz ${testRunId}`, slug: `auct-wiz-${testRunId}`, publicId: `auct-pub-wiz-${testRunId}`, tenantId: testTenant.id } }));
        testState = await prisma.state.create({ data: { name: `State Wiz ${testRunId}`, uf: uniqueUf, slug: `st-wiz-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Court Wiz ${testRunId}`, stateUf: testState.uf, slug: `court-wiz-${testRunId}` } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `District Wiz ${testRunId}`, slug: `dist-wiz-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Branch Wiz ${testRunId}`, slug: `branch-wiz-${testRunId}`, districtId: testDistrict.id } });
        
        const judicialSellerRes = await runInTenant(testTenant.id, () => sellerService.createSeller(testTenant.id, { name: `Vara Wiz ${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id, publicId: `seller-pub-judicial-wiz-${testRunId}`, slug: `vara-wiz-${testRunId}` } as any));
        assert.ok(judicialSellerRes.success && judicialSellerRes.sellerId);
        testJudicialSeller = (await sellerService.getSellerById(testTenant.id, judicialSellerRes.sellerId!))!;
        
        const procRes = await runInTenant(testTenant.id, () => judicialProcessService.createJudicialProcess(testTenant.id, { processNumber: `500-${testRunId}`, isElectronic: true, courtId: testCourt.id, districtId: testDistrict.id, branchId: testBranch.id, sellerId: testJudicialSeller.id, parties: [{ name: `Autor ${testRunId}`, partyType: 'AUTOR' }] }));
        assert.ok(procRes.success && procRes.processId, 'Judicial process should be created');
        testJudicialProcess = (await judicialProcessService.getJudicialProcessById(testTenant.id, procRes.processId!))!;
        
        const bemRes = await runInTenant(testTenant.id, () => bemService.createBem(testTenant.id, {
            title: `Bem para Wizard ${testRunId}`,
            judicialProcessId: testJudicialProcess.id,
            categoryId: testCategory.id,
            status: 'DISPONIVEL',
            evaluationValue: 50000.00
        } as any));
        assert.ok(bemRes.success && bemRes.bemId);
        testBem = (await bemService.getBemById(bemRes.bemId!))!;
        
        console.log(`--- [Wizard E2E Setup - ${testRunId}] Complete. ---`);
    }, 60000);

    afterAll(async () => {
        await cleanup();
        await prisma.$disconnect();
        console.log(`--- [Wizard E2E Teardown - ${testRunId}] Final cleanup complete. ---`);
    });

    it('should simulate the entire wizard flow and create a complete auction', async () => {
        console.log('\n--- Test: Full Wizard Flow Simulation ---');
        let wizardData: WizardData = { createdLots: [] };
        
        wizardData.auctionType = 'JUDICIAL';
        wizardData.judicialProcess = testJudicialProcess as JudicialProcess;
        wizardData.auctionDetails = {
            title: `Leilão do Wizard ${testRunId}`,
            auctionType: 'JUDICIAL',
            auctioneerId: testAuctioneer.id,
            sellerId: testJudicialSeller.id,
            categoryId: testCategory.id,
            judicialProcessId: testJudicialProcess.id,
            auctionStages: [{ name: '1ª Praça', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 10 * 86400000), initialPrice: 50000 }]
        };
        wizardData.createdLots = [{ id: `temp-lot-${uuidv4()}`, number: '101-WIZ', title: `Lote do Bem ${testRunId}`, type: 'BEM_TESTE', price: 50000, initialPrice: 50000, status: 'EM_BREVE', bemIds: [testBem.id], categoryId: testCategory.id, auctionId: '' } as Lot];

        console.log('- Step: Publishing the auction via server action as Admin...');
        const creationResult = await callActionAsUser(createAuctionFromWizard, adminUser, wizardData);

        assert.ok(creationResult.success, `Auction creation from wizard failed: ${creationResult.message}`);
        assert.ok(creationResult.auctionId, 'createAuctionFromWizard should return the new auction ID.');
        console.log(`- PASSED: Auction created with ID: ${creationResult.auctionId}`);

        console.log('- Step: Verifying created data in the database...');
        const createdAuction = await prisma.auction.findUnique({
            where: { id: creationResult.auctionId },
            include: { lots: { include: { bens: true } } }
        });
        
        assert.ok(createdAuction, 'The final auction should exist in the database.');
        assert.strictEqual(createdAuction?.title, wizardData.auctionDetails.title, 'Auction title should match.');
        assert.strictEqual(createdAuction?.lots.length, 1, 'Auction should have one lot.');
        console.log('- PASSED: Database verification successful.');
    });

    it('should NOT allow a user without permission to create an auction', async () => {
        console.log('\n--- Test: Authorization Check for Wizard Flow ---');
        
        const bidderRole = await roleRepository.findByNormalizedName('BIDDER');
        assert.ok(bidderRole, 'BIDDER role must exist');
        
        const unauthorizedUserRes = await userService.createUser({
            fullName: `Unauthorized User ${testRunId}`,
            email: `unauthorized-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [bidderRole!.id],
            tenantId: testTenant.id,
            habilitationStatus: 'HABILITADO'
        });
        assert.ok(unauthorizedUserRes.success && unauthorizedUserRes.userId, 'Unauthorized user creation failed.');
        unauthorizedUser = (await userService.getUserById(unauthorizedUserRes.userId!))!;
        
        const wizardData: WizardData = { createdLots: [], auctionType: 'JUDICIAL', judicialProcess: testJudicialProcess as JudicialProcess, auctionDetails: { title: `Leilão Não Autorizado ${testRunId}` } };
        
        const result = await callActionAsUser(createAuctionFromWizard, unauthorizedUser, wizardData);

        assert.strictEqual(result.success, false, 'Action should have failed for unauthorized user.');
        assert.match(result.message, /permissão/i, 'Error message should indicate a permission issue.');
        console.log(`- PASSED: Action correctly blocked with message: "${result.message}".`);
    });
});
