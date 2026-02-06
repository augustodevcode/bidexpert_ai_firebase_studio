// src/app/consignor-dashboard/financial/actions.ts
/**
 * @fileoverview Server Action para a visualização financeira do Painel do Comitente.
 * Busca todos os arremates (UserWin) para lotes associados a um comitente específico,
 * permitindo a geração de relatórios financeiros e a reconciliação de contas.
 */
'use server';

import { getPrismaInstance } from '@/lib/prisma';
import type { UserWin } from '@/types';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

/**
 * Fetches all UserWin records for a specific consignor by their seller ID.
 * It does this by finding all lots associated with the seller's auctions and then
 * finding the winning bids for those lots, all within the current tenant's context.
 * @param {string} sellerId - The ID of the seller/consignor.
 * @returns {Promise<UserWin[]>} A promise that resolves to an array of UserWin objects.
 */
export async function getFinancialDataForConsignor(sellerId: string): Promise<UserWin[]> {
  if (!sellerId) {
    console.warn("[Action - getFinancialDataForConsignor] No sellerId provided.");
    return [];
  }
  
  const prisma = getPrismaInstance();
  const tenantId = await getTenantIdFromRequest();

  const wins = await prisma.userWin.findMany({
      where: {
          Lot: {
              sellerId: sellerId,
              tenantId: tenantId, // Ensure we only get wins from the correct tenant
          }
      },
      include: {
          Lot: {
            include: {
              Auction: { select: { title: true } }
            }
          },
      },
      orderBy: {
          winDate: 'desc'
      }
  });
  
  // @ts-ignore
  return wins.map(win => ({
      ...win,
      lot: {
        ...(win as any).Lot,
        auctionName: (win as any).Lot?.Auction?.title
      }
  }));
}
