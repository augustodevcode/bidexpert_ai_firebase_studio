// src/app/consignor-dashboard/direct-sales/actions.ts
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
  
  // Directly query using Prisma
  const offers = await prisma.directSaleOffer.findMany({
    where: { sellerId: sellerId },
    orderBy: { createdAt: 'desc' }
  });

  return offers as DirectSaleOffer[];
}
