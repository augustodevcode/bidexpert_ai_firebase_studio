
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot } from '@/types';

export async function getLotsForConsignorAction(sellerId: string): Promise<Lot[]> {
  if (!sellerId) {
    console.warn("[Action - getLotsForConsignorAction] No sellerId provided.");
    return [];
  }
  
  try {
    const lots = await prisma.lot.findMany({
        where: {
            auction: {
                sellerId: sellerId,
            }
        },
        include: {
            auction: {
                select: { title: true }
            }
        },
        orderBy: { auctionId: 'desc' }
    });

    return lots.map(lot => ({
        ...lot,
        auctionName: lot.auction?.title
    })) as unknown as Lot[];
  } catch (error) {
    console.error(`Error fetching lots for consignor ${sellerId}:`, error);
    return [];
  }
}
