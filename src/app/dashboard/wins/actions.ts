// src/app/dashboard/wins/actions.ts
/**
 * @fileoverview Server Action for fetching lots a user has won.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin } from '@/types';

/**
 * Fetches all lots won by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<UserWin[]>} A promise that resolves to an array of UserWin objects,
 * including details of the lot won.
 */
export async function getWinsForUserAction(userId: string): Promise<UserWin[]> {
  if (!userId) {
    console.warn("[Action - getWinsForUserAction] No userId provided, returning empty array.");
    return [];
  }
  
  const wins = await prisma.userWin.findMany({
    where: { userId },
    include: {
        lot: {
            include: {
                auction: {
                    select: {
                        title: true,
                    }
                }
            }
        }
    },
    orderBy: {
        winDate: 'desc'
    }
  });

  // @ts-ignore
  return wins.map(win => ({
      ...win,
      lot: {
          ...win.lot,
          auctionName: win.lot.auction.title
      }
  }));
}
