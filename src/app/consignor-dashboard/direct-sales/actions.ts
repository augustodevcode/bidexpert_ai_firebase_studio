
      /**
 * @fileoverview Server Actions for the Consignor Dashboard's direct sales view.
 * Provides functions to fetch direct sale offers associated with a specific consignor.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';

/**
 * Fetches all direct sale offers for a specific consignor by their seller ID.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<DirectSaleOffer[]>} A promise that resolves to an array of DirectSaleOffer objects.
 */
export async function getDirectSaleOffersForConsignorAction(sellerId: string): Promise<DirectSaleOffer[]> {
  if (!sellerId) {
    console.warn("[Action - getDirectSaleOffersForConsignorAction] No sellerId provided.");
    return [];
  }
  
  try {
    const offers = await prisma.directSaleOffer.findMany({
      where: { sellerId: sellerId },
      include: {
        category: true,
        seller: true
      },
      orderBy: { createdAt: 'desc' }
    });
    // Map to the composite type that includes names for easier frontend use.
    return offers.map(o => ({
        ...o,
        category: o.category.name,
        sellerName: o.seller.name,
    })) as unknown as DirectSaleOffer[];
  } catch (error) {
    console.error(`[Action - getDirectSaleOffersForConsignorAction] Error fetching offers for seller ${sellerId}:`, error);
    return [];
  }
}

    