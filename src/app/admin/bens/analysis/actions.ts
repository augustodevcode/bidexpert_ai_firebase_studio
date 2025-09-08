// src/app/admin/bens/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Bem (Asset) Analysis Dashboard.
 */
'use server';

import type { Bem } from '@/types';
import { BemService } from '@bidexpert/services';

export interface BemAnalysisData {
  totalBens: number;
  totalEvaluationValue: number;
  availableBensCount: number;
  lottedBensCount: number;
  soldBensCount: number;
  distributionByCategory: { name: string, value: number }[];
  bens: any[]; // Returning full bem data for the table
}

const bemService = new BemService();

/**
 * Fetches and aggregates performance data for all assets (Bens).
 * @returns {Promise<BemAnalysisData>} A promise that resolves to an object with asset statistics.
 */
export async function getBensAnalysisAction(): Promise<BemAnalysisData> {
  try {
    return await bemService.getBensAnalysis();
  } catch (error: any) {
    console.error("[Action - getBensAnalysisAction] Error fetching asset analysis:", error);
    throw new Error("Falha ao buscar dados de análise dos bens.");
  }
}
