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
  try {
    const db = getDatabaseAdapter();
    const [users, auctions, lots, sellers] = await Promise.all([
      db.getUsersWithRoles(),
      db.getAuctions(),
      db.getLots(),
      db.getSellers(),
    ]);

    return {
      users: users.length,
      auctions: auctions.length,
      lots: lots.length,
      sellers: sellers.length,
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
