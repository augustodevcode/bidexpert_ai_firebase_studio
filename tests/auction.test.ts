// tests/auction.test.ts
import { describe, it, beforeAll, afterAll } from 'vitest';
import assert from 'node:assert';
import { AuctionService } from '../src/services/auction.service';
import { prisma } from '../src/lib/prisma';
import type { AuctionFormData, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction } from '../src/types';
import { v4 as uuidv4 } from 'uuid';

const auctionService = new AuctionService();
const testRunId = `auction-e2e-${uuidv4().substring(0, 8)}`;
const testAuctionTitle = `Super Leilão Completo de Teste ${testRunId}`;

let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdAuctionId: string | undefined;
let tenant: any;

describe('Auction Service E2E Tests (Full)', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Starting...`);
        // Create tenant
        tenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-${testRunId}` } });

        // Clean up previous test runs to ensure a clean slate
        await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });

        // Create dependency records
        testCategory = await prisma.lotCategory.create({
            data: { name: `Cat. Leilões ${testRunId}`, slug: `cat-leiloes-${testRunId}`, hasSubcategories: false }
        });
        testAuctioneer = await prisma.auctioneer.create({
            data: { name: `Leiloeiro Leilões ${testRunId}`, publicId: `leiloeiro-pub-${testRunId}`, slug: `leiloeiro-leiloes-${testRunId}`, tenantId: tenant.id }
        });
        testSeller = await prisma.seller.create({
            data: { name: `Comitente Leilões ${testRunId}`, publicId: `seller-pub-${testRunId}`, slug: `comitente-leiloes-${testRunId}`, isJudicial: false, tenantId: tenant.id }
        });
        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Complete.`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdAuctionId) {
                // Cascading delete should handle stages, so we just delete the auction.
                await prisma.auction.deleteMany({ where: { id: createdAuctionId }});
            }
            if (testSeller) await prisma.seller.deleteMany({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.deleteMany({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.deleteMany({ where: { id: testCategory.id } });
            if (tenant) await prisma.tenant.deleteMany({ where: { id: tenant.id } });
        } catch (error) {
            console.error(`[AUCTION TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Complete.`);
    });

    it('should create a new auction with all fields and verify it in the database', async () => {
        // Arrange
        const startDate = new Date();
        const endDateStage1 = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days later
        const endDateStage2 = new Date(endDateStage1.getTime() + 5 * 24 * 60 * 60 * 1000); // 10 days later

        const newAuctionData: Partial<AuctionFormData> = {
            title: testAuctionTitle,
            description: 'Um leilão completo criado para o teste E2E, com todos os campos.',
            status: 'EM_BREVE',
            auctioneerId: testAuctioneer.id,
            sellerId: testSeller.id,
            categoryId: testCategory.id,
            auctionType: 'EXTRAJUDICIAL',
            participation: 'HIBRIDO',
            auctionMethod: 'STANDARD',
            onlineUrl: 'https://meet.google.com/xyz-abc-def',
            address: 'Rua do Leilão, 123',
            zipCode: '12345-000',
            imageUrl: 'https://placehold.co/800x600.png',
            documentsUrl: 'https://placehold.co/docs/edital.pdf',
            isFeaturedOnMarketplace: true,
            marketplaceAnnouncementTitle: `OPORTUNIDADE ÚNICA: ${testAuctionTitle}`,
            softCloseEnabled: true,
            softCloseMinutes: 3,
            allowInstallmentBids: true,
            auctionStages: [
                { name: '1ª Praça', startDate: startDate, endDate: endDateStage1, initialPrice: 10000 },
                { name: '2ª Praça', startDate: endDateStage1, endDate: endDateStage2, initialPrice: 5000 },
            ]
        };

        // Act
        const result = await auctionService.createAuction(tenant.id, newAuctionData);
        createdAuctionId = result.auctionId; // Store for cleanup

        // Assert: Check the service method result
        assert.strictEqual(result.success, true, 'AuctionService.createAuction should return success: true');
