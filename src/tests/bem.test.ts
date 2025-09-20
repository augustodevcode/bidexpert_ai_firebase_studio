// tests/bem.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { BemFormData, SellerProfileInfo, LotCategory, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createBem } from '@/app/admin/bens/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `bem-e2e-action-${uuidv4().substring(0, 8)}`;
const testBemTitle = `Automóvel de Teste (Bem) ${testRunId}`;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let createdBemId: string | undefined;
let testTenant: Tenant;
let adminUser: any;


describe('Bem Actions E2E Tests', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - bem.test.ts - ${testRunId}] Starting...`);
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-bem-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Bem Test ${testRunId}`,
            email: `admin-for-bem-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Clean up previous test runs to ensure a clean slate
        await prisma.bem.deleteMany({ where: { title: testBemTitle }});
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } }});
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } }});

        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Bens ${testRunId}`, slug: `cat-bens-${testRunId}`, hasSubcategories: false }
        });
        
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Comitente Teste Bens ${testRunId}`, isJudicial: false } as any);
        assert.ok(sellerRes.success && sellerRes.sellerId, "Failed to create test seller");
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;
        
        console.log(`[E2E Setup - bem.test.ts - ${testRunId}] Complete.`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - bem.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdBemId) await prisma.bem.delete({ where: { id: createdBemId } });
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
             console.error(`[BEM TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new bem via action and verify it in the database', async () => {
        // Arrange
        const newBemData: BemFormData = {
            title: testBemTitle,
            description: 'Um bem criado para o teste E2E.',
            status: 'DISPONIVEL',
            categoryId: testCategory.id,
            sellerId: testSeller.id,
            evaluationValue: 50000,
        };

        // Act
        const result = await callActionAsUser(createBem, adminUser, newBemData);
        createdBemId = result.bemId;

        // Assert
        assert.strictEqual(result.success, true, 'createBem action should return success: true');
        assert.ok(result.bemId, 'createBem action should return a bemId');

        const createdBemFromDb = await prisma.bem.findUnique({
            where: { id: result.bemId },
        });

        console.log('--- Bem Record Found in DB ---');
        console.log(createdBemFromDb);
        console.log('------------------------------');

        assert.ok(createdBemFromDb, 'Bem should be found in the database after creation');
        assert.ok(createdBemFromDb.publicId, 'Bem should have a publicId generated');
        assert.strictEqual(createdBemFromDb.title, newBemData.title, 'Bem title should match');
        assert.strictEqual(createdBemFromDb.status, 'DISPONIVEL', 'Bem status should be correct');
        assert.strictEqual(createdBemFromDb.sellerId, testSeller.id, 'Bem sellerId should match');
        assert.strictEqual(createdBemFromDb.tenantId, testTenant.id, 'Bem tenantId should match the context');
    });
});
