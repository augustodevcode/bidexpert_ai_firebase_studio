
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, BidInfo } from '@/types';

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>;
  newBid?: BidInfo;
}

export async function placeBidOnLot(
  lotId: string,
  auctionId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
  const db = getDatabaseAdapter();
  return db.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
}

export async function getBidsForLot(lotId: string): Promise<BidInfo[]> {
  if (!lotId) {
    console.warn("[Server Action - getBidsForLot] Lot ID is required.");
    return [];
  }
  const db = getDatabaseAdapter();
  return db.getBidsForLot(lotId);
}
