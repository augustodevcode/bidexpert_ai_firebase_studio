// src/app/admin/users/analysis/actions.ts
/**
 * @fileoverview Server Actions for the User Analysis Dashboard.
 * Provides functions to aggregate key statistics for user performance.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { UserHabilitationStatus, AccountType } from '@/types';

export interface UserPerformanceData {
  id: string;
  fullName: string;
  email: string;
  habilitationStatus: UserHabilitationStatus;
  accountType: AccountType;
  totalBids: number;
  lotsWon: number;
  totalSpent: number;
}

/**
 * Fetches and aggregates performance data for all users.
 * @returns {Promise<UserPerformanceData[]>} A promise that resolves to an array of user performance objects.
 */
export async function getUsersPerformanceAction(): Promise<UserPerformanceData[]> {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { bids: true, wins: true },
        },
        wins: {
          select: { winningBidAmount: true },
        },
      },
    });

    return users.map(user => {
      const totalSpent = user.wins.reduce((acc, win) => acc + (win.winningBidAmount || 0), 0);

      return {
        id: user.id,
        fullName: user.fullName || 'N/A',
        email: user.email,
        habilitationStatus: user.habilitationStatus,
        accountType: user.accountType,
        totalBids: user._count.bids,
        lotsWon: user._count.wins,
        totalSpent,
      };
    }).sort((a,b) => b.totalSpent - a.totalSpent); // Sort by most spent
  } catch (error: any) {
    console.error("[Action - getUsersPerformanceAction] Error fetching user performance:", error);
    throw new Error("Falha ao buscar dados de performance dos usuários.");
  }
}

/**
 * Fetches statistics on user account types.
 * @returns {Promise<{ name: string; value: number }[]>} An array of objects with account type stats.
 */
export async function getAccountTypeDistributionAction(): Promise<{ name: string; value: number }[]> {
    const distribution = await prisma.user.groupBy({
        by: ['accountType'],
        _count: {
            _all: true,
        },
    });
    return distribution.map(d => ({ name: d.accountType, value: d._count._all }));
}

/**
 * Fetches statistics on user habilitation statuses.
 * @returns {Promise<{ name: string; value: number }[]>} An array of objects with habilitation status stats.
 */
export async function getHabilitationStatusDistributionAction(): Promise<{ name: string; value: number }[]> {
     const distribution = await prisma.user.groupBy({
        by: ['habilitationStatus'],
        _count: {
            _all: true,
        },
    });
    return distribution.map(d => ({ name: d.habilitationStatus, value: d._count._all }));
}
