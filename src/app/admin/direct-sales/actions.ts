// src/app/admin/direct-sales/actions.ts
/**
 * @fileoverview Server Actions para a entidade DirectSaleOffer (Venda Direta).
 * Este arquivo define as funções que o cliente pode chamar para interagir
 * com os dados de ofertas de venda direta. Ele atua como a camada de Controller,
 * recebendo as requisições, chamando o DirectSaleOfferService para aplicar
 * a lógica de negócio e revalidando o cache quando necessário.
 */
'use server';

import { DirectSaleOfferService } from '@/services/direct-sale-offer.service';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';
import { revalidatePath } from 'next/cache';

const offerService = new DirectSaleOfferService();

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return offerService.getDirectSaleOffers();
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
    return offerService.getDirectSaleOfferById(id);
}

export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean, message: string, offerId?: string }> {
  const result = await offerService.createDirectSaleOffer(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/direct-sales');
  }
  return result;
}

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean, message: string }> {
  const result = await offerService.updateDirectSaleOffer(id, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
  }
  return result;
}

export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean, message: string }> {
  const result = await offerService.deleteDirectSaleOffer(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/direct-sales');
  }
  return result;
}
