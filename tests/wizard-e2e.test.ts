// tests/wizard-e2e.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { UserProfileWithPermissions, Role, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Lot, Asset, JudicialProcess, StateInfo, JudicialDistrict, Court, JudicialBranch, WizardData, Tenant, AssetFormData } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getWizardInitialData, createAuctionFromWizard } from '@/app/admin/wizard/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { createAsset } from '@/app/admin/assets/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';
import { createRole } from '@/app/admin/roles/actions';
import { tenantContext } from '@/lib/prisma';
import { callActionAsUser, cleanup, createTestPrerequisites } from 'tests/test-utils';


const testRunId = `wizard-e2e-${uuidv4().substring(0, 8)}`;

let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let testJudicialSeller: SellerProfileInfo;
let testJudicialProcess: JudicialProcess;
let testAsset: Asset;
let testTenant: any;
let unauthorizedUser: UserProfileWithPermissions;
let adminUser: UserProfileWithPermissions;

describe(`[E2E] Módulo 8 & 29: Auction Creation Wizard Lifecycle (ID: ${testRunId})`, () => {
    
    beforeAll(async () => {
        const prereqs = await createTestPrerequisites(testRunId, 'wizard');
        testTenant = prereqs.tenant;
        adminUser = prereqs.adminUser;
        unauthorizedUser = prereqs.unauthorizedUser;
        testCategory = prereqs.category;
        testAuctioneer = prereqs.auctioneer;
        testJudicialSeller = prereqs.judicialSeller;
        testJudicialProcess = prereqs.judicialProcess;
        testAsset = prereqs.asset;
    }, 80000);

    afterAll(async () => {
        await cleanup(testRunId, 'wizard');
    });

    it('Cenário 8.1 & 29.1: should simulate the entire wizard flow and create a complete auction', async () => {
        console.log('\n--- Test: Full Wizard Flow Simulation ---');
        const wizardData: WizardData = { 
            createdLots: [],
            auctionType: 'JUDICIAL',
            judicialProcess: testJudicialProcess,
            auctionDetails: {
                title: `Leilão do Wizard ${testRunId}`, auctionType: 'JUDICIAL',
                auctioneerId: testAuctioneer.id, sellerId: testJudicialSeller.id,
                categoryId: testCategory.id, judicialProcessId: testJudicialProcess.id,
                auctionStages: [{ name: '1ª Praça', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 10 * 86400000) } as any]
            },
            createdLots: [{ id: `temp-lot-${uuidv4()}`, number: '101-WIZ', title: `Lote do Asset ${testRunId}`, type: 'ASSET_TEST', price: 50000, initialPrice: 50000, status: 'EM_BREVE', assetIds: [testAsset.id], categoryId: testCategory.id, auctionId: '' } as any]
        };

        console.log('- Step: Publishing the auction via server action as Admin...');
        const creationResult = await callActionAsUser(createAuctionFromWizard, adminUser, wizardData);

        assert.ok(creationResult.success, `Auction creation from wizard failed: ${creationResult.message}`);
        assert.ok(creationResult.auctionId, 'createAuctionFromWizard should return the new auction ID.');
        console.log(`- PASSED: Auction created with ID: ${creationResult.auctionId}`);

        console.log('- Step: Verifying created data in the database...');
        const createdAuction = await prisma.auction.findUnique({ where: { id: creationResult.auctionId }, include: { lots: { include: { assets: true } } } });
        expect(createdAuction).toBeDefined();
        expect(createdAuction?.lots.length).toBe(1);
        expect(createdAuction?.lots[0].assets[0].assetId).toBe(testAsset.id);
        console.log('- PASSED: Database verification successful.');
    });

    it('should NOT allow a user without permission to create an auction', async () => {
        console.log('\n--- Test: Authorization Check for Wizard Flow ---');
        
        const wizardData: WizardData = { createdLots: [], auctionType: 'JUDICIAL', judicialProcess: testJudicialProcess, auctionDetails: { title: `Leilão Não Autorizado ${testRunId}` } };
        
        const result = await callActionAsUser(createAuctionFromWizard, unauthorizedUser, wizardData);

        assert.strictEqual(result.success, false, 'Action should have failed for unauthorized user.');
        assert.match(result.message, /permissão/i, 'Error message should indicate a permission issue.');
        console.log(`- PASSED: Action correctly blocked with message: "${result.message}".`);
    });
});
