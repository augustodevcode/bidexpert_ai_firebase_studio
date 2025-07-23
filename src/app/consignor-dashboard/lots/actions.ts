// src/app/consignor-dashboard/lots/actions.ts
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
  
  const lots = await prisma.lot.findMany({
    where: { sellerId: sellerId },
    include: { auction: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  });

  // @ts-ignore
  return lots.map(lot => ({ ...lot, auctionName: lot.auction?.title }));
}
