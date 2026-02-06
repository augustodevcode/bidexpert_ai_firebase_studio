// src/app/admin/judicial-districts/analysis/actions.ts
/**
 * @fileoverview Server Actions para o Dashboard de Análise de Comarcas.
 * Contém a lógica de backend para buscar e agregar dados de performance
 * de todas as comarcas, como faturamento total, número de leilões e lotes.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface DistrictPerformanceData {
  id: string;
  name: string;
  totalProcesses: number;
  totalAuctions: number;
  totalLotsSold: number;
  totalRevenue: number;
  averageTicket: number;
}

/**
 * Fetches and aggregates performance data for all judicial districts.
 */
export async function getDistrictsPerformanceAction(): Promise<DistrictPerformanceData[]> {
  try {
    const districts = await prisma.judicialDistrict.findMany({
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

    return districts.map(district => {
      const allLotsFromAuctions = (district as any).Auction.flatMap((auc: any) => auc.Lot);
      const totalRevenue = allLotsFromAuctions.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: district.id,
        name: district.name,
        totalProcesses: (district as any)._count.JudicialProcess,
        totalAuctions: (district as any)._count.Auction,
        totalLotsSold,
        totalRevenue,
        averageTicket,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error: any) {
    console.error("[Action - getDistrictsPerformanceAction] Error fetching district performance:", error);
    throw new Error("Falha ao buscar dados de performance das comarcas.");
  }
}
