'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { DirectSaleOffer } from '@/types';

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  try {
    const db = await getDatabaseAdapter();
    return await db.getDirectSaleOffers();
  } catch (error) {
    console.error("[Action - getDirectSaleOffers] Error fetching direct sale offers:", error);
    return [];
  }
}
