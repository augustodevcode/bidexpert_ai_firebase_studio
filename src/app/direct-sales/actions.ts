// src/app/direct-sales/actions.ts
/**
 * @fileoverview Server Actions para a seção pública de Venda Direta.
 * Este arquivo define as funções que podem ser chamadas do cliente para buscar
 * os dados das ofertas de venda direta, como a lista completa de ofertas ou
 * uma oferta específica por ID, delegando a lógica para o `DirectSaleOfferService`.
 */
'use server';

import { DirectSaleOfferService } from '@/services/direct-sale-offer.service';
import type { DirectSaleOffer } from '@/types';

const offerService = new DirectSaleOfferService();

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    const offers = await offerService.getDirectSaleOffers();
    return JSON.parse(JSON.stringify(offers, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
    ));
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    return offerService.getDirectSaleOfferById(id);
}
