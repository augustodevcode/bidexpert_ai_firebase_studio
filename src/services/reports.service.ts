// src/services/reports.service.ts
import { ReportsRepository } from '@/repositories/reports.repository';
import type { AdminReportData, AdminDashboardStats } from '@/types';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export class ReportsService {
  private repository: ReportsRepository;

  constructor() {
    this.repository = new ReportsRepository();
  }

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const [users, auctions, lots, sellers] = await Promise.all([
        this.repository.countUsers(),
        this.repository.countAuctions(),
        this.repository.countLots(),
        this.repository.countSellers(),
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
            totalRevenue,
            newUsersCount,
            activeAuctionsCount,
            lotsSoldCount,
            bids,
            auctionsWithLots,
            soldLotsForCategories,
            soldLotsForSales,
            allCategories,
        ] = await Promise.all([
            this.repository.countUsers(),
            this.repository.countAuctions(),
            this.repository.countLots(),
            this.repository.countSellers(),
            this.repository.getTotalRevenue(),
            this.repository.getNewUsersCount(30),
            this.repository.countActiveAuctions(),
            this.repository.countSoldLots(),
            this.repository.getAllBids(),
            this.repository.getAuctionsWithLotCounts(),
            this.repository.getSoldLotsByCategory(),
            this.repository.getSoldLotsForSalesData(),
            this.repository.getAllCategories(),
        ]);
        
        const totalBids = bids.length;
        const averageBidValue = totalBids > 0 ? bids.reduce((sum, bid) => sum + bid.amount, 0) / totalBids : 0;
        const successfulAuctions = auctionsWithLots.filter(a => a._count.lots > 0).length;
        const auctionSuccessRate = auctionCount > 0 ? (successfulAuctions / auctionCount) * 100 : 0;
        const totalLotsInAuctions = auctionsWithLots.reduce((sum, a) => sum + a._count.lots, 0);
        const averageLotsPerAuction = auctionCount > 0 ? totalLotsInAuctions / auctionCount : 0;

        // Aggregate monthly sales
        const salesByMonthMap = new Map<string, number>();
        soldLotsForSales.forEach(lot => {
            const monthKey = format(new Date(lot.updatedAt), 'MMM/yy', { locale: ptBR });
            salesByMonthMap.set(monthKey, (salesByMonthMap.get(monthKey) || 0) + (lot.price || 0));
        });
        const salesData = Array.from(salesByMonthMap, ([name, Sales]) => ({ name, Sales }));
        
        // Aggregate sales by category
        const categoryCountMap = new Map<string, number>();
        const categoryMap = new Map(allCategories.map(c => [c.id, c.name]));
        
        soldLotsForCategories.forEach(lot => {
            const categoryName = categoryMap.get(lot.categoryId!) || 'Outros';
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
        throw error;
    }
  }
}
