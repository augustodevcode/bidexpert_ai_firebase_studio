// src/app/admin/judicial-districts/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Judicial District Analysis Dashboard.
 */
'use server';

import { JudicialDistrictService, type DistrictPerformanceData } from '@/services/judicial-district.service';

const districtService = new JudicialDistrictService();

export type { DistrictPerformanceData };

/**
 * Fetches and aggregates performance data for all judicial districts.
 * @returns {Promise<DistrictPerformanceData[]>} A promise that resolves to an array of district performance objects.
 */
export async function getDistrictsPerformanceAction(): Promise<DistrictPerformanceData[]> {
  try {
    return districtService.getDistrictsPerformance();
  } catch (error: any) {
    console.error("[Action - getDistrictsPerformanceAction] Error fetching district performance:", error);
    throw new Error("Falha ao buscar dados de performance das comarcas.");
  }
}
