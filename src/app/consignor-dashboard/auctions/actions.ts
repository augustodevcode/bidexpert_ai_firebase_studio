/**
 * @fileoverview Server Action for the Consignor Dashboard's auctions view.
 * This file contains the function to fetch all auctions associated with a specific consignor.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Auction } from '@/types';

/**
 * Fetches auctions for a specific consignor based on their seller ID.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<Auction[]>} A promise that resolves to an array of Auction objects.
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
        _count: {
          select: { lots: true }
        },
      },
      orderBy: { auctionDate: 'desc' }
    });

    return auctions.map(a => ({...a, totalLots: a._count.lots})) as unknown as Auction[];
  } catch (error) {
    console.error(`[Action - getAuctionsForConsignorAction] Error fetching auctions for seller ${sellerId}:`, error);
    return [];
  }
}
