
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin } from '@/types';

export async function getFinancialDataForConsignor(sellerId: string): Promise<UserWin[]> {
  if (!sellerId) {
    console.warn("[Action - getFinancialDataForConsignor] No sellerId provided.");
    return [];
  }
  
  try {
    const wins = await prisma.userWin.findMany({
      where: {
        lot: {
          auction: {
            sellerId: sellerId,
          },
        },
      },
      include: {
        lot: true,
      },
      orderBy: {
        winDate: 'desc',
      },
    });
    return wins as unknown as UserWin[];
  } catch (error) {
    console.error(`[Action - getFinancialDataForConsignor] Error fetching wins for seller ${sellerId}:`, error);
    return [];
  }
}
