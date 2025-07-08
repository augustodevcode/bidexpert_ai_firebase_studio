/**
 * @fileoverview Server Action for the Consignor Dashboard's reports/overview page.
 * Aggregates statistics for a specific consignor's sales performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { ConsignorDashboardStats } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Fetches and calculates key performance indicators for a consignor's dashboard.
 * This includes total lots, sold lots, sales value, and sales rate.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<ConsignorDashboardStats>} A promise resolving to the aggregated stats object.
 */
export async function getConsignorDashboardStatsAction(sellerId: string): Promise<ConsignorDashboardStats> {
  const defaultStats: ConsignorDashboardStats = {
    totalLotsConsigned: 0,
    activeLots: 0,
    soldLots: 0,
    totalSalesValue: 0,
    salesRate: 0,
    salesData: [],
  };

  if (!sellerId) {
    console.warn("[getConsignorDashboardStatsAction] No sellerId provided.");
    return defaultStats;
  }
  
  try {
    // Base query for lots belonging to this seller's auctions
    const lotsQueryWhere = { auction: { sellerId: sellerId } };

    const totalLotsConsigned = await prisma.lot.count({ where: lotsQueryWhere });
    const activeLots = await prisma.lot.count({
      where: { ...lotsQueryWhere, status: 'ABERTO_PARA_LANCES' },
    });
    const soldLotsRecords = await prisma.lot.findMany({
        where: { ...lotsQueryWhere, status: 'VENDIDO' }
    });
    
    const soldLots = soldLotsRecords.length;
    const totalSalesValue = soldLotsRecords.reduce((sum, lot) => sum + (lot.price || 0), 0);
    const salesRate = totalLotsConsigned > 0 ? (soldLots / totalLotsConsigned) * 100 : 0;
    
    // --- Process Sales Data by Month ---
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const winsLastYear = await prisma.userWin.findMany({
      where: {
        lot: {
          auction: { sellerId: sellerId },
        },
        winDate: {
          gte: oneYearAgo,
        },
      },
    });

    const salesByMonthMap: { [key: string]: number } = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = format(d, 'MMM/yy', { locale: ptBR });
        salesByMonthMap[monthKey] = 0;
    }

    winsLastYear.forEach(win => {
        const monthKey = format(new Date(win.winDate), 'MMM/yy', { locale: ptBR });
        if (salesByMonthMap.hasOwnProperty(monthKey)) {
            salesByMonthMap[monthKey] += win.winningBidAmount;
        }
    });

    const salesData = Object.entries(salesByMonthMap).map(([name, sales]) => ({
        name,
        Sales: sales, // Using capital 'S' for consistency with Admin reports
    }));


    return {
      totalLotsConsigned,
      activeLots,
      soldLots,
      totalSalesValue,
      salesRate,
      salesData,
    };
  } catch (error) {
    console.error(`[Action - getConsignorDashboardStatsAction] Error for seller ${sellerId}:`, error);
    return defaultStats;
  }
}
