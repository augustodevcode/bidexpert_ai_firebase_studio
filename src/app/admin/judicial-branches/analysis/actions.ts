// src/app/admin/judicial-branches/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Varas Judiciais.
 * Este arquivo contém a lógica para buscar e agregar dados de performance de
 * todas as varas judiciais, calculando métricas chave como faturamento,
 * número de processos, leilões, lotes vendidos, taxa de venda e ticket médio.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone';

export interface BranchPerformanceData {
  id: string;
  name: string;
  totalProcesses: number;
  totalAuctions: number;
  totalLots: number;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
  salesRate: number;
}

/**
 * Fetches and aggregates performance data for all judicial branches.
 */
export async function getBranchesPerformanceAction(): Promise<BranchPerformanceData[]> {
  const prisma = getPrismaInstance();
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
              select: { price: true, updatedAt: true }
            },
            _count: {
              select: { lots: true },
            },
          },
        },
      },
    });

    return branches.map(branch => {
      const allLotsFromAuctions = branch.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;
      const totalLotsInAuctions = branch.auctions.reduce((sum, auc) => sum + auc._count.lots, 0);
      const salesRate = totalLotsInAuctions > 0 ? (totalLotsSold / totalLotsInAuctions) * 100 : 0;

      return {
        id: branch.id,
        name: branch.name,
        totalProcesses: branch._count.judicialProcesses,
        totalAuctions: branch._count.auctions,
        totalLots: totalLotsInAuctions,
        totalLotsSold,
        totalRevenue,
        averageTicket,
        salesRate,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error: any) {
    console.error("[Action - getBranchesPerformanceAction] Error fetching branch performance:", error);
    throw new Error("Falha ao buscar dados de performance das varas.");
  }
}