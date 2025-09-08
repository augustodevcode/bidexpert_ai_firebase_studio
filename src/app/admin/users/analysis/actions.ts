// src/app/admin/users/analysis/actions.ts
/**
 * @fileoverview Server Actions for the User Analysis Dashboard.
 * Provides functions to aggregate key statistics for user performance.
 */
'use server';

import type { UserHabilitationStatus, AccountType } from '@/types';
import { UserService } from '@bidexpert/services';

export interface UserPerformanceData {
  id: string;
  fullName: string;
  email: string;
  habilitationStatus: UserHabilitationStatus;
  accountType: AccountType;
  totalBids: number;
  lotsWon: number;
  totalSpent: number;
}
const userService = new UserService();

/**
 * Fetches and aggregates performance data for all users.
 * @returns {Promise<UserPerformanceData[]>} A promise that resolves to an array of user performance objects.
 */
export async function getUsersPerformanceAction(): Promise<UserPerformanceData[]> {
  try {
    return await userService.getUsersPerformance();
  } catch (error: any) {
    console.error("[Action - getUsersPerformanceAction] Error fetching user performance:", error);
    throw new Error("Falha ao buscar dados de performance dos usuários.");
  }
}

/**
 * Fetches statistics on user account types.
 * @returns {Promise<{ name: string; value: number }[]>} An array of objects with account type stats.
 */
export async function getAccountTypeDistributionAction(): Promise<{ name: string; value: number }[]> {
    return userService.getAccountTypeDistribution();
}

/**
 * Fetches statistics on user habilitation statuses.
 * @returns {Promise<{ name: string; value: number }[]>} An array of objects with habilitation status stats.
 */
export async function getHabilitationStatusDistributionAction(): Promise<{ name: string; value: number }[]> {
     return userService.getHabilitationStatusDistribution();
}
