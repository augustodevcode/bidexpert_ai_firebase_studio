// tests/auction.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { AuctionFormData, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Auction, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createAuction } from '@/app/admin/auctions/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `auction-e2e-action-${uuidv4().substring(0, 8)}`;
const testAuctionTitle = `Super Leilão Completo de Teste ${testRunId}`;

let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdAuctionId: string | undefined;
let testTenant: Tenant;
let adminUser: any;

describe('Auction Actions E2E Tests (Full)', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Starting...`);
        // Criar um tenant dedicado para este teste
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-${testRunId}` } });
        
        // Criar usuário admin para o tenant
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        const adminRes = await createUser({
            fullName: `Admin For Auction Test ${testRunId}`,
            email: `admin-for-auction-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        assert.ok(adminUser, "Could not retrieve admin user profile");


        // Limpar dados de execuções anteriores para garantir um estado limpo
        await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });

        // Criar registros de dependência DENTRO do contexto do tenant
        testCategory = await prisma.lotCategory.create({
            data: { name: `Cat. Leilões ${testRunId}`, slug: `cat-leiloes-${testRunId}`, hasSubcategories: false }
        });
        
        const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Leiloeiro Leilões ${testRunId}` } as any);
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Comitente Leilões ${testRunId}`, isJudicial: false } as any);

        assert.ok(auctioneerRes.success && auctioneerRes.auctioneerId, "Failed to create test auctioneer");
        assert.ok(sellerRes.success && sellerRes.sellerId, "Failed to create test seller");
        
        testAuctioneer = (await prisma.auctioneer.findUnique({ where: { id: auctioneerRes.auctioneerId } }))!;
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;

        console.log(`[E2E Setup - auction.test.ts - ${testRunId}] Complete.`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdAuctionId) await prisma.auction.deleteMany({ where: { id: createdAuctionId } });
            if (testSeller) await prisma.seller.deleteMany({ where: { id: testSeller.id } });
            if (testAuctioneer) await prisma.auctioneer.deleteMany({ where: { id: testAuctioneer.id } });
            if (testCategory) await prisma.lotCategory.deleteMany({ where: { id: testCategory.id } });
            if (adminUser) await prisma.user.deleteMany({ where: { id: adminUser.id } });
            if (testTenant) await prisma.tenant.deleteMany({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[AUCTION TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
        console.log(`[E2E Teardown - auction.test.ts - ${testRunId}] Complete.`);
    });

    it('should create a new auction with all fields via server action and verify it in the database', async () => {
        // Arrange
        const startDate = new Date();
        const endDateStage1 = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        const endDateStage2 = new Date(endDateStage1.getTime() + 5 * 24 * 60 * 60 * 1000);

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
            auctionStages: [
                { name: '1ª Praça', startDate: startDate, endDate: endDateStage1, initialPrice: 10000 },
                { name: '2ª Praça', startDate: endDateStage1, endDate: endDateStage2, initialPrice: 5000 },
            ]
        };

        // Act
        const result = await callActionAsUser(createAuction, adminUser, newAuctionData);
        createdAuctionId = result.auctionId;

        // Assert: Check the action result
        assert.strictEqual(result.success, true, 'createAuction action should return success: true');
        assert.ok(result.auctionId, 'createAuction action should return an auctionId');

        // Assert: Verify directly in the database
        const createdAuctionFromDb = await prisma.auction.findUnique({
            where: { id: result.auctionId },
            include: { stages: true }
        });

        assert.ok(createdAuctionFromDb, 'Auction should be found in the database');
        assert.strictEqual(createdAuctionFromDb.title, testAuctionTitle, 'Title should match');
        assert.strictEqual(createdAuctionFromDb.auctioneerId, testAuctioneer.id, 'Auctioneer ID should match');
        assert.strictEqual(createdAuctionFromDb.sellerId, testSeller.id, 'Seller ID should match');
        assert.strictEqual(createdAuctionFromDb.stages.length, 2, 'Should have 2 stages');
        assert.strictEqual(createdAuctionFromDb.tenantId, testTenant.id, 'Auction should belong to the correct tenant');
    });
});
