/**
 * @fileoverview Server Actions for the main admin reports page.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { AdminReportData } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminReportData>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  const db = await getDatabaseAdapter();
  // This action requires complex aggregations not present in the simple adapter interface.
  // It will likely only work with the SampleDataAdapter for now.
  // @ts-ignore
  if (db.getAdminReportData) {
    // @ts-ignore
    return db.getAdminReportData();
  }
  
  // Fallback to a zeroed-out response if the adapter doesn't support it.
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
    averageBidValue: 0,
    averageLotsPerAuction: 0,
    auctionSuccessRate: 0,
  };
}
