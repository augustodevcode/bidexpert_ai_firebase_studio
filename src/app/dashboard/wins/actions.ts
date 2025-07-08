
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin, Lot } from '@/types';

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
