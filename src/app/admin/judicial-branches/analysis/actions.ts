// src/app/admin/judicial-branches/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Judicial Branch Analysis Dashboard.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface BranchPerformanceData {
  id: string;
  name: string;
  totalProcesses: number;
  totalAuctions: number;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}

/**
 * Fetches and aggregates performance data for all judicial branches.
 */
export async function getBranchesPerformanceAction(): Promise<BranchPerformanceData[]> {
  try {
    const branches = await prisma.judicialBranch.findMany({
      include: {
        _count: {
          select: { judicialProcesses: true, auctions: true },
        },
        auctions: {
          include: {
            lots: {
              where: { status: 'VENDIDO' },
              select: { price: true },
            },
          },
        },
      },
    });

    return branches.map(branch => {
      const allLotsFromAuctions = branch.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: branch.id,
        name: branch.name,
        totalProcesses: branch._count.judicialProcesses,
        totalAuctions: branch._count.auctions,
        totalLotsSold,
        totalRevenue,
        averageTicket,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error: any) {
    console.error("[Action - getBranchesPerformanceAction] Error fetching branch performance:", error);
    throw new Error("Falha ao buscar dados de performance das varas.");
  }
}
