// src/app/dashboard/wins/actions.ts
/**
 * @fileoverview Server Action for fetching lots a user has won.
 */
'use server';

import { UserWinRepository } from '@/repositories/user-win.repository';
import type { UserWin } from '@/types';

const userWinRepository = new UserWinRepository();

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
  
  return userWinRepository.findByUserId(userId);
}
