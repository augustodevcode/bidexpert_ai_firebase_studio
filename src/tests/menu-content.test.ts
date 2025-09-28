// tests/menu-content.test.ts
import { describe, test, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import type { LotCategory, SellerProfileInfo, AuctioneerProfileInfo, Tenant } from '../src/types';
import { v4 as uuidv4 } from 'uuid';
import { callActionAsUser } from './test-utils';

// Mock server-only to allow testing server actions
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData } from '@/app/admin/users/actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import { getSellers } from '@/app/admin/sellers/actions';
import { getAuctioneers } from '@/app/admin/auctioneers/actions';


const testRunId = `menu-e2e-action-${uuidv4().substring(0, 8)}`;
const testCategoryName = "Test Menu Category";
const testSellerName = "Test Menu Seller";
const testAuctioneerName = "Test Menu Auctioneer";
let testTenant: Tenant;
let adminUser: any;

describe('Dynamic Menu Content Data Validation (via Actions)', () => {

    beforeAll(async () => {
        console.log('--- E2E Menu Test: Creating prerequisite data... ---');
        testTenant = await prisma.tenant.create({ data: { name: `Test Tenant ${testRunId}`, subdomain: `test-menu-${testRunId}` } });
        const adminRole = await prisma.role.upsert({ where: { nameNormalized: 'ADMINISTRATOR' }, update: {}, create: { id: 'role-admin', name: 'Administrator', nameNormalized: 'ADMINISTRATOR', permissions: ['manage_all'] } });
        
        const adminRes = await createUser({
            fullName: `Admin For Menu Test ${testRunId}`,
            email: `admin-for-menu-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [adminRole.id],
            tenantId: testTenant.id,
        });
        assert.ok(adminRes.success && adminRes.userId, "Failed to create admin user for test setup");
        adminUser = await getUserProfileData(adminRes.userId);
        
        await prisma.lotCategory.create({ data: { name: testCategoryName, slug: 'test-menu-category', hasSubcategories: false } });
        await prisma.seller.create({ data: { name: testSellerName, slug: 'test-menu-seller', publicId: 'seller-menu-test', isJudicial: false, tenantId: testTenant.id } });
        await prisma.auctioneer.create({ data: { name: testAuctioneerName, slug: 'test-menu-auctioneer', publicId: 'auctioneer-menu-test', tenantId: testTenant.id } });
        console.log('--- E2E Menu Test: Prerequisite data created. ---');
    });

    afterAll(async () => {
        console.log('--- E2E Menu Test: Cleaning up test data... ---');
        try {
            await prisma.lotCategory.deleteMany({ where: { name: testCategoryName } });
            await prisma.seller.deleteMany({ where: { name: testSellerName } });
            await prisma.auctioneer.deleteMany({ where: { name: testAuctioneerName } });
            if (adminUser) await prisma.user.delete({ where: { id: adminUser.id }});
            if (testTenant) await prisma.tenant.delete({ where: { id: testTenant.id } });
        } catch (error) {
            console.error('Error during menu test cleanup:', error);
        }
        await prisma.$disconnect();
    });

    it('should fetch categories via action for the menu', async () => {
        // Act
        const dbCategories = await callActionAsUser(getLotCategories, null);
        const testCategory = dbCategories.find(c => c.name === testCategoryName);
        
        // Assert
        assert.ok(dbCategories.length > 0, 'Should fetch at least one category');
        assert.ok(testCategory, `The test category "${testCategoryName}" should be found`);
    });

    it('should fetch consignors via action for the menu', async () => {
        // Act
        const dbSellers = await callActionAsUser(getSellers, adminUser, true);
        const testSeller = dbSellers.find(s => s.name === testSellerName);
        
        // Assert
        assert.ok(dbSellers.length > 0, 'Should fetch at least one seller');
        assert.ok(testSeller, `The test seller "${testSellerName}" should be found`);
    });
    
    it('should fetch auctioneers via action for the menu', async () => {
        // Act
        const dbAuctioneers = await callActionAsUser(getAuctioneers, adminUser, true);
        const testAuctioneer = dbAuctioneers.find(a => a.name === testAuctioneerName);

        // Assert
        assert.ok(dbAuctioneers.length > 0, 'Should fetch at least one auctioneer');
        assert.ok(testAuctioneer, `The test auctioneer "${testAuctioneerName}" should be found`);
    });
});
