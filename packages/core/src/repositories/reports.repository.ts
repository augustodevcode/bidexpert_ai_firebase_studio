// packages/core/src/repositories/reports.repository.ts
import { prisma } from '../lib/prisma';
import { subDays } from 'date-fns';

export class ReportsRepository {
  async countUsers(): Promise<number> {
    return prisma.user.count();
  }

  async countAuctions(): Promise<number> {
    return prisma.auction.count();
  }

  async countLots(): Promise<number> {
    return prisma.lot.count();
  }

  async countSellers(): Promise<number> {
    return prisma.seller.count();
  }

  async getTotalRevenue(): Promise<number> {
    const result = await prisma.lot.aggregate({
      _sum: { price: true },
      where: { status: 'VENDIDO' },
    });
    return result._sum.price || 0;
  }

  async getNewUsersCount(days: number): Promise<number> {
    return prisma.user.count({
      where: { createdAt: { gte: subDays(new Date(), days) } },
    });
  }

  async countActiveAuctions(): Promise<number> {
    return prisma.auction.count({
      where: { status: 'ABERTO_PARA_LANCES' },
    });
  }

  async countSoldLots(): Promise<number> {
    return prisma.lot.count({
      where: { status: 'VENDIDO' },
    });
  }

  async getAllBids(): Promise<{ amount: number }[]> {
    return prisma.bid.findMany({ select: { amount: true } });
  }

  async getAuctionsWithLotCounts() {
    return prisma.auction.findMany({
      include: { _count: { select: { lots: true } } },
    });
  }

  async getSoldLotsByCategory() {
    return prisma.lot.findMany({
      where: { status: 'VENDIDO', categoryId: { not: null } },
      select: { categoryId: true, price: true },
    });
  }

  async getSoldLotsForSalesData() {
    return prisma.lot.findMany({
      where: { status: 'VENDIDO' },
      select: { price: true, updatedAt: true },
    });
  }

  async getAllCategories() {
      return prisma.lotCategory.findMany({ select: { id: true, name: true }});
  }
}
