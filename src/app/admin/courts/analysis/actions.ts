// src/app/admin/courts/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Court Analysis Dashboard.
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
 */
export async function getCourtsPerformanceAction(): Promise<CourtPerformanceData[]> {
  try {
    const courts = await prisma.court.findMany({
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

    return courts.map(court => {
      const allLotsFromAuctions = court.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: court.id,
        name: court.name,
        totalProcesses: court._count.judicialProcesses,
        totalAuctions: court._count.auctions,
        totalLotsSold,
        totalRevenue,
        averageTicket,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error: any) {
    console.error("[Action - getCourtsPerformanceAction] Error fetching court performance:", error);
    throw new Error("Falha ao buscar dados de performance dos tribunais.");
  }
}
