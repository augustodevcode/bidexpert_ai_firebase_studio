/**
 * @fileoverview Server Actions for the main admin dashboard.
 * Provides functions to aggregate key statistics for the platform overview.
 */
'use server';

import { ReportsService } from '@/services/reports.service';
import type { AdminDashboardStats } from '@/types';

const reportsService = new ReportsService();

/**
 * Fetches key statistics for the admin dashboard.
 * Counts total users, auctions, lots, and sellers.
 * @returns {Promise<AdminDashboardStats>} A promise that resolves to an object with platform statistics.
 */
export async function getAdminDashboardStatsAction(): Promise<AdminDashboardStats> {
    // A lógica foi movida para o ReportsService para manter a consistência arquitetural
    return reportsService.getAdminDashboardStats();
}
