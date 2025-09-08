// src/app/admin/categories/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Lot Category Analysis Dashboard.
 * Provides functions to aggregate key statistics for lot category performance.
 */
'use server';
import { CategoryService } from '@bidexpert/services';

export interface CategoryPerformanceData {
  id: string;
  name: string;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}
const categoryService = new CategoryService();

/**
 * Fetches and aggregates performance data for all lot categories.
 * @returns {Promise<CategoryPerformanceData[]>} A promise that resolves to an array of category performance objects.
 */
export async function getCategoriesPerformanceAction(): Promise<CategoryPerformanceData[]> {
  try {
    return await categoryService.getCategoriesPerformance();
  } catch (error: any) {
    console.error("[Action - getCategoriesPerformanceAction] Error fetching category performance:", error);
    throw new Error("Falha ao buscar dados de performance das categorias.");
  }
}
