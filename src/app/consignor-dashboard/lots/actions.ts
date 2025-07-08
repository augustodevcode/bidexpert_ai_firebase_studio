// src/app/consignor-dashboard/lots/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot } from '@/types';

export async function getLotsForConsignorAction(sellerId: string): Promise<Lot[]> {
  if (!sellerId) {
    console.warn("[Action - getLotsForConsignorAction] No sellerId provided.");
    return [];
  }
  
  try {
    const db = await getDatabaseAdapter();
    return await db.getLotsForConsignor(sellerId);
  } catch (error) {
    console.error(`Error fetching lots for consignor ${sellerId}:`, error);
    return [];
  }
}
