// src/app/dashboard/overview/actions.ts
/**
 * @fileoverview Server Actions for the main user dashboard overview.
 */
'use server';

import { ReportsService } from '@bidexpert/core';
import type { DashboardOverviewData } from '@bidexpert/core';

const reportsService = new ReportsService();

/**
 * Fetches and aggregates data for the user's dashboard overview.
 * @param userId - The ID of the logged-in user.
 * @returns {Promise<DashboardOverviewData>} An object containing all necessary data for the dashboard.
 */
export async function getDashboardOverviewDataAction(userId: string): Promise<DashboardOverviewData> {
    return reportsService.getUserDashboardOverview(userId);
}
