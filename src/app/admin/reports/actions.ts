/**
 * @fileoverview Server Actions for the main admin reports page.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminReportData } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminReportData>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [
      usersCount,
      auctionsCount,
      lotsCount,
      sellersCount,
      newUsersLast30Days,
      categoryDataAgg,
      soldLots,
      winsLastYear,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.auction.count(),
      prisma.lot.count(),
      prisma.seller.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.lot.groupBy({ by: ['categoryId'], _count: { id: true }, where: { status: 'VENDIDO' }}),
      prisma.lot.findMany({ where: { status: 'VENDIDO' } }),
      prisma.userWin.findMany({ where: { winDate: { gte: oneYearAgo } } })
    ]);
    
    // Process Sales Data by Month
    const salesByMonth: { [key: string]: number } = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = format(d, 'MMM/yy', { locale: ptBR });
        salesByMonth[monthKey] = 0;
    }
    winsLastYear.forEach(win => {
        const monthKey = format(new Date(win.winDate), 'MMM/yy', { locale: ptBR });
        if (salesByMonth.hasOwnProperty(monthKey)) {
            salesByMonth[monthKey] += win.winningBidAmount;
        }
    });
    const salesData = Object.entries(salesByMonth).map(([name, sales]) => ({ name, Sales: sales }));

    // Process Category Data
    const categoryIds = categoryDataAgg.map(c => c.categoryId).filter((id): id is string => !!id);
    const categories = await prisma.lotCategory.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const categoryData = categoryDataAgg.map(item => ({
        name: categoryMap.get(item.categoryId!) || 'Desconhecido',
        value: item._count.id
    }));
    
    const totalRevenue = soldLots.reduce((sum, lot) => sum + lot.price, 0);

    return {
      users: usersCount,
      auctions: auctionsCount,
      lots: lotsCount,
      sellers: sellersCount,
      totalRevenue: totalRevenue,
      newUsersLast30Days: newUsersLast30Days,
      activeAuctions: await prisma.auction.count({ where: { status: 'ABERTO_PARA_LANCES' }}),
      lotsSoldCount: soldLots.length,
      salesData,
      categoryData,
    };
  } catch (error) {
    console.error("[Action - getAdminReportDataAction] Error fetching admin stats:", error);
    // Return a default object on failure to prevent page crashes.
    return {
      users: 0,
      auctions: 0,
      lots: 0,
      sellers: 0,
      totalRevenue: 0,
      newUsersLast30Days: 0,
      activeAuctions: 0,
      lotsSoldCount: 0,
      salesData: [],
      categoryData: [],
    };
  }
}
