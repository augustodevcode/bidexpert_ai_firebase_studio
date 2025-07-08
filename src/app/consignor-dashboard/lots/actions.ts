/**
 * @fileoverview Server Action for the Consignor Dashboard's lots view.
 * Fetches all lots belonging to a specific consignor across all their auctions.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Lot } from '@/types';

/**
 * Fetches all lots associated with a specific consignor's auctions.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<Lot[]>} A promise that resolves to an array of Lot objects.
 */
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
                select: { title: true } // Include parent auction's title for display
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Map to include auctionName directly for easier frontend use
    return lots.map(lot => ({
        ...lot,
        auctionName: lot.auction?.title
    })) as unknown as Lot[];
  } catch (error) {
    console.error(`Error fetching lots for consignor ${sellerId}:`, error);
    return [];
  }
}
