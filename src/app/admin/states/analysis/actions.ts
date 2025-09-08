// src/app/admin/states/analysis/actions.ts
/**
 * @fileoverview Server Actions for the State Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction/lot performance by state.
 */
'use server';
import { StateService } from '@bidexpert/services';

export interface StatePerformanceData {
  id: string;
  name: string;
  uf: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  salesRate: number;
  cityWithHighestRevenue: string;
  mostValuableCategory: string;
}
const stateService = new StateService();

/**
 * Fetches and aggregates performance data for all states with lots.
 * @returns {Promise<StatePerformanceData[]>} A promise that resolves to an array of state performance objects.
 */
export async function getStatesPerformanceAction(): Promise<StatePerformanceData[]> {
  try {
    return await stateService.getStatesPerformance();
  } catch (error: any) {
    console.error("[Action - getStatesPerformanceAction] Error fetching state performance:", error);
    throw new Error("Falha ao buscar dados de performance dos estados.");
  }
}
