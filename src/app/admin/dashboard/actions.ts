/**
 * @fileoverview Server Actions for the main admin dashboard.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { AdminDashboardStats } from '@/types';

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminDashboardStats>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminDashboardStatsAction(): Promise<AdminDashboardStats> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  if (db.getAdminDashboardStats) {
    // @ts-ignore
    return db.getAdminDashboardStats();
  }

  // Fallback if not implemented
  try {
    const [usersCount, auctionsCount, lotsCount, sellersCount] = await Promise.all([
      (await db.getUsersWithRoles()).length,
      (await db.getAuctions()).length,
      (await db.getLots()).length,
      (await db.getSellers()).length,
    ]);

    return {
      users: usersCount,
      auctions: auctionsCount,
      lots: lotsCount,
      sellers: sellersCount,
    };
  } catch (error) {
    console.error("[Action - getAdminDashboardStatsAction] Error fetching admin stats:", error);
    // Return zeroed stats on error to prevent crashing the page.
    return {
      users: 0,
      auctions: 0,
      lots: 0,
      sellers: 0,
    };
  }
}
