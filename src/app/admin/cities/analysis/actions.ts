// src/app/admin/cities/analysis/actions.ts
/**
 * @fileoverview Server Actions for the City Analysis Dashboard.
 * Provides functions to aggregate key statistics for auction/lot performance by city.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma as PrismaTypes } from '@prisma/client';

export interface CityPerformanceData {
  id: string;
  name: string;
  stateUf: string;
  totalLots: number;
  lotsSoldCount: number;
  totalRevenue: number;
  salesRate: number;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Fetches and aggregates performance data for all cities with lots.
 * @returns {Promise<CityPerformanceData[]>} A promise that resolves to an array of city performance objects.
 */
export async function getCitiesPerformanceAction(): Promise<CityPerformanceData[]> {
  try {
    const citiesWithLots = await prisma.city.findMany({
      where: {
        Lot: {
          some: {}, // Ensure the city has at least one lot
        },
      },
      include: {
        _count: {
          select: { Lot: true },
        },
        Lot: {
          where: { status: 'VENDIDO' },
          select: { price: true },
        },
      },
    });

    return citiesWithLots.map(city => {
      const lotsSoldCount = (city as any).Lot.length;
      const totalRevenue = (city as any).Lot.reduce((acc: number, lot: any) => acc + (lot.price ? Number(lot.price) : 0), 0);
      const totalLots = (city as any)._count.Lot;
      const salesRate = totalLots > 0 ? (lotsSoldCount / totalLots) * 100 : 0;
      const latitude = city.latitude ? Number(city.latitude) : null;
      const longitude = city.longitude ? Number(city.longitude) : null;


      return {
        id: city.id,
        name: city.name,
        stateUf: city.stateUf || 'N/A',
        totalLots,
        lotsSoldCount,
        totalRevenue,
        salesRate,
        latitude,
        longitude,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sort by revenue descending
    
  } catch (error: any) {
    console.error("[Action - getCitiesPerformanceAction] Error fetching city performance:", error);
    throw new Error("Falha ao buscar dados de performance das cidades.");
  }
}
