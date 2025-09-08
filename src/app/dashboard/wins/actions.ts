// src/app/dashboard/wins/actions.ts
/**
 * @fileoverview Server Action for fetching lots a user has won.
 */
'use server';

import { UserWinService } from '@bidexpert/services';
import type { UserWin } from '@bidexpert/core';

const userWinService = new UserWinService();

/**
 * Fetches all lots won by a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<UserWin[]>} A promise that resolves to an array of UserWin objects,
 * including details of the lot won.
 */
export async function getWinsForUserAction(userId: string): Promise<UserWin[]> {
  return userWinService.findWinsByUserId(userId);
}
