// tests/payment.service.test.ts
import { describe, test, beforeAll, afterAll, expect, it } from 'vitest';
import assert from 'node:assert';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfileWithPermissions, Lot, Auction, SellerProfileInfo, AuctioneerProfileInfo, LotCategory, UserWin } from '@/types';
import { UserService } from '@/services/user.service';
import { RoleRepository } from '@/repositories/role.repository';
import { processPaymentAction } from '@/app/checkout/[winId]/actions';
import type { CheckoutFormValues } from '@/app/checkout/[winId]/checkout-form-schema';
import { LotService } from '@/services/lot.service';

const userService = new UserService();
const lotService = new LotService();

const testRunId = `payment-e2e-${uuidv4().substring(0, 8)}`;
let testUser: UserProfileWithPermissions;
let testWin: UserWin;
let testLot: Lot;

describe('Payment Service E2E Tests', () => {

    beforeAll(async () => {
        const userRole = await prisma.role.findFirst({where: {name: 'USER'}});
        assert.ok(userRole, "USER role must exist");
        
        const userRes = await userService.createUser({
            fullName: `Pagador ${testRunId}`,
            email: `pagador-${testRunId}@test.com`,
            password: 'password123',
            roleIds: [userRole.id],
            habilitationStatus: 'HABILITADO'
        });
        assert.ok(userRes.success && userRes.userId);
        testUser = (await userService.getUserById(userRes.userId))!;
        
        // Create dummy Lot/Auction for the win
        const seller = await prisma.seller.create({ data: { name: `Seller Pay ${testRunId}`, publicId: `pub-seller-pay-${testRunId}`, slug: `seller-pay-${testRunId}`, isJudicial: false } });
        const auctioneer = await prisma.auctioneer.create({ data: { name: `Auct Pay ${testRunId}`, publicId: `pub-auct-pay-${testRunId}`, slug: `auct-pay-${testRunId}` } });
        const auction = await prisma.auction.create({ data: { title: `Auction Pay ${testRunId}`, publicId: `pub-auc-pay-${testRunId}`, slug: `auc-pay-${testRunId}`, auctioneerId: auctioneer.id, sellerId: seller.id, status: 'FINALIZADO', auctionDate: new Date() } });
        const lotRes = await lotService.createLot({ title: `Lot Pay ${testRunId}`, auctionId: auction.id, price: 1200, status: 'VENDIDO', winnerId: testUser.id } as any);
        assert.ok(lotRes.success && lotRes.lotId);
        testLot = (await lotService.getLotById(lotRes.lotId))!;

        testWin = await prisma.userWin.create({
            data: {
                userId: testUser.id,
                lotId: testLot.id,
                winningBidAmount: 1200.00,
                paymentStatus: 'PENDENTE'
            }
        });
    });
    
    afterAll(async () => {
        try {
            await prisma.installmentPayment.deleteMany({ where: { userWinId: testWin.id } });
            await prisma.userWin.deleteMany({ where: { id: testWin.id } });
            await prisma.lot.deleteMany({ where: { id: testLot.id } });
            const auction = await prisma.auction.findFirst({ where: { title: { contains: `Auction Pay ${testRunId}`}}});
            if(auction) await prisma.auction.delete({ where: { id: auction.id } });
            const seller = await prisma.seller.findFirst({ where: { name: { contains: `Seller Pay ${testRunId}`}}});
            if(seller) await prisma.seller.delete({ where: { id: seller.id } });
            const auctioneer = await prisma.auctioneer.findFirst({ where: { name: { contains: `Auct Pay ${testRunId}`}}});
            if(auctioneer) await prisma.auctioneer.delete({ where: { id: auctioneer.id } });
            await userService.deleteUser(testUser.id);
        } catch (e) {
             console.error(`[PAYMENT TEST CLEANUP] Error during cleanup for run ${testRunId}:`, e);
        }
        await prisma.$disconnect();
    });

    it('should create installment records for a win', async () => {
        // Arrange
        const paymentData: CheckoutFormValues = {
            paymentMethod: 'installments',
            installments: 12
        };

        // Act
        const result = await processPaymentAction(testWin.id, paymentData);

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
