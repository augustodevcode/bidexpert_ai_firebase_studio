// src/app/dashboard/overview/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot, UserHabilitationStatus } from '@/types';
import { isPast } from 'date-fns';
import { nowInSaoPaulo } from '@/lib/timezone'; // Import timezone functions

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
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { habilitationStatus: true }
  });

  const activeBids = await prisma.bid.findMany({
    where: {
      bidderId: userId,
      lot: {
        status: 'ABERTO_PARA_LANCES'
      }
    },
    distinct: ['lotId'],
  });

  const wins = await prisma.userWin.findMany({
    where: { userId }
  });
  
  const pendingWinsCount = wins.filter(w => w.paymentStatus === 'PENDENTE').length;
  const auctionsWonCount = wins.length;

  const lotsEndingSoon = await prisma.lot.findMany({
    where: {
      status: 'ABERTO_PARA_LANCES',
      endDate: {
        gte: nowInSaoPaulo(), // Use timezone-aware function
      }
    },
    orderBy: {
      endDate: 'asc'
    },
    take: 3,
    include: {
        auction: { select: { title: true }}
    }
  });

  const recommendedLots = await prisma.lot.findMany({
      where: {
          status: 'ABERTO_PARA_LANCES',
          isFeatured: true,
      },
      take: 3,
      include: {
          auction: { select: { title: true }}
      }
  });

  const upcomingLots = lotsEndingSoon.map(l => ({ ...l, auctionName: l.auction.title })) as Lot[];

  return {
    upcomingLots,
    pendingWinsCount,
    recommendedLots: recommendedLots as Lot[],
    activeBidsCount: activeBids.length,
    habilitationStatus: user?.habilitationStatus || null,
    auctionsWonCount,
  };
}
