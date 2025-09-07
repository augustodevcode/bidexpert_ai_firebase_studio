// src/app/direct-sales/actions.ts
'use server';

import { DirectSaleOfferService } from '@bidexpert/services';
import type { DirectSaleOffer } from '@/types';

const offerService = new DirectSaleOfferService();

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return offerService.getDirectSaleOffers();
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    return offerService.getDirectSaleOfferById(id);
}
