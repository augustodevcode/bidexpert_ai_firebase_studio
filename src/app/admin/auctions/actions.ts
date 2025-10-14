// src/app/admin/auctions/actions.ts
/**
 * @fileoverview Server Actions para a entidade Auction (Leilão).
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização
 * e exclusão (CRUD) de leilões. Atua como a camada de Controller que interage
 * com a AuctionService, lida com o contexto de tenant e revalida o cache do Next.js
 * quando necessário.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { AuctionService } from '@/services/auction.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const auctionService = new AuctionService();

export async function getAuctions(isPublicCall: boolean = false, limit?: number): Promise<Auction[]> {
    const tenantIdToUse = await getTenantIdFromRequest(isPublicCall);
    return auctionService.getAuctions(tenantIdToUse, limit, isPublicCall);
}

export async function getAuction(id: string, isPublicCall: boolean = false): Promise<Auction | null> {
    const tenantId = await getTenantIdFromRequest(isPublicCall);
    return auctionService.getAuctionById(tenantId, id, isPublicCall);
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.createAuction(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.updateAuction(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await auctionService.deleteAuction(tenantId, id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuctionTitle(id: string, newTitle: string): Promise<{ success: boolean; message: string; }> {
    if (!newTitle || newTitle.trim().length < 5) {
        return { success: false, message: "Título deve ter pelo menos 5 caracteres." };
    }
    return updateAuction(id, { title: newTitle });
}

export async function updateAuctionImage(auctionId: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean; message: string; }> {
    return updateAuction(auctionId, { imageMediaId: mediaItemId, imageUrl: imageUrl });
}

export async function updateAuctionFeaturedStatus(id: string, newStatus: boolean): Promise<{ success: boolean; message: string; }> {
    return updateAuction(id, { isFeaturedOnMarketplace: newStatus });
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
   const tenantId = await getTenantIdFromRequest(true); // Public call
   return auctionService.getAuctionsBySellerSlug(tenantId, sellerSlugOrPublicId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const tenantId = await getTenantIdFromRequest(true); // Public call
    return auctionService.getAuctionsByAuctioneerSlug(tenantId, auctioneerSlug);
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  const tenantId = await getTenantIdFromRequest(true); // Public call
  return auctionService.getAuctionsByIds(tenantId, ids);
}
