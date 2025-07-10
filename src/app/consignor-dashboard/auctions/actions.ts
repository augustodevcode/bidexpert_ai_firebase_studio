// src/app/consignor-dashboard/auctions/actions.ts
/**
 * @fileoverview Server Action for the Consignor Dashboard's auctions view.
 * This file contains the function to fetch all auctions associated with a specific consignor.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
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
  
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getAuctionsForConsignor) {
    // @ts-ignore
    return db.getAuctionsForConsignor(sellerId);
  }

  // Fallback logic
  const allAuctions = await db.getAuctions();
  return allAuctions.filter(a => a.sellerId === sellerId);
}
