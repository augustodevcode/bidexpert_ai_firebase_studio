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
  
  try {
    const wins = await prisma.userWin.findMany({
        where: { userId: userId },
        include: {
            lot: true,
        },
        orderBy: { winDate: 'desc' },
    });
    return wins as unknown as UserWin[];
  } catch (error) {
    console.error(`[Action - getWinsForUserAction] Error fetching wins for user ${userId}:`, error);
    return [];
  }
}

    