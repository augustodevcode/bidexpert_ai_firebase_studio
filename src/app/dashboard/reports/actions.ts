// src/app/dashboard/reports/actions.ts
'use server';

import { UserWinService } from '@/services/user-win.service';
import type { UserReportData } from '@/types';

const userWinService = new UserWinService();

/**
 * Fetches and aggregates report data for a specific user.
 * @param {string} userId - The ID of the user for whom to generate the report.
 * @returns {Promise<UserReportData>} A promise that resolves to the user's report data.
 */
export async function getUserReportDataAction(userId: string): Promise<UserReportData> {
  return userWinService.getUserReportData(userId);
}
