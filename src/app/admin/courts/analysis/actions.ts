// src/app/admin/courts/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Court Analysis Dashboard.
 */
'use server';

import { analyzeAuctionData } from '@/ai/flows/analyze-auction-data-flow';
import { CourtService, type CourtPerformanceData } from '@/services/court.service';

const courtService = new CourtService();

export type { CourtPerformanceData };

/**
 * Fetches and aggregates performance data for all courts.
 */
export async function getCourtsPerformanceAction(): Promise<CourtPerformanceData[]> {
  try {
    return await courtService.getCourtsPerformance();
  } catch (error: any) {
    console.error("[Action - getCourtsPerformanceAction] Error fetching court performance:", error);
    throw new Error("Falha ao buscar dados de performance dos tribunais.");
  }
}
