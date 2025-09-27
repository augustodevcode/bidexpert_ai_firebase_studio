// tests/payment.service.test.ts
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfileWithPermissions, Lot, Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, UserWin, Tenant } from '@/types';
import { processPaymentAction } from '@/app/checkout/[winId]/actions';
import type { CheckoutFormValues } from '@/app/checkout/[winId]/checkout-form-schema';
import { callActionAsUser } from './test-utils';

// Mock server-only and next/headers
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }),
  headers: () => new Headers(),
}));
import { createUser, getUserProfileData, deleteUser } from '@/app/admin/users/actions';


const testRunId = `payment-e2e-action-${uuidv4().substring(0, 8)}`;
let testUser: UserProfileWithPermissions;
let testWin: UserWin;
let testLot: Lot;
let testTenant: Tenant;

describe('Payment Action E2E Tests', () => {

    beforeAll(async () => {
        testTenant = await prisma.tenant.create({ data: { name: `Payment Test Tenant ${testRunId}`, subdomain: `payment-${testRunId}` } });
        const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
        assert.ok(userRole, "USER role must exist");

        const userRes = await callActionAsUser(createUser, null, {
            fullName: `Pagador ${testRunId}`,
            email: `pagador-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [userRole.id],
            habilitationStatus: 'HABILITADO',
            tenantId: testTenant.id,
        });
        assert.ok(userRes.success && userRes.userId);
        testUser = (await callActionAsUser(getUserProfileData, null, userRes.userId))!;
        
        await callActionAsUser(tenantContext.run, { tenantId: testTenant.id }, async () => {
            const seller = await prisma.seller.create({ data: { name: `Seller Pay ${testRunId}`, publicId: `pub-seller-pay-${testRunId}`, slug: `seller-pay-${testRunId}`, isJudicial: false, tenantId: testTenant.id } });
            const auctioneer = await prisma.auctioneer.create({ data: { name: `Auct Pay ${testRunId}`, publicId: `pub-auct-pay-${testRunId}`, slug: `auct-pay-${testRunId}`, tenantId: testTenant.id } });
            const auction = await prisma.auction.create({ data: { title: `Auction Pay ${testRunId}`, publicId: `pub-auc-pay-${testRunId}`, slug: `auc-pay-${testRunId}`, auctioneerId: auctioneer.id, sellerId: seller.id, status: 'FINALIZADO', auctionDate: new Date(), tenantId: testTenant.id } });
            testLot = (await prisma.lot.create({ data: { title: `Lot Pay ${testRunId}`, auctionId: auction.id, price: 1200, status: 'VENDIDO', winnerId: testUser.id, tenantId: testTenant.id, type: 'GENERAL' } })) as Lot;
        });

        testWin = (await prisma.userWin.create({
            data: {
                userId: testUser.id,
                lotId: testLot.id,
                winningBidAmount: 1200.00,
                paymentStatus: 'PENDENTE'
            },
            include: { lot: true }
        })) as UserWin;
    });
    
    afterAll(async () => {
        try {
            await prisma.installmentPayment.deleteMany({ where: { userWinId: testWin.id } });
            await prisma.userWin.deleteMany({ where: { id: testWin.id } });
            await prisma.lot.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.auction.deleteMany({ where: { title: { contains: testRunId } } });
            await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
            await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
            await deleteUser(testUser.id);
            await prisma.tenant.delete({ where: { id: testTenant.id }});
        } catch (e) {
             console.error(`[PAYMENT TEST CLEANUP] Error during cleanup for run ${testRunId}:`, e);
        }
        await prisma.$disconnect();
    });

    it('should create installment records for a win via action', async () => {
        // Arrange
        const paymentData: CheckoutFormValues = {
            paymentMethod: 'installments',
            installments: 12
        };

        // Act
        const result = await callActionAsUser(processPaymentAction, testUser, testWin.id, paymentData);

        // Assert
        assert.ok(result.success, `Installment processing should succeed. Message: ${result.message}`);

        const installments = await prisma.installmentPayment.findMany({
            where: { userWinId: testWin.id },
            orderBy: { installmentNumber: 'asc' },
        });

        assert.strictEqual(installments.length, 12, 'Should create 12 installment records');
        assert.strictEqual(installments[0].installmentNumber, 1, 'First installment number should be 1');
        assert.strictEqual(installments[11].installmentNumber, 12, 'Last installment number should be 12');
        
        const updatedWin = await prisma.userWin.findUnique({ where: { id: testWin.id }});
        assert.strictEqual(updatedWin?.paymentStatus, 'PROCESSANDO', 'Win status should be updated to PROCESSANDO');
    });
});
