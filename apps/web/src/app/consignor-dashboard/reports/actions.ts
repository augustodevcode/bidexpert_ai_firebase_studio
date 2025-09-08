// src/app/consignor-dashboard/reports/actions.ts
/**
 * @fileoverview Server Action for the Consignor Dashboard's reports/overview page.
 * Aggregates statistics for a specific consignor's sales performance.
 */
'use server';

import type { ConsignorDashboardStats } from '@bidexpert/core';
import { SellerService } from '@bidexpert/core';

const sellerService = new SellerService();

/**
 * Fetches and calculates key performance indicators for a consignor's dashboard.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<ConsignorDashboardStats | null>} A promise resolving to the aggregated stats object or null if not found.
 */
export async function getConsignorDashboardStatsAction(sellerId: string): Promise<ConsignorDashboardStats | null> {
    if (!sellerId) {
        console.warn("[Action - getConsignorDashboardStatsAction] No sellerId provided.");
        return null;
    }
    // @ts-ignore
    return sellerService.getSellerDashboardData(sellerId);
}
