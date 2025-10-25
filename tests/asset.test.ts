// tests/asset.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { AssetFormData, SellerProfileInfo, LotCategory, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only para permitir testes de server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createAsset } from '@/app/admin/assets/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';

const testRunId = `asset-e2e-action-${uuidv4().substring(0, 8)}`;
const testAssetTitle = `Automóvel de Teste (Asset) ${testRunId}`;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let createdAssetId: string | undefined;
let testTenant: Tenant;
let adminUser: any;


describe('Asset Actions E2E Tests', () => {

    beforeAll(async () => {
        console.log(`[E2E Setup - asset.test.ts - ${testRunId}] Starting...`);
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-asset-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Asset Test ${testRunId}`,
            email: `admin-for-asset-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        // Clean up previous test runs to ensure a clean slate
        await prisma.asset.deleteMany({ where: { title: testAssetTitle }});
        await prisma.seller.deleteMany({ where: { name: { contains: testRunId } }});
        await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } }});

        testCategory = await prisma.lotCategory.create({
            data: { name: `Categoria Teste Assets ${testRunId}`, slug: `cat-assets-${testRunId}`, hasSubcategories: false }
        });
        
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Comitente Teste Assets ${testRunId}`, isJudicial: false } as any);
        assert.ok(sellerRes.success && sellerRes.sellerId, "Failed to create test seller");
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;
        
        console.log(`[E2E Setup - asset.test.ts - ${testRunId}] Complete.`);
    });

    afterAll(async () => {
        console.log(`[E2E Teardown - asset.test.ts - ${testRunId}] Cleaning up...`);
        try {
            if (createdAssetId) await prisma.asset.delete({ where: { id: createdAssetId } });
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
             console.error(`[ASSET TEST CLEANUP] - Failed to delete records for test run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new asset via action and verify it in the database', async () => {
        // Arrange
        const newAssetData: AssetFormData = {
            title: testAssetTitle,
            description: 'Um ativo criado para o teste E2E.',
            status: 'DISPONIVEL',
            categoryId: testCategory.id,
            sellerId: testSeller.id,
            evaluationValue: 50000,
        };

        // Act
        const result = await callActionAsUser(createAsset, adminUser, newAssetData);
        createdAssetId = result.assetId;

        // Assert
        assert.strictEqual(result.success, true, 'createAsset action should return success: true');
        assert.ok(result.assetId, 'createAsset action should return a assetId');

        const createdAssetFromDb = await prisma.asset.findUnique({
            where: { id: result.assetId },
        });

        console.log('--- Asset Record Found in DB ---');
        console.log(createdAssetFromDb);
        console.log('------------------------------');

        assert.ok(createdAssetFromDb, 'Asset should be found in the database after creation');
        assert.ok(createdAssetFromDb.publicId, 'Asset should have a publicId generated');
        assert.strictEqual(createdAssetFromDb.title, newAssetData.title, 'Asset title should match');
        assert.strictEqual(createdAssetFromDb.status, 'DISPONIVEL', 'Asset status should be correct');
        assert.strictEqual(createdAssetFromDb.sellerId, testSeller.id, 'Asset sellerId should match');
        assert.strictEqual(createdAssetFromDb.tenantId, testTenant.id, 'Asset tenantId should match the context');
    });
});
