
// src/app/consignor-dashboard/auctions/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Auction } from '@/types';

/**
 * Fetches auctions for a specific consignor based on their seller ID.
 * @param sellerId - The ID of the seller/consignor.
 * @returns A promise that resolves to an array of Auction objects.
 */
export async function getAuctionsForConsignorAction(sellerId: string): Promise<Auction[]> {
  if (!sellerId) {
    console.warn("[Action - getAuctionsForConsignorAction] No sellerId provided.");
    return [];
  }
  
  try {
    const auctions = await prisma.auction.findMany({
      where: { sellerId: sellerId },
      include: {
        lots: { select: { id: true }}, // for count
      },
      orderBy: { auctionDate: 'desc' }
    });

    return auctions.map(a => ({...a, totalLots: a.lots.length})) as unknown as Auction[];
  } catch (error) {
    console.error(`[Action - getAuctionsForConsignorAction] Error fetching auctions for seller ${sellerId}:`, error);
    return [];
  }
}
