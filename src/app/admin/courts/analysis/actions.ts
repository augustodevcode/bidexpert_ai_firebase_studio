// src/app/admin/courts/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Court Analysis Dashboard.
 * Contém a lógica de backend para buscar e agregar dados de performance
 * para todos os tribunais, como faturamento total, número de leilões e lotes.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface CourtPerformanceData {
  id: string;
  name: string;
  totalProcesses: number;
  totalAuctions: number;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}

/**
 * Fetches and aggregates performance data for all courts.
 * Calcula métricas como receita total, número de processos, leilões, lotes vendidos e ticket médio.
 * @returns {Promise<CourtPerformanceData[]>} Uma promessa que resolve para um array de dados de performance dos tribunais.
 */
export async function getCourtsPerformanceAction(): Promise<CourtPerformanceData[]> {
  try {
    const courts = await prisma.court.findMany({
      include: {
        _count: {
          select: { JudicialProcess: true, Auction: true },
        },
        Auction: {
          include: {
            Lot: {
              where: { status: 'VENDIDO' },
              select: { price: true },
            },
          },
        },
      },
    });

    return courts.map(court => {
      const allLotsFromAuctions = (court as any).Auction.flatMap((auc: any) => auc.Lot);
      const totalRevenue = allLotsFromAuctions.reduce((acc: number, lot: any) => acc + (lot.price || 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: court.id,
        name: court.name,
        totalProcesses: (court as any)._count.JudicialProcess,
        totalAuctions: (court as any)._count.Auction,
        totalLotsSold,
        totalRevenue: Number(totalRevenue),
        averageTicket: Number(averageTicket),
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error: any) {
    console.error("[Action - getCourtsPerformanceAction] Error fetching court performance:", error);
    throw new Error("Falha ao buscar dados de performance dos tribunais.");
  }
}
