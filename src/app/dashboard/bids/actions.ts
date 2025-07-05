// src/app/dashboard/bids/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserBid } from '@/types';

/**
 * Fetches bid history for a specific user.
 * @param userId - The ID of the user whose bids to fetch.
 * @returns A promise that resolves to an array of UserBid objects.
 */
export async function getBidsForUser(userId: string): Promise<UserBid[]> {
  if (!userId) {
    console.warn("[Action - getBidsForUser] No userId provided.");
    return [];
  }
  
  try {
    const db = await getDatabaseAdapter();
    const bids = await db.getBidsForUser(userId);
    return bids;
  } catch (error) {
    console.error(`[Action - getBidsForUser] Error fetching bids for user ${userId}:`, error);
    return [];
  }
}