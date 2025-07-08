// src/app/dashboard/overview/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot, UserWin, UserBid, UserHabilitationStatus, Auction } from '@/types';
import { isPast } from 'date-fns';

export interface DashboardOverviewData {
  upcomingLots: Lot[];
  pendingWinsCount: number;
  recommendedLots: Lot[];
  activeBidsCount: number;
  habilitationStatus: UserHabilitationStatus | null;
  auctionsWonCount: number;
}

/**
 * Fetches and aggregates data for the user's dashboard overview.
 * @param userId - The ID of the logged-in user.
 * @returns {Promise<DashboardOverviewData>} An object containing all necessary data for the dashboard.
 */
export async function getDashboardOverviewDataAction(userId: string): Promise<DashboardOverviewData> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  try {
    const [
      user,
      allOpenLots,
      pendingWins,
      activeBids,
      recommendedLots,
      auctionsWonCount,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { habilitationStatus: true } }),
      prisma.lot.findMany({
        where: {
          status: 'ABERTO_PARA_LANCES',
          endDate: {
            not: null,
            gte: new Date(),
          },
        },
        orderBy: {
          endDate: 'asc',
        },
        take: 3,
        include: { auction: { select: { title: true } } }
      }),
      prisma.userWin.count({
        where: {
          userId: userId,
          paymentStatus: 'PENDENTE',
        },
      }),
       prisma.bid.findMany({
        where: { 
            bidderId: userId,
            lot: {
                status: 'ABERTO_PARA_LANCES'
            }
        },
        distinct: ['lotId'],
       }),
      prisma.lot.findMany({
        where: {
          isFeatured: true,
          status: 'ABERTO_PARA_LANCES',
        },
        take: 3,
        include: { auction: { select: { title: true } } }
      }),
      prisma.userWin.count({
        where: { userId: userId }
      })
    ]);
    
    const enrichedLots = (lots: (Lot & { auction?: { title: string } | null})[]): Lot[] => {
        return lots.map(lot => ({ ...lot, auctionName: lot.auction?.title })) as unknown as Lot[];
    }
    
    return {
      upcomingLots: enrichedLots(allOpenLots),
      pendingWinsCount: pendingWins,
      recommendedLots: enrichedLots(recommendedLots),
      activeBidsCount: activeBids.length,
      habilitationStatus: user?.habilitationStatus as UserHabilitationStatus || null,
      auctionsWonCount: auctionsWonCount
    };

  } catch (error) {
    console.error('[getDashboardOverviewDataAction] Error fetching data:', error);
    // Return a default/empty state on error
    return {
      upcomingLots: [],
      pendingWinsCount: 0,
      recommendedLots: [],
      activeBidsCount: 0,
      habilitationStatus: null,
      auctionsWonCount: 0,
    };
  }
}
