// scripts/seed-data-extended.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser, createTestPrerequisites, cleanup } from '../src/tests/test-utils';

// Import all necessary server actions
import { createAuction } from '@/app/admin/auctions/actions';
import { createLot } from '@/app/admin/lots/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';
import { createJudicialProcessAction } from '@/app/admin/judicial-processes/actions';
import { createAsset } from '@/app/admin/assets/actions';
import type { AuctionFormData, LotFormData, AssetFormData, JudicialProcessFormData } from '@/types';

const testRunId = `mega-seed-test-${uuidv4().substring(0, 8)}`;

describe(`[E2E Seeding Test] Full Database Population via Actions (ID: ${testRunId})`, () => {

    let testData: any;

    beforeAll(async () => {
        console.log(`--- [E2E Seeding Setup] Creating prerequisites for run: ${testRunId} ---`);
        testData = await createTestPrerequisites(testRunId, 'mega-seed');
        console.log('--- [E2E Seeding Setup] Prerequisites created. ---');
    }, 90000); // Increased timeout for setup

    afterAll(async () => {
        console.log(`--- [E2E Seeding Teardown] Cleaning up data for run: ${testRunId} ---`);
        await cleanup(testRunId, 'mega-seed');
        console.log(`--- [E2E Seeding Teardown] Cleanup complete. ---`);
    });

    it('should seed the database with a complete set of related data using server actions', async () => {
        const { adminUser, category, auctioneer, judicialSeller, judicialProcess, bem } = testData;

        // 1. Create an Extrajudicial Auction
        const extrajudicialAuctionData: Partial<AuctionFormData> = {
            title: `Leilão Extrajudicial Completo ${testRunId}`,
            status: 'ABERTO_PARA_LANCES',
            auctionType: 'EXTRAJUDICIAL',
            auctioneerId: auctioneer.id,
            sellerId: judicialSeller.id, // Re-using for simplicity
            categoryId: category.id,
            auctionStages: [{
                name: 'Praça Única',
                startDate: new Date(),
                endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
            }]
        };

        const auctionResult = await callActionAsUser(createAuction, adminUser, extrajudicialAuctionData);
        assert.ok(auctionResult.success && auctionResult.auctionId, 'Failed to create extrajudicial auction');
        console.log('- PASSED: Created Extrajudicial Auction');

        // 2. Create a Lot with an Asset for the new auction
        const lotData: Partial<LotFormData> = {
            title: `Lote com Ativo no Leilão Extrajudicial ${testRunId}`,
            number: '101',
            status: 'ABERTO_PARA_LANCES',
            auctionId: auctionResult.auctionId,
            price: bem.evaluationValue,
            initialPrice: bem.evaluationValue,
            type: category.id,
            assetIds: [bem.id]
        };

        const lotResult = await callActionAsUser(createLot, adminUser, lotData);
        assert.ok(lotResult.success && lotResult.lotId, 'Failed to create lot for the auction');
        console.log('- PASSED: Created Lot and associated Asset');

        // Verify the created data
        const finalAuction = await prisma.auction.findUnique({
            where: { id: auctionResult.auctionId },
            include: { lots: { include: { assets: true } } }
        });

        assert.ok(finalAuction, 'Final auction should be retrievable');
        assert.strictEqual(finalAuction!.lots.length, 1, 'Auction should contain one lot');
        assert.strictEqual(finalAuction!.lots[0].assets.length, 1, 'Lot should contain one asset');
        assert.strictEqual(finalAuction!.lots[0].assets[0].assetId, bem.id, 'Asset ID should match');
        console.log('- PASSED: Database verification complete.');
    });
});

// This file is a test file, but we can execute it via a script if needed.
// For Vitest, it will run automatically with `npm run test`.

// To allow running it as a standalone script:
async function run() {
    console.log("This file is intended to be run as part of the Vitest test suite.");
}

// Check if being run directly
if (require.main === module) {
    run().catch(console.error);
}
```