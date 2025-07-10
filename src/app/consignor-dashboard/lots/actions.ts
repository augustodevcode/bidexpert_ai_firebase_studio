// src/app/consignor-dashboard/lots/actions.ts
/**
 * @fileoverview Server Action for the Consignor Dashboard's lots view.
 * Fetches all lots belonging to a specific consignor across all their auctions.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
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
  
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getLotsForConsignor) {
    // @ts-ignore
    return db.getLotsForConsignor(sellerId);
  }

  // Fallback logic
  const allAuctions = await db.getAuctions();
  const consignorAuctionIds = new Set(allAuctions.filter(a => a.sellerId === sellerId).map(a => a.id));
  const allLots = await db.getLots();
  return allLots.filter(l => consignorAuctionIds.has(l.auctionId));
}
