// src/app/consignor-dashboard/auctions/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
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
    const db = await getDatabaseAdapter();
    const auctions = await db.getAuctionsForConsignor(sellerId);
    return auctions;
  } catch (error) {
    console.error(`[Action - getAuctionsForConsignorAction] Error fetching auctions for seller ${sellerId}:`, error);
    return [];
  }
}
