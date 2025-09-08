// src/app/consignor-dashboard/financial/actions.ts
/**
 * @fileoverview Server Action for the Consignor Dashboard's financial view.
 * Fetches all winning bids for lots associated with a specific consignor to enable
 * financial reporting and reconciliation.
 */
'use server';

import { UserWinService } from '@bidexpert/core';
import type { UserWin } from '@bidexpert/core';

const userWinService = new UserWinService();

/**
 * Fetches all UserWin records for a specific consignor by their seller ID.
 * It does this by finding all lots associated with the seller's auctions and then
 * finding the winning bids for those lots.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<UserWin[]>} A promise that resolves to an array of UserWin objects.
 */
export async function getFinancialDataForConsignor(sellerId: string): Promise<UserWin[]> {
  if (!sellerId) {
    console.warn("[Action - getFinancialDataForConsignor] No sellerId provided.");
    return [];
  }
  
  return userWinService.getWinsForConsignor(sellerId);
}
