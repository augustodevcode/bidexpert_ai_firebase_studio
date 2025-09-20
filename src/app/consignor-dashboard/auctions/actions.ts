// src/app/consignor-dashboard/auctions/actions.ts
/**
 * @fileoverview Server Action para a visualização de leilões do Painel do Comitente.
 * Este arquivo contém a função para buscar todos os leilões associados a um
 * comitente (vendedor) específico, permitindo que eles visualizem apenas
 * os leilões que lhes dizem respeito.
 */
'use server';

import { SellerService } from '@/services/seller.service';
import type { Auction } from '@/types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';


/**
 * Fetches auctions for a specific consignor based on their seller ID.
 * The tenantId is inferred from the user session to ensure data isolation.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<Auction[]>} A promise that resolves to an array of Auction objects.
 */
export async function getAuctionsForConsignorAction(sellerId: string): Promise<Auction[]> {
  if (!sellerId) {
    console.warn("[Action - getAuctionsForConsignorAction] No sellerId provided.");
    return [];
  }
  
  const tenantId = await getTenantIdFromRequest();
  const sellerService = new SellerService();
  // The service method needs to handle fetching by ID or slug and must be tenant-aware.
  return sellerService.getAuctionsBySellerSlug(tenantId, sellerId);
}
