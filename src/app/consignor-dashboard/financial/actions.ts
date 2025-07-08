// src/app/consignor-dashboard/financial/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { UserWin } from '@/types';

export async function getFinancialDataForConsignor(sellerId: string): Promise<UserWin[]> {
  if (!sellerId) {
    console.warn("[Action - getFinancialDataForConsignor] No sellerId provided.");
    return [];
  }
  const db = await getDatabaseAdapter();
  return db.getWinsForSeller(sellerId);
}
