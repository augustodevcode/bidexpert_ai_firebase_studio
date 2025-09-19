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

// Helper to run code within a tenant context for tests
async function runInTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run({ tenantId }, fn);
}

// Helper to simulate calling an action as a specific user
// NOTE: This is a simplified mock for testing. In a real scenario, you'd mock the session provider.
async function callActionAsUser<T>(action: (...args: any[]) => Promise<T>, user: UserProfileWithPermissions | null, ...args: any[]): Promise<T> {
    const originalGetSession = require('@/app/auth/actions').getSession;
    require('@/app/auth/actions').getSession = async () => user ? { userId: user.id, tenantId: user.tenants[0]?.id || '1' } : null;

    try {
        return await action(...args);
    } finally {
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
        if (unauthorizedUser) {
          await prisma.user.delete({where: {id: unauthorizedUser.id}});
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
        await cleanup(); // Ensure a clean slate before starting
        console.log(`--- [Wizard E2E Setup - ${testRunId}] Starting... ---`);
        
        testTenant = await prisma.tenant.create({ data: { name: `Wizard Tenant ${testRunId}`, subdomain: `wizard-${testRunId}` }});
        
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
        await runInTenant(testTenant.id, async () => {
            console.log('\n--- Test: Full Wizard Flow Simulation ---');

            // Step 1: Fetch initial data
            console.log('- Step 1: Fetching initial data...');
            const initialDataResult = await getWizardInitialData();
            assert.ok(initialDataResult.success, `Should fetch initial wizard data successfully. Error: ${initialDataResult.message}`);
            const wizardFetchedData = initialDataResult.data as any;
            assert.ok(wizardFetchedData.judicialProcesses.some((p:any) => p.id === testJudicialProcess.id), 'Test judicial process should be in the initial data.');
            console.log('- PASSED: Initial data fetched.');
            
            // Step 2: Simulate filling the WizardData object step-by-step
            console.log('- Step 2: Simulating user input through the wizard...');
            let wizardData: WizardData = {
                createdLots: []
            };
            
            wizardData.auctionType = 'JUDICIAL';
            wizardData.judicialProcess = testJudicialProcess as JudicialProcess;

            const auctionStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const auctionEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
            wizardData.auctionDetails = {
                title: `Leilão do Wizard ${testRunId}`,
                auctionType: 'JUDICIAL',
                auctioneerId: testAuctioneer.id,
                sellerId: testJudicialSeller.id,
                categoryId: testCategory.id,
                judicialProcessId: testJudicialProcess.id,
                auctionStages: [{ name: '1ª Praça', startDate: auctionStartDate, endDate: auctionEndDate, initialPrice: 50000 }]
            };
            
            wizardData.createdLots = [{
                id: `temp-lot-${uuidv4()}`,
                number: '101-WIZ',
                title: `Lote do Bem ${testRunId}`,
                type: 'BEM_TESTE',
                price: 50000,
                initialPrice: 50000,
                status: 'EM_BREVE',
                bemIds: [testBem.id],
                categoryId: testCategory.id,
                auctionId: '',
            } as Lot];
            console.log('- PASSED: Wizard data simulation complete.');

            // Step 3: Publish the auction using the final action
            console.log('- Step 3: Publishing the auction via server action...');
            const creationResult = await createAuctionFromWizard(wizardData);
            assert.ok(creationResult.success, `Auction creation from wizard failed: ${creationResult.message}`);
            assert.ok(creationResult.auctionId, 'createAuctionFromWizard should return the new auction ID.');
            console.log(`- PASSED: Auction created with ID: ${creationResult.auctionId}`);

            // Step 4: Verify the created data in the database
            console.log('- Step 4: Verifying created data in the database...');
            const createdAuction = await prisma.auction.findUnique({
                where: { id: creationResult.auctionId },
                include: { lots: { include: { bens: true } } }
            });
            
            assert.ok(createdAuction, 'The final auction should exist in the database.');
            assert.strictEqual(createdAuction?.title, wizardData.auctionDetails.title, 'Auction title should match.');
            assert.strictEqual(createdAuction?.sellerId, testJudicialSeller.id, 'Auction seller should be correct.');
            assert.strictEqual(createdAuction?.judicialProcessId, testJudicialProcess.id, 'Auction should be linked to the judicial process.');
            assert.strictEqual(createdAuction?.lots.length, 1, 'Auction should have one lot.');

            const createdLot = createdAuction?.lots[0];
            assert.strictEqual(createdLot?.title, wizardData.createdLots[0].title, 'Lot title should match.');
            assert.strictEqual(createdLot?.bens.length, 1, 'Lot should have one bem linked.');
            assert.strictEqual(createdLot?.bens[0].bemId, testBem.id, 'The correct bem should be linked to the lot.');
            
            console.log('- PASSED: Database verification successful.');
        });
    });

    it('should NOT allow a user without permission to create an auction', async () => {
        console.log('\n--- Test: Authorization Check for Wizard Flow ---');
        
        // Step 1: Create a user with only BIDDER role
        console.log('- Step 1: Creating a user with insufficient permissions...');
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
        unauthorizedUser = (await userService.getUserById(unauthorizedUserRes.userId!))!
        assert.ok(unauthorizedUser, 'Unauthorized user not found after creation');
        console.log('- PASSED: Unauthorized user created.');

        // Step 2: Prepare valid wizard data
        const wizardData: WizardData = {
            createdLots: [{
                id: `temp-lot-unauth-${uuidv4()}`,
                number: '999-UNAUTH',
                title: `Lote Não Autorizado ${testRunId}`,
                type: 'BEM_TESTE',
                price: 1000,
                initialPrice: 1000,
                bemIds: [testBem.id],
                categoryId: testCategory.id,
                auctionId: '', 
            } as Lot],
            auctionDetails: {
                title: `Leilão Não Autorizado ${testRunId}`,
                auctionType: 'JUDICIAL',
                auctioneerId: testAuctioneer.id,
                sellerId: testJudicialSeller.id,
                judicialProcessId: testJudicialProcess.id,
                auctionStages: [{ name: '1ª Praça', startDate: new Date(), endDate: new Date(Date.now() + 86400000), initialPrice: 1000 }]
            },
            auctionType: 'JUDICIAL',
            judicialProcess: testJudicialProcess as JudicialProcess,
        };

        // Step 3: Attempt to create auction as the unauthorized user
        console.log('- Step 2: Attempting to publish auction as unauthorized user...');
        
        // Mock the session to simulate the unauthorized user making the call
        const result = await callActionAsUser(createAuctionFromWizard, unauthorizedUser, wizardData);

        // Step 4: Assert that the creation failed
        console.log('- Step 3: Verifying that the action was blocked...');
        assert.strictEqual(result.success, false, 'Action should have failed for unauthorized user.');
        assert.match(result.message, /permissão/i, 'Error message should indicate a permission issue.');
        console.log(`- PASSED: Action correctly blocked with message: "${result.message}".`);

        // Step 5: Verify that no auction was created
        const noAuction = await prisma.auction.findFirst({ where: { title: wizardData.auctionDetails.title } });
        assert.strictEqual(noAuction, null, 'No auction should have been created in the database.');
        console.log('- PASSED: Database verification successful, no auction was created.');
    });
});
