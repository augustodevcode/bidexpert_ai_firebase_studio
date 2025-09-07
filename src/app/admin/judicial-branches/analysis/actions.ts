// src/app/admin/judicial-branches/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Judicial Branch Analysis Dashboard.
 */
'use server';

import { JudicialBranchService, type BranchPerformanceData } from '@/services/judicial-branch.service';

const branchService = new JudicialBranchService();

export type { BranchPerformanceData };

/**
 * Fetches and aggregates performance data for all judicial branches.
 */
export async function getBranchesPerformanceAction(): Promise<BranchPerformanceData[]> {
  try {
    return branchService.getBranchesPerformance();
  } catch (error: any) {
    console.error("[Action - getBranchesPerformanceAction] Error fetching branch performance:", error);
    throw new Error("Falha ao buscar dados de performance das varas.");
  }
}
