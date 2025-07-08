/**
 * @fileoverview Server Actions for the main admin reports page.
 * Provides functions to aggregate key statistics and data for platform-wide reports.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminReportData } from '@/types';

/**
 * Fetches and calculates key performance indicators for the main admin reports page.
 * This includes totals for revenue, users, auctions, lots, and data for charts.
 * @returns {Promise<AdminReportData>} A promise that resolves to an object with aggregated report data.
 */
export async function getAdminReportDataAction(): Promise<AdminReportData> {
  try {
    const usersCount = await prisma.user.count();
    const auctionsCount = await prisma.auction.count();
    const lotsCount = await prisma.lot.count();
    const sellersCount = await prisma.seller.count();

    // In a real application, these would be more complex time-series queries.
    // Here we use random data as a placeholder for the sales chart.
    const salesData = [
        { name: "Jan", Sales: Math.floor(Math.random() * 5000) },
        { name: "Feb", Sales: Math.floor(Math.random() * 5000) },
        { name: "Mar", Sales: Math.floor(Math.random() * 5000) },
        { name: "Apr", Sales: Math.floor(Math.random() * 5000) },
        { name: "May", Sales: Math.floor(Math.random() * 5000) },
        { name: "Jun", Sales: Math.floor(Math.random() * 5000) },
    ];

    // Fetch lot counts grouped by category name for the category chart.
    const categoryDataAgg = await prisma.lot.groupBy({
        by: ['categoryId'],
        _count: {
            id: true,
        },
    });
    const categories = await prisma.lotCategory.findMany({ where: { id: { in: categoryDataAgg.map(c => c.categoryId!) } } });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const categoryData = categoryDataAgg.map(item => ({
        name: categoryMap.get(item.categoryId!) || 'Desconhecido',
        value: item._count.id
    }));
    
    // Calculate total revenue from lots marked as 'VENDIDO'.
    const soldLots = await prisma.lot.findMany({ where: { status: 'VENDIDO' }});
    const totalRevenue = soldLots.reduce((sum, lot) => sum + lot.price, 0);

    return {
      users: usersCount,
      auctions: auctionsCount,
      lots: lotsCount,
      sellers: sellersCount,
      totalRevenue: totalRevenue,
      newUsersLast30Days: 0, // Placeholder
      activeAuctions: await prisma.auction.count({ where: { status: 'ABERTO_PARA_LANCES' }}),
      lotsSoldCount: soldLots.length,
      salesData,
      categoryData,
    };
  } catch (error) {
    console.error("[Action - getAdminReportDataAction] Error fetching admin stats:", error);
    // Return a default object on failure to prevent page crashes.
    return {
      users: 0,
      auctions: 0,
      lots: 0,
      sellers: 0,
      totalRevenue: 0,
      newUsersLast30Days: 0,
      activeAuctions: 0,
      lotsSoldCount: 0,
      salesData: [],
      categoryData: [],
    };
  }
}
