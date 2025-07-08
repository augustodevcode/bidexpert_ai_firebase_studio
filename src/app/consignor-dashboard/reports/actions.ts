// src/app/consignor-dashboard/reports/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { ConsignorDashboardStats } from '@/types';

/**
 * Fetches dashboard statistics for a specific consignor.
 * @param sellerId The ID of the seller/consignor.
 * @returns A promise that resolves to the consignor's dashboard stats.
 */
export async function getConsignorDashboardStatsAction(sellerId: string): Promise<ConsignorDashboardStats> {
  if (!sellerId) {
    console.warn("[getConsignorDashboardStatsAction] No sellerId provided.");
    return {
      totalLotsConsigned: 0,
      activeLots: 0,
      soldLots: 0,
      totalSalesValue: 0,
      salesRate: 0,
      salesByMonth: [],
    };
  }
  
  const db = await getDatabaseAdapter();
  return db.getConsignorDashboardStats(sellerId);
}
