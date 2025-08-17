// src/app/admin/lots/relist-lot-action.ts
'use server';

import { RelistService } from '@/services/relist.service';

/**
 * Server Action to relist a lot.
 * It uses the RelistService to perform the core business logic.
 *
 * @param originalLotId - The ID of the lot to be relisted.
 * @param newAuctionId - The ID of the auction where the new lot will be placed.
 * @param discountPercentage - An optional discount to be applied to the initial price.
 * @returns An object indicating the success or failure of the operation, along with the new lot's ID on success.
 */
export async function relistLotAction(
  originalLotId: string,
  newAuctionId: string,
  discountPercentage?: number
): Promise<{ success: boolean; message: string; newLotId?: string }> {
  try {
    const relistService = new RelistService();
    const result = await relistService.relistLot(originalLotId, newAuctionId, discountPercentage);
    return result;
  } catch (error: any) {
    console.error(`[ACTION - relistLotAction] Error:`, error);
    return { success: false, message: `Falha ao executar a ação de relistar: ${error.message}` };
  }
}
