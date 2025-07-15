// src/app/direct-sales/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { DirectSaleOffer } from '@/types';

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    return (db.getDirectSaleOffers && await db.getDirectSaleOffers()) || [];
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    const offers = await getDirectSaleOffers();
    return offers.find(o => o.id === id || o.publicId === id) || null;
}
