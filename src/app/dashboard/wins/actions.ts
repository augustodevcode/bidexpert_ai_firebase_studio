// src/app/dashboard/wins/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserWin } from '@/types';

/**
 * Fetches the won lots for a specific user.
 * @param userId - The ID of the user whose wins to fetch.
 * @returns A promise that resolves to an array of UserWin objects.
 */
export async function getWinsForUserAction(userId: string): Promise<UserWin[]> {
  if (!userId) {
    console.warn("[Action - getWinsForUserAction] No userId provided, returning empty array.");
    return [];
  }
  
  try {
    const db = await getDatabaseAdapter();
    const wins = await db.getWinsForUser(userId);
    return wins;
  } catch (error) {
    console.error(`[Action - getWinsForUserAction] Error fetching wins for user ${userId}:`, error);
    // In a real app, you might want to handle this more gracefully
    // or log it to a monitoring service.
    return [];
  }
}
