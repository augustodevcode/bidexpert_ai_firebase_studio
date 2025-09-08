// src/app/admin/reports/actions.ts
/**
 * @fileoverview Server Actions for the main admin reports page.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import type { AdminReportData } from '@bidexpert/core';
import { ReportsService } from '@bidexpert/core';

const reportsService = new ReportsService();

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminReportData>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  return reportsService.getAdminReportData();
}
