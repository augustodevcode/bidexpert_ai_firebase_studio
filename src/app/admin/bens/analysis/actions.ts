// src/app/admin/bens/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Bem (Asset) Analysis Dashboard.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Bem } from '@/types';

export interface BemAnalysisData {
  totalBens: number;
  totalEvaluationValue: number;
  availableBensCount: number;
  lottedBensCount: number;
  soldBensCount: number;
  distributionByCategory: { name: string, value: number }[];
  bens: any[]; // Returning full bem data for the table
}

/**
 * Fetches and aggregates performance data for all assets (Bens).
 * @returns {Promise<BemAnalysisData>} A promise that resolves to an object with asset statistics.
 */
export async function getBensAnalysisAction(): Promise<BemAnalysisData> {
  try {
    const allBens = await prisma.bem.findMany({
      include: {
        category: { select: { name: true } },
        seller: { select: { name: true } },
        judicialProcess: { select: { processNumber: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const totalBens = allBens.length;
    let totalEvaluationValue = 0;
    let availableBensCount = 0;
    let lottedBensCount = 0;
    let soldBensCount = 0;
    const categoryCounts: Record<string, number> = {};

    allBens.forEach(bem => {
      if (bem.status === 'DISPONIVEL') {
        availableBensCount++;
        totalEvaluationValue += bem.evaluationValue || 0;
      }
      if (bem.status === 'LOTEADO') lottedBensCount++;
      if (bem.status === 'VENDIDO') soldBensCount++;

      const categoryName = bem.category?.name || 'Sem Categoria';
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });
    
    const distributionByCategory = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    return {
      totalBens,
      totalEvaluationValue,
      availableBensCount,
      lottedBensCount,
      soldBensCount,
      distributionByCategory,
      bens: allBens.map(b => ({...b, categoryName: b.category?.name, sellerName: b.seller?.name, judicialProcessNumber: b.judicialProcess?.processNumber })),
    };
  } catch (error: any) {
    console.error("[Action - getBensAnalysisAction] Error fetching asset analysis:", error);
    throw new Error("Falha ao buscar dados de análise dos bens.");
  }
}
