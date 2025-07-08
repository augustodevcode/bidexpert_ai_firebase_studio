/**
 * @fileoverview Server Action for the Consignor Dashboard's reports/overview page.
 * Aggregates statistics for a specific consignor's sales performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { ConsignorDashboardStats } from '@/types';

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
    salesByMonth: [],
  };

  if (!sellerId) {
    console.warn("[getConsignorDashboardStatsAction] No sellerId provided.");
    return defaultStats;
  }
  
  try {
    const lotsQuery = {
      where: { auction: { sellerId: sellerId } },
    };

    const totalLotsConsigned = await prisma.lot.count(lotsQuery);
    const activeLots = await prisma.lot.count({
      where: { ...lotsQuery.where, status: 'ABERTO_PARA_LANCES' },
    });
    const soldLotsRecords = await prisma.lot.findMany({
        where: { ...lotsQuery.where, status: 'VENDIDO' }
    });
    
    const soldLots = soldLotsRecords.length;
    const totalSalesValue = soldLotsRecords.reduce((sum, lot) => sum + (lot.price || 0), 0);
    const salesRate = totalLotsConsigned > 0 ? (soldLots / totalLotsConsigned) * 100 : 0;
    
    // This is a placeholder for a more complex time-series query.
    // A real implementation would group sales by month from the `UserWin` table.
    const salesByMonth = [
        { name: "Jan", sales: 0 }, { name: "Fev", sales: 0 },
        { name: "Mar", sales: 0 }, { name: "Abr", sales: 0 },
        { name: "Mai", sales: 0 }, { name: "Jun", sales: 0 },
    ];

    return {
      totalLotsConsigned,
      activeLots,
      soldLots,
      totalSalesValue,
      salesRate,
      salesByMonth,
    };
  } catch (error) {
    console.error(`[Action - getConsignorDashboardStatsAction] Error for seller ${sellerId}:`, error);
    return defaultStats;
  }
}
