/**
 * @fileoverview Server Actions for fetching a user's bidding activity.
 * Provides a function to get all bids made by a specific user, along with
 * the current status of each bid (e.g., winning, losing, won).
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserBid } from '@/types';

/**
 * Fetches all bids placed by a specific user.
 * It enriches the bid data with details from the associated lot and auction,
 * and determines the current status of each bid.
 * @param {string} userId - The ID of the user whose bids are to be fetched.
 * @returns {Promise<UserBid[]>} A promise that resolves to an array of UserBid objects.
 */
export async function getBidsForUserAction(userId: string): Promise<UserBid[]> {
  if (!userId) {
    console.warn("[Action - getBidsForUser] No userId provided.");
    return [];
  }
  
  const db = await getDatabaseAdapter();
  // This logic is complex and specific to the sample data adapter for now.
  // A real DB implementation would require a more sophisticated query or stored procedure.
  // @ts-ignore
  if (db.getUserBids) {
    // @ts-ignore
    return db.getUserBids(userId);
  }
  
  return [];
}
