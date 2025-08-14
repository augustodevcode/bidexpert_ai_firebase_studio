// tests/wizard-e2e.test.ts
import { test, describe, beforeAll, afterAll, expect } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Bem, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, WizardData } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

import { getWizardInitialData, createAuctionFromWizard } from '@/app/admin/wizard/actions';

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

// Helper to ensure cleanup happens
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
    } catch (error) {
        console.error(`[Wizard E2E Teardown] Error during cleanup for run ${testRunId}:`, error);
    }
}

describe(`[E2E] Auction Creation Wizard Lifecycle (ID: ${testRunId})`, () => {

    beforeAll(async () => {
        await cleanup(); // Ensure a clean slate before starting
        console.log(`--- [Wizard E2E Setup - ${testRunId}] Starting... ---`);
        
        const uniqueUf = testRunId.substring(0, 2).toUpperCase();
        
        testCategory = await prisma.lotCategory.create({ data: { name: `Cat Wizard ${testRunId}`, slug: `cat-wiz-${testRunId}`, hasSubcategories: false } });
        testAuctioneer = await prisma.auctioneer.create({ data: { name: `Auctioneer Wiz ${testRunId}`, slug: `auct-wiz-${testRunId}`, publicId: `auct-pub-wiz-${testRunId}` } });
        testState = await prisma.state.create({ data: { name: `State Wiz ${testRunId}`, uf: uniqueUf, slug: `st-wiz-${testRunId}` } });
        testCourt = await prisma.court.create({ data: { name: `Court Wiz ${testRunId}`, stateUf: testState.uf, slug: `court-wiz-${testRunId}` } });
        testDistrict = await prisma.judicialDistrict.create({ data: { name: `District Wiz ${testRunId}`, slug: `dist-wiz-${testRunId}`, courtId: testCourt.id, stateId: testState.id } });
        testBranch = await prisma.judicialBranch.create({ data: { name: `Branch Wiz ${testRunId}`, slug: `branch-wiz-${testRunId}`, districtId: testDistrict.id } });
        
        testJudicialSeller = await prisma.seller.create({ data: { name: `Vara Wiz ${testRunId}`, isJudicial: true, judicialBranchId: testBranch.id, publicId: `seller-pub-judicial-wiz-${testRunId}`, slug: `vara-wiz-${testRunId}` } });
        
        testJudicialProcess = await prisma.judicialProcess.create({
            data: { 
                processNumber: `500-${testRunId}`, 
                isElectronic: true, 
                courtId: testCourt.id, 
                districtId: testDistrict.id, 
                branchId: testBranch.id, 
                sellerId: testJudicialSeller.id,
                publicId: `proc-pub-wiz-${testRunId}`,
            }
        });
        
        testBem = await prisma.bem.create({
            data: {
                title: `Bem para Wizard ${testRunId}`,
                publicId: `bem-wiz-${testRunId}`,
                status: 'DISPONIVEL',
                categoryId: testCategory.id,
                judicialProcessId: testJudicialProcess.id,
                evaluationValue: 50000.00
            }
        });
        
        console.log(`--- [Wizard E2E Setup - ${testRunId}] Complete. ---`);
    });

    afterAll(async () => {
        await cleanup();
        await prisma.$disconnect();
        console.log(`--- [Wizard E2E Teardown - ${testRunId}] Final cleanup complete. ---`);
    });

    test('should simulate the entire wizard flow and create a complete auction', async () => {
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
        
        // Step 2.1: Select auction type
        wizardData.auctionType = 'JUDICIAL';
        
        // Step 2.2: Select Judicial Process
        wizardData.judicialProcess = testJudicialProcess as JudicialProcess;

        // Step 2.3: Fill Auction Details
        const auctionStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const auctionEndDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        wizardData.auctionDetails = {
            title: `Leilão do Wizard ${testRunId}`,
            auctionType: 'JUDICIAL',
            auctioneerId: testAuctioneer.id,
            sellerId: testJudicialSeller.id,
            categoryId: testCategory.id,
            judicialProcessId: testJudicialProcess.id, // Correctly link the process
            auctionStages: [{ name: '1ª Praça', startDate: auctionStartDate, endDate: auctionEndDate, initialPrice: 50000 }]
        };
        
        // Step 2.4: Create a Lot
        wizardData.createdLots = [{
            id: `temp-lot-${uuidv4()}`,
            number: '101-WIZ',
            title: `Lote do Bem ${testRunId}`,
            price: 50000,
            initialPrice: 50000,
            status: 'EM_BREVE',
            bemIds: [testBem.id],
            categoryId: testCategory.id,
            auctionId: '', // Will be assigned on creation
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
