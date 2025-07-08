
'use server';

import { prisma } from '@/lib/prisma';
import type { AdminReportData } from '@/types';

export async function getAdminReportDataAction(): Promise<AdminReportData> {
  try {
    const usersCount = await prisma.user.count();
    const auctionsCount = await prisma.auction.count();
    const lotsCount = await prisma.lot.count();
    const sellersCount = await prisma.seller.count();

    // These would be more complex queries in a real app
    const salesData = [
        { name: "Jan", Sales: Math.floor(Math.random() * 5000) },
        { name: "Feb", Sales: Math.floor(Math.random() * 5000) },
        { name: "Mar", Sales: Math.floor(Math.random() * 5000) },
        { name: "Apr", Sales: Math.floor(Math.random() * 5000) },
        { name: "May", Sales: Math.floor(Math.random() * 5000) },
        { name: "Jun", Sales: Math.floor(Math.random() * 5000) },
    ];

    const categoryData = [
        { name: "Veículos", value: await prisma.lot.count({ where: { category: { name: 'Veículos' } } }) },
        { name: "Imóveis", value: await prisma.lot.count({ where: { category: { name: 'Imóveis' } } }) },
        { name: "Máquinas", value: await prisma.lot.count({ where: { category: { name: 'Máquinas e Equipamentos' } } }) },
    ];
    
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
