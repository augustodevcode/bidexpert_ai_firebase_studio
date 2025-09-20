// tests/direct-sale-offer.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createDirectSaleOffer, deleteDirectSaleOffer } from '@/app/admin/direct-sales/actions';
import { createSeller } from '@/app/admin/sellers/actions';
import { createUser, getUserProfileData } from '@/app/admin/users/actions';
import { callActionAsUser } from './test-utils';
import type { DirectSaleOfferFormData, SellerProfileInfo, LotCategory, Tenant } from '@/types';

const testRunId = `dso-e2e-action-${uuidv4().substring(0, 8)}`;
let testSeller: SellerProfileInfo;
let testCategory: LotCategory;
let createdOfferId: string | undefined;
let testTenant: Tenant;
let adminUser: any;

describe('Direct Sale Offer Actions E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `dso-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin DSO Test ${testRunId}`,
            email: `admin-dso-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user");
        adminUser = await getUserProfileData(adminRes.userId);
        assert.ok(adminUser, "Failed to fetch admin user profile");

        testCategory = await prisma.lotCategory.create({ data: { name: `Cat DSO ${testRunId}`, slug: `cat-dso-${testRunId}`, hasSubcategories: false } });
        
        const sellerRes = await callActionAsUser(createSeller, adminUser, { name: `Seller DSO ${testRunId}`, isJudicial: false } as any);
        assert.ok(sellerRes.success && sellerRes.sellerId);
        testSeller = (await prisma.seller.findUnique({ where: { id: sellerRes.sellerId } }))!;
    });

    afterAll(async () => {
        try {
            if (createdOfferId) await callActionAsUser(deleteDirectSaleOffer, adminUser, createdOfferId);
            if (testSeller) await prisma.seller.delete({ where: { id: testSeller.id } });
            if (testCategory) await prisma.lotCategory.delete({ where: { id: testCategory.id } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id } });
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error(`[DSO TEST CLEANUP] - Failed to delete records for run ${testRunId}:`, error);
        }
        await prisma.$disconnect();
    });

    it('should create a new direct sale offer via action and verify it', async () => {
        // Arrange
        const newOfferData: DirectSaleOfferFormData = {
            title: `Item de Venda Direta ${testRunId}`,
            description: 'Item de teste para venda direta.',
            offerType: 'BUY_NOW',
            status: 'ACTIVE',
            price: 150.00,
            categoryId: testCategory.id,
            sellerId: testSeller.id,
        };

        // Act
        const result = await callActionAsUser(createDirectSaleOffer, adminUser, newOfferData);
        createdOfferId = result.offerId;

        // Assert
        assert.ok(result.success, 'createDirectSaleOffer should succeed');
        assert.ok(result.offerId, 'A new offerId should be returned');

        const createdOffer = await prisma.directSaleOffer.findUnique({ where: { id: result.offerId } });
        assert.ok(createdOffer, 'Created offer should be found in DB');
        assert.strictEqual(createdOffer.title, newOfferData.title);
        assert.strictEqual(createdOffer.price, 150.00);
        assert.strictEqual(createdOffer.sellerId, testSeller.id);
        assert.strictEqual(createdOffer.tenantId, testTenant.id, "Offer should have the correct tenantId");
    });
});
