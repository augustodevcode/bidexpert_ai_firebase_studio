// src/app/consignor-dashboard/lots/actions.ts
/**
 * @fileoverview Server Action para a visualização de lotes do Painel do Comitente.
 * Este arquivo define a função que busca todos os lotes pertencentes a um
 * comitente específico, abrangendo todos os leilões em que ele está envolvido.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import type { Lot } from '@/types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

/**
 * Fetches all lots associated with a specific consignor's auctions, respecting tenant isolation.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<Lot[]>} A promise that resolves to an array of Lot objects.
 */
export async function getLotsForConsignorAction(sellerId: string): Promise<Lot[]> {
  if (!sellerId) {
    console.warn("[Action - getLotsForConsignorAction] No sellerId provided.");
    return [];
  }
  
  const prisma = getPrismaInstance();
  const tenantId = await getTenantIdFromRequest();

  const lots = await prisma.lot.findMany({
    where: { 
      sellerId: sellerId,
      tenantId: tenantId,
    },
    include: { Auction: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }
  });

  // @ts-ignore
  return lots.map(lot => ({ ...lot, auctionName: (lot as any).Auction?.title }));
}
