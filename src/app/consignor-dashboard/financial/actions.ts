/**
 * @fileoverview Server Action for the Consignor Dashboard's financial view.
 * Fetches all winning bids for lots associated with a specific consignor to enable
 * financial reporting and reconciliation.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { UserWin } from '@/types';

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
  
  try {
    const wins = await prisma.userWin.findMany({
      where: {
        lot: {
          auction: {
            sellerId: sellerId,
          },
        },
      },
      include: {
        lot: true, // Include the full lot object in the response
      },
      orderBy: {
        winDate: 'desc',
      },
    });
    return wins as unknown as UserWin[];
  } catch (error) {
    console.error(`[Action - getFinancialDataForConsignor] Error fetching wins for seller ${sellerId}:`, error);
    return [];
  }
}
