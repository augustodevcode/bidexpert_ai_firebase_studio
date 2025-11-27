// tests/lot.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { LotFormData, Auction, Bem, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, Lot, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createLot, deleteLot } from '@/app/admin/lots/actions';
import { createAuction, deleteAuction } from '@/app/admin/auctions/actions';
import { createBem, deleteBem } from '@/app/admin/bens/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createAuctioneer } from '@/app/admin/auctioneers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';


const testRunId = `lot-e2e-action-${uuidv4().substring(0, 8)}`;
const testLotTitle = `Lote de Teste E2E ${testRunId}`;

let testAuction: Auction;
let testBem: Bem;
let testSeller: SellerProfileInfo;
let testAuctioneer: AuctioneerProfileInfo;
let testCategory: LotCategory;
let createdLotId: string | undefined;
let testTenant: Tenant;
let adminUser: any;


describe('Lot Actions E2E Tests', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - lot.test.ts - ${testRunId}] Starting...`);
        // Criar um tenant dedicado para este teste
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-tenant-${testRunId}` } });
        
        // Criar usuário admin para o tenant
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        const adminRes = await createUser({
            fullName: `Admin For Lot Test ${testRunId}`,
            email: `admin-for-lot-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        assert.ok(adminUser, "Could not retrieve admin user profile");

        // Criar dependências dentro do contexto do tenant
        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Lotes ${testRunId}`, slug: `cat-lotes-${testRunId}`, hasSubcategories: false }
        });
        const auctioneerRes = await callActionAsUser(createAuctioneer, adminUser, { name: `Leiloeiro Teste Lotes ${testRunId}` } as any);
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Comitente Teste Lotes ${testRunId}`, isJudicial: false } as any);
        assert.ok(auctioneerRes.success && auctioneerRes.auctioneerId && sellerRes.success && sellerRes.sellerId, "Failed to setup dependencies");
        
        testAuctioneer = (await prisma.auctioneer.findUnique({where: {id: auctioneerRes.auctioneerId}}))!;
        testSeller = (await prisma.seller.findUnique({where: {id: sellerRes.sellerId}}))!;

        const auctionRes = await callActionAsUser(createAuction, adminUser, { 
            title: `Leilão para Lotes ${testRunId}`, 
            auctioneerId: testAuctioneer.id,
            sellerId: testSeller.id,
            categoryId: testCategory.id,
            status: 'ABERTO_PARA_LANCES'
        } as any);
        assert.ok(auctionRes.success && auctionRes.auctionId, "Failed to create test auction");
        testAuction = (await prisma.auction.findUnique({where: {id: auctionRes.auctionId}}))!;

        const bemRes = await callActionAsUser(createBem, adminUser, {
            title: `Bem de Teste para Lote ${testRunId}`,
            status: 'DISPONIVEL',
            categoryId: testCategory.id,
            sellerId: testSeller.id,
            evaluationValue: 1500.00
        } as any);
        assert.ok(bemRes.success && bemRes.bemId, "Failed to create test bem");
        testBem = (await prisma.bem.findUnique({where: {id: bemRes.bemId}}))!;
        
        console.log(`[E2E Setup - lot.test.ts - ${testRunId}] Complete.`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - lot.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdLotId) await callActionAsUser(deleteLot, adminUser, createdLotId);
            if (testBem) await callActionAsUser(deleteBem, adminUser, testBem.id);
            if (testAuction) await callActionAsUser(deleteAuction, adminUser, testAuction.id);
            if (testSeller) await callActionAsUser(deleteSeller, adminUser, testSeller.id);
            if (testAuctioneer) await callActionAsUser(deleteAuctioneer, adminUser, testAuctioneer.id);
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (adminUser) await deleteUser(adminUser.id);
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[LOT TEST CLEANUP] Error during cleanup:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new lot with a bem via server action', async () => {
        // Arrange
        const newLotData: Partial<LotFormData> = {
            title: testLotTitle,
            number: '001-TEST',
            description: 'Um lote criado para o teste E2E via action, contendo um bem.',
            status: 'ABERTO_PARA_LANCES',
            auctionId: testAuction.id,
            price: 2000,
            initialPrice: 1500,
            type: testCategory.id, // 'type' no form é o nosso 'categoryId'
            bemIds: [testBem.id], // Link the bem
        };

        // Act
        const result = await callActionAsUser(createLot, adminUser, newLotData);
        createdLotId = result.lotId; // Store for cleanup

        // Assert
        assert.strictEqual(result.success, true, 'createLot action should return success: true');
        assert.ok(result.lotId, 'createLot action should return a lotId');

        const createdLotFromDb = await prisma.lot.findUnique({
            where: { id: result.lotId },
            include: { bens: true }
        });

        assert.ok(createdLotFromDb, 'Lot should be found in the database after creation');
        assert.ok(createdLotFromDb.publicId, 'Lot should have a publicId generated');
        assert.strictEqual(createdLotFromDb.title, newLotData.title, 'Lot title should match');
        assert.strictEqual(createdLotFromDb.auctionId, testAuction.id, 'Lot auctionId should match');
        assert.strictEqual(createdLotFromDb.bens.length, 1, 'Lot should be linked to 1 bem');
        assert.strictEqual(createdLotFromDb.bens[0].bemId, testBem.id, 'The linked bemId should be correct');
    });
});
