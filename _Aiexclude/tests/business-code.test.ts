// tests/business-code.test.ts
/**
 * @fileoverview Testes de integração para o BusinessCodeService e o middleware do Prisma.
 * Garante que os códigos de negócio são gerados corretamente e são únicos para cada entidade.
 */

import { prisma } from '@/lib/prisma';
import { BusinessCodeService } from '@/services/business-code.service';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const tenantId = '1'; // Usar um tenantId fixo para testes
const businessCodeService = new BusinessCodeService();

describe('BusinessCodeService and Prisma Middleware Integration', () => {
  beforeAll(async () => {
    // Limpar dados de teste antes de rodar os testes
    await prisma.bid.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.userWin.deleteMany({ where: { lot: { tenantId: BigInt(tenantId) } } });
    await prisma.userLotMaxBid.deleteMany({ where: { lot: { tenantId: BigInt(tenantId) } } });
    await prisma.lotQuestion.deleteMany({ where: { lot: { tenantId: BigInt(tenantId) } } });
    await prisma.review.deleteMany({ where: { auction: { tenantId: BigInt(tenantId) } } });
    await prisma.userDocument.deleteMany({ where: { user: { tenants: { some: { tenantId: BigInt(tenantId) } } } } });
    await prisma.notification.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.auctionHabilitation.deleteMany({ where: { auction: { tenantId: BigInt(tenantId) } } });
    await prisma.mediaItem.deleteMany({ where: { uploadedBy: { tenants: { some: { tenantId: BigInt(tenantId) } } } } });
    await prisma.usersOnRoles.deleteMany({ where: { user: { tenants: { some: { tenantId: BigInt(tenantId) } } } } });
    await prisma.usersOnTenants.deleteMany({ where: { tenantId: BigInt(tenantId) } } );

    await prisma.auction.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.lot.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.seller.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.auctioneer.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.asset.deleteMany({ where: { tenantId: BigInt(tenantId) } });
    await prisma.lotCategory.deleteMany({ where: { id: { gt: BigInt(1) } } }); // Keep default category
    await prisma.subcategory.deleteMany({ where: { id: { gt: BigInt(1) } } }); // Keep default subcategory
    await prisma.user.deleteMany({ where: { id: { gt: BigInt(1) } } }); // Keep default user

    // Ensure platform settings exist for the tenant
    await prisma.platformSettings.upsert({
      where: { tenantId: BigInt(tenantId) },
      update: {
        auctionCodeMask: 'AUC-YYYYMM-NNNNN',
        lotCodeMask: 'LOT-YYYYMM-NNNNN',
        sellerCodeMask: 'SEL-YYYYMM-NNNNN',
        userCodeMask: 'USR-YYYYMM-NNNNN',
        auctioneerCodeMask: 'AUE-YYYYMM-NNNNN',
        assetCodeMask: 'AST-YYYYMM-NNNNN',
        categoryCodeMask: 'CAT-YYYYMM-NNNNN',
        subcategoryCodeMask: 'SBC-YYYYMM-NNNNN',
      },
      create: {
        tenantId: BigInt(tenantId),
        auctionCodeMask: 'AUC-YYYYMM-NNNNN',
        lotCodeMask: 'LOT-YYYYMM-NNNNN',
        sellerCodeMask: 'SEL-YYYYMM-NNNNN',
        userCodeMask: 'USR-YYYYMM-NNNNN',
        auctioneerCodeMask: 'AUE-YYYYMM-NNNNN',
        assetCodeMask: 'AST-YYYYMM-NNNNN',
        categoryCodeMask: 'CAT-YYYYMM-NNNNN',
        subcategoryCodeMask: 'SBC-YYYYMM-NNNNN',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate unique codes for Auctions', async () => {
    const auction1 = await prisma.auction.create({
      data: {
        title: 'Test Auction 1',
        slug: 'test-auction-1',
        tenantId: BigInt(tenantId),
        auctioneer: { create: { name: 'Test Auctioneer', slug: 'test-auctioneer', tenantId: BigInt(tenantId), publicId: 'test-auc-pub-id' } },
        seller: { create: { name: 'Test Seller', slug: 'test-seller', tenantId: BigInt(tenantId), publicId: 'test-sel-pub-id' } },
      },
    });

    const auction2 = await prisma.auction.create({
      data: {
        title: 'Test Auction 2',
        slug: 'test-auction-2',
        tenantId: BigInt(tenantId),
        auctioneer: { create: { name: 'Test Auctioneer 2', slug: 'test-auctioneer-2', tenantId: BigInt(tenantId), publicId: 'test-auc-pub-id-2' } },
        seller: { create: { name: 'Test Seller 2', slug: 'test-seller-2', tenantId: BigInt(tenantId), publicId: 'test-sel-pub-id-2' } },
      },
    });

    expect(auction1.codigo).toBeDefined();
    expect(auction2.codigo).toBeDefined();
    expect(auction1.codigo).not.toEqual(auction2.codigo);
    expect(auction1.codigo).toMatch(/^AUC-\d{6}-\d{5}$/);
  });

  it('should generate unique codes for Lots', async () => {
    const auction = await prisma.auction.create({
      data: {
        title: 'Test Auction for Lots',
        slug: 'test-auction-for-lots',
        tenantId: BigInt(tenantId),
        auctioneer: { create: { name: 'Test Auctioneer for Lots', slug: 'test-auctioneer-for-lots', tenantId: BigInt(tenantId), publicId: 'test-auc-pub-id-lots' } },
        seller: { create: { name: 'Test Seller for Lots', slug: 'test-seller-for-lots', tenantId: BigInt(tenantId), publicId: 'test-sel-pub-id-lots' } },
      },
    });

    const lot1 = await prisma.lot.create({
      data: {
        title: 'Test Lot 1',
        slug: 'test-lot-1',
        price: 100,
        auctionId: auction.id,
        tenantId: BigInt(tenantId),
      },
    });

    const lot2 = await prisma.lot.create({
      data: {
        title: 'Test Lot 2',
        slug: 'test-lot-2',
        price: 200,
        auctionId: auction.id,
        tenantId: BigInt(tenantId),
      },
    });

    expect(lot1.codigo).toBeDefined();
    expect(lot2.codigo).toBeDefined();
    expect(lot1.codigo).not.toEqual(lot2.codigo);
    expect(lot1.codigo).toMatch(/^LOT-\d{6}-\d{5}$/);
  });

  // Add similar tests for Seller, User, Auctioneer, Asset, LotCategory, Subcategory
});
