
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserWin } from '@/types';

/**
 * Fetches the won lots for a specific user.
 * In a real application, the userId would come from the session.
 * @param userId - The ID of the user whose wins to fetch.
 * @returns A promise that resolves to an array of UserWin objects.
 */
export async function getWins(userId: string): Promise<UserWin[]> {
  if (!userId) {
    console.warn("[Action - getWins] No userId provided, returning empty array.");
    return [];
  }
  
  try {
    const db = await getDatabaseAdapter();
    const wins = await db.getWinsForUser(userId);
    return wins;
  } catch (error) {
    console.error(`[Action - getWins] Error fetching wins for user ${userId}:`, error);
    // In a real app, you might want to handle this more gracefully
    // or log it to a monitoring service.
    return [];
  }
}
