// src/app/dashboard/reports/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';

export interface UserReportData {
    totalLotsWon: number;
    totalAmountSpent: number;
    totalBidsPlaced: number;
    spendingByCategory: {
        name: string;
        value: number;
    }[];
}

export async function getUserReportDataAction(userId: string): Promise<UserReportData> {
  if (!userId) {
    throw new Error("User ID is required to generate a report.");
  }
  
  const totalLotsWon = await prisma.lot.count({
    where: {
      winnerId: userId,
      status: 'VENDIDO',
    }
  });

  const wonLots = await prisma.lot.findMany({
    where: {
      winnerId: userId,
      status: 'VENDIDO'
    },
    select: {
      price: true,
      categoryId: true,
    }
  });

  const totalAmountSpent = wonLots.reduce((sum, lot) => sum + (lot.price || 0), 0);
  
  const totalBidsPlaced = await prisma.bid.count({
    where: {
      bidderId: userId,
    }
  });

  const spendingByCategoryMap = new Map<string, number>();
  const categoryIds = [...new Set(wonLots.map(lot => lot.categoryId).filter(Boolean) as string[])];
  const categories = await prisma.lotCategory.findMany({ where: { id: { in: categoryIds } } });
  
  for (const lot of wonLots) {
    if (lot.categoryId) {
      const categoryName = categories.find(c => c.id === lot.categoryId)?.name || 'Outros';
      const currentAmount = spendingByCategoryMap.get(categoryName) || 0;
      spendingByCategoryMap.set(categoryName, currentAmount + (lot.price || 0));
    }
  }

  const spendingByCategory = Array.from(spendingByCategoryMap, ([name, value]) => ({ name, value }));
  
  return {
    totalLotsWon,
    totalAmountSpent,
    totalBidsPlaced,
    spendingByCategory,
  };
}
