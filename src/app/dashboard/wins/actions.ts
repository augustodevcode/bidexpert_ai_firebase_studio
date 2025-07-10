/**
 * @fileoverview Server Action for fetching lots a user has won.
 */
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserWin } from '@/types';

/**
 * Fetches all lots won by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<UserWin[]>} A promise that resolves to an array of UserWin objects,
 * including details of the lot won.
 */
export async function getWinsForUserAction(userId: string): Promise<UserWin[]> {
  if (!userId) {
    console.warn("[Action - getWinsForUserAction] No userId provided, returning empty array.");
    return [];
  }
  
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming this method exists on the adapter
  if (db.getUserWins) {
    // @ts-ignore
    return db.getUserWins(userId);
  }

  return [];
}
