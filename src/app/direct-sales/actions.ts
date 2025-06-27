
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

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    if (!id) return null;
    try {
        const offers = await getDirectSaleOffers();
        return offers.find(o => o.id === id) || null;
    } catch (error) {
        console.error(`[Action - getDirectSaleOffer] Error fetching offer ${id}:`, error);
        return null;
    }
}
