// src/app/dashboard/bids/actions.ts
/**
 * @fileoverview Server Actions for fetching a user's bidding activity.
 * All logic has been refactored to use the BidService.
 */
'use server';

import type { UserBid } from '@bidexpert/core';
import { BidService } from '@bidexpert/core';

const bidService = new BidService();

/**
 * Fetches all bids placed by a specific user.
 * It enriches the bid data with details from the associated lot and auction,
 * and determines the current status of each bid (e.g., winning, losing, won).
 * @param {string} userId - The ID of the user whose bids are to be fetched.
 * @returns {Promise<UserBid[]>} A promise that resolves to an array of UserBid objects.
 */
export async function getBidsForUserAction(userId: string): Promise<UserBid[]> {
  return bidService.getBidsForUser(userId);
}
