/**
 * @fileoverview Server Action for the Consignor Dashboard's reports/overview page.
 * Aggregates statistics for a specific consignor's sales performance.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
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
  
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getConsignorDashboardStats) {
      // @ts-ignore
      return db.getConsignorDashboardStats(sellerId);
  }

  return defaultStats;
}
