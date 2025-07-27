// src/app/admin/cities/analysis/actions.ts
/**
 * @fileoverview Server Actions for the City Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction/lot performance by city.
 */
'use server';

import { prisma } from '@/lib/prisma';

export interface CityPerformanceData {
  id: string;
  name: string;
  stateUf: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  salesRate: number;
}

/**
 * Fetches and aggregates performance data for all cities with lots.
 * @returns {Promise<CityPerformanceData[]>} A promise that resolves to an array of city performance objects.
 */
export async function getCitiesPerformanceAction(): Promise<CityPerformanceData[]> {
  try {
    const citiesWithLots = await prisma.city.findMany({
      where: {
        lots: {
          some: {}, // Ensure the city has at least one lot
        },
      },
      include: {
        lots: {
          select: {
            id: true,
            status: true,
            price: true,
          },
        },
        _count: {
          select: {
            lots: true,
          },
        },
      },
    });

    return citiesWithLots.map(city => {
      const lotsSoldCount = city.lots.filter(lot => lot.status === 'VENDIDO').length;
      const totalRevenue = city.lots
        .filter(lot => lot.status === 'VENDIDO')
        .reduce((acc, lot) => acc + (lot.price || 0), 0);
      const totalLots = city._count.lots;
      const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;

      return {
        id: city.id,
        name: city.name,
        stateUf: city.stateUf || 'N/A',
        totalLots,
        lotsSoldCount,
        totalRevenue,
        salesRate,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
    
  } catch (error: any) {
    console.error("[Action - getCitiesPerformanceAction] Error fetching city performance:", error);
    throw new Error("Falha ao buscar dados de performance das cidades.");
  }
}
