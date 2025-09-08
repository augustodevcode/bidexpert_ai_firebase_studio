// src/app/admin/cities/analysis/actions.ts
/**
 * @fileoverview Server Actions for the City Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction/lot performance by city.
 */
'use server';

import { CityService } from '@bidexpert/services';

export interface CityPerformanceData {
  id: string;
  name: string;
  stateUf: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  salesRate: number;
  latitude: number | null;
  longitude: number | null;
}
const cityService = new CityService();

/**
 * Fetches and aggregates performance data for all cities with lots.
 * @returns {Promise<CityPerformanceData[]>} A promise that resolves to an array of city performance objects.
 */
export async function getCitiesPerformanceAction(): Promise<CityPerformanceData[]> {
  try {
    return await cityService.getCitiesPerformance();
  } catch (error: any) {
    console.error("[Action - getCitiesPerformanceAction] Error fetching city performance:", error);
    throw new Error("Falha ao buscar dados de performance das cidades.");
  }
}
