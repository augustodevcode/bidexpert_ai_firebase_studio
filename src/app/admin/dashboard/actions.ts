/**
 * @fileoverview Server Actions for the main admin dashboard.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminDashboardStats } from '@/types';

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminDashboardStats>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminDashboardStatsAction(): Promise<AdminDashboardStats> {
  try {
    const usersCount = await prisma.user.count();
    const auctionsCount = await prisma.auction.count();
    const lotsCount = await prisma.lot.count();
    const sellersCount = await prisma.seller.count();

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
