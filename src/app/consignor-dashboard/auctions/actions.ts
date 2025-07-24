// src/app/consignor-dashboard/auctions/actions.ts
/**
 * @fileoverview Server Action for the Consignor Dashboard's auctions view.
 * This file contains the function to fetch all auctions associated with a specific consignor.
 */
'use server';

import { SellerService } from '@/services/seller.service';
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
  
  const sellerService = new SellerService();
  // The service method needs to handle fetching by ID or slug
  return sellerService.getAuctionsBySellerSlug(sellerId);
}
