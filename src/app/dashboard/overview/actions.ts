// src/app/dashboard/overview/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, UserHabilitationStatus } from '@/types';
import { isPast } from 'date-fns';

export interface DashboardOverviewData {
  upcomingLots: Lot[];
  pendingWinsCount: number;
  recommendedLots: Lot[];
  activeBidsCount: number;
  habilitationStatus: UserHabilitationStatus | null;
  auctionsWonCount: number;
}

/**
 * Fetches and aggregates data for the user's dashboard overview.
 * @param userId - The ID of the logged-in user.
 * @returns {Promise<DashboardOverviewData>} An object containing all necessary data for the dashboard.
 */
export async function getDashboardOverviewDataAction(userId: string): Promise<DashboardOverviewData> {
  if (!userId) {
    throw new Error("User ID is required.");
  }
  
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getDashboardOverviewData) {
    // @ts-ignore
    return db.getDashboardOverviewData(userId);
  }

  // Fallback for non-sample adapters
  return {
    upcomingLots: [],
    pendingWinsCount: 0,
    recommendedLots: [],
    activeBidsCount: 0,
    habilitationStatus: null,
    auctionsWonCount: 0,
  };
}
