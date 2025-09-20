// src/app/consignor-dashboard/direct-sales/actions.ts
/**
 * @fileoverview Server Actions para a visualização de Vendas Diretas do Painel do Comitente.
 * Fornece funções para buscar ofertas de venda direta associadas a um
 * comitente (vendedor) específico.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

/**
 * Fetches all direct sale offers for a specific consignor by their seller ID.
 * The tenant context is respected to ensure data isolation.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<DirectSaleOffer[]>} A promise that resolves to an array of DirectSaleOffer objects.
 */
export async function getDirectSaleOffersForConsignorAction(sellerId: string): Promise<DirectSaleOffer[]> {
  if (!sellerId) {
    console.warn("[Action - getDirectSaleOffersForConsignorAction] No sellerId provided.");
    return [];
  }
  
  const tenantId = await getTenantIdFromRequest();

  // Directly query using Prisma, filtering by both sellerId and tenantId
  const offers = await prisma.directSaleOffer.findMany({
    where: { sellerId: sellerId, tenantId: tenantId },
    orderBy: { createdAt: 'desc' }
  });

  return offers as DirectSaleOffer[];
}
