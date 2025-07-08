
// src/app/admin/dashboard/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminDashboardStats } from '@/types';

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
    return {
      users: 0,
      auctions: 0,
      lots: 0,
      sellers: 0,
    };
  }
}
