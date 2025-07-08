
'use server';

import { prisma } from '@/lib/prisma';
import type { ConsignorDashboardStats } from '@/types';
import { startOfMonth, subMonths } from 'date-fns';

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
    const soldLots = await prisma.lot.count({
      where: { ...lotsQuery.where, status: 'VENDIDO' },
    });

    const soldLotsRecords = await prisma.lot.findMany({
        where: { ...lotsQuery.where, status: 'VENDIDO' }
    });
    const totalSalesValue = soldLotsRecords.reduce((sum, lot) => sum + (lot.price || 0), 0);

    const salesRate = totalLotsConsigned > 0 ? (soldLots / totalLotsConsigned) * 100 : 0;
    
    // Placeholder for monthly sales data
    const salesByMonth = [
        { name: "Jan", sales: 0 }, { name: "Feb", sales: 0 },
        { name: "Mar", sales: 0 }, { name: "Apr", sales: 0 },
        { name: "May", sales: 0 }, { name: "Jun", sales: 0 },
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
