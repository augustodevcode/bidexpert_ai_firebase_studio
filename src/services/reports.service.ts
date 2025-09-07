// src/services/reports.service.ts
import { prisma } from '@/lib/prisma';
import type { AdminReportData, AdminDashboardStats } from '@/types';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class ReportsService {

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const [users, auctions, lots, sellers] = await Promise.all([
        prisma.user.count(),
        prisma.auction.count(),
        prisma.lot.count(),
        prisma.seller.count(),
      ]);

      return { users, auctions, lots, sellers };
    } catch (error) {
      console.error("[Service - getAdminDashboardStats] Error fetching admin stats:", error);
      return { users: 0, auctions: 0, lots: 0, sellers: 0 };
    }
  }

  async getAdminReportData(): Promise<AdminReportData> {
    try {
        const [
            userCount,
            auctionCount,
            lotCount,
            sellerCount,
            totalRevenueResult,
            newUsersCount,
            activeAuctionsCount,
            lotsSoldCount,
            bids,
            auctionsWithLots,
            soldLotsForCategories,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.auction.count(),
            prisma.lot.count(),
            prisma.seller.count(),
            prisma.lot.aggregate({ _sum: { price: true }, where: { status: 'VENDIDO' } }),
            prisma.user.count({ where: { createdAt: { gte: subDays(new Date(), 30) } } }),
            prisma.auction.count({ where: { status: 'ABERTO_PARA_LANCES' } }),
            prisma.lot.count({ where: { status: 'VENDIDO' } }),
            prisma.bid.findMany({ select: { amount: true } }),
            prisma.auction.findMany({ include: { _count: { select: { lots: true } } } }),
            prisma.lot.findMany({
            where: { status: 'VENDIDO', categoryId: { not: null } },
            select: { categoryId: true, price: true },
            }),
        ]);

        const totalRevenue = totalRevenueResult._sum.price || 0;
        const totalBids = bids.length;
        const averageBidValue = totalBids > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / totalBids : 0;
        const successfulAuctions = auctionsWithLots.filter(a => a._count.lots > 0).length;
        const auctionSuccessRate = auctionCount > 0 ? (successfulAuctions / auctionCount) * 100 : 0;
        const totalLotsInAuctions = auctionsWithLots.reduce((sum, a) => sum + a._count.lots, 0);
        const averageLotsPerAuction = auctionCount > 0 ? totalLotsInAuctions / auctionCount : 0;

        // Aggregate monthly sales
        const salesByMonthMap = new Map<string, number>();
        const soldLotsForSales = await prisma.lot.findMany({ where: { status: 'VENDIDO' }, select: { price: true, updatedAt: true } });
        
        soldLotsForSales.forEach(lot => {
            const monthKey = format(new Date(lot.updatedAt), 'MMM/yy', { locale: ptBR });
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price || 0));
        });
        const salesData = Array.from(salesByMonthMap, ([name, Sales]) => ({ name, Sales }));
        
        // Aggregate sales by category
        const categoryCountMap = new Map<string, number>();
        const categoryIds = [...new Set(soldLotsForCategories.map(lot => lot.categoryId))];
        const categories = await prisma.lotCategory.findMany({ where: { id: { in: categoryIds as string[] } }});
        
        soldLotsForCategories.forEach(lot => {
            const categoryName = categories.find(c => c.id === lot.categoryId)?.name || 'Outros';
            categoryCountMap.set(categoryName, (categoryCountMap.get(categoryName) || 0) + 1);
        });

        const categoryData = Array.from(categoryCountMap, ([name, value]) => ({ name, value }));
        
        return {
            users: userCount,
            auctions: auctionCount,
            lots: lotCount,
            sellers: sellerCount,
            totalRevenue,
            newUsersLast30Days: newUsersCount,
            activeAuctions: activeAuctionsCount,
            lotsSoldCount,
            salesData,
            categoryData,
            averageBidValue,
            auctionSuccessRate,
            averageLotsPerAuction,
        };
    } catch (error) {
        console.error("[Service - getAdminReportDataAction] Error fetching admin report data:", error);
        throw error; // Re-throw to be caught by the action
    }
  }
}
