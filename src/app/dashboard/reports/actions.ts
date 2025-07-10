// src/app/dashboard/reports/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
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
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getUserReportData) {
    // @ts-ignore
    return db.getUserReportData(userId);
  }

  // Fallback if not implemented
  return {
    totalLotsWon: 0,
    totalAmountSpent: 0,
    totalBidsPlaced: 0,
    spendingByCategory: [],
  };
}
