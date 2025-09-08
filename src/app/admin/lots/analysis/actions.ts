// src/app/admin/lots/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Lot Analysis Dashboard.
 * Provides functions to aggregate key statistics for lot performance.
 */
'use server';

import { LotService } from '@bidexpert/services';
import type { Lot } from '@/types';

export interface LotPerformanceData extends Lot {
  auctionName: string;
  categoryName: string;
  sellerName: string;
  bidsCount: number;
}
const lotService = new LotService();

/**
 * Fetches and aggregates performance data for all lots.
 * @returns {Promise<LotPerformanceData[]>} A promise that resolves to an array of lot performance objects.
 */
export async function getLotsPerformanceAction(): Promise<LotPerformanceData[]> {
  try {
    return await lotService.getLotsPerformance();
  } catch (error: any) {
    console.error("[Action - getLotsPerformanceAction] Error fetching lot performance:", error);
    throw new Error("Falha ao buscar dados de performance dos lotes.");
  }
}
