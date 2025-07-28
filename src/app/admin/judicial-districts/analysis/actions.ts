// src/app/admin/judicial-districts/analysis/actions.ts
/**
 * @fileoverview Server Actions for the Judicial District Analysis Dashboard.
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

    return districts.map(district => {
      const allLotsFromAuctions = district.auctions.flatMap(auc => auc.lots);
      const totalRevenue = allLotsFromAuctions.reduce((acc, lot) => acc + (lot.price || 0), 0);
      const totalLotsSold = allLotsFromAuctions.length;
      const averageTicket = totalLotsSold > 0 ? totalRevenue / totalLotsSold : 0;

      return {
        id: district.id,
        name: district.name,
        totalProcesses: district._count.judicialProcesses,
        totalAuctions: district._count.auctions,
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
