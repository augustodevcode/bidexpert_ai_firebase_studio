// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { prisma } from '@/lib/prisma';
import { AuctionService } from '@/services/auction.service';
import { getSession } from '@/app/auth/actions';

const auctionService = new AuctionService();

async function getTenantIdFromSession(isPublicCall: boolean = false): Promise<string> {
    const session = await getSession();
    if (!session?.tenantId) {
        if (isPublicCall) {
            return '1'; // Landlord tenant ID for public data
        }
        throw new Error("Acesso não autorizado ou tenant não identificado.");
    }
    return session.tenantId;
}

export async function getAuctions(isPublicCall: boolean = false): Promise<Auction[]> {
    const tenantIdToUse = await getTenantIdFromSession(isPublicCall);
    return auctionService.getAuctions(tenantIdToUse);
}

export async function getAuction(id: string, isPublicCall: boolean = false): Promise<Auction | null> {
    const tenantId = await getTenantIdFromSession(isPublicCall);
    return auctionService.getAuctionById(tenantId, id);
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const tenantId = await getTenantIdFromSession();
    const result = await auctionService.createAuction(tenantId, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromSession();
    const result = await auctionService.updateAuction(tenantId, id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromSession();
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
   const tenantId = await getTenantIdFromSession(true); // Public call
   return auctionService.getAuctionsBySellerSlug(tenantId, sellerSlugOrPublicId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const tenantId = await getTenantIdFromSession(true); // Public call
    return auctionService.getAuctionsByAuctioneerSlug(tenantId, auctioneerSlug);
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  const tenantId = await getTenantIdFromSession(true); // Public call
  return auctionService.getAuctionsByIds(tenantId, ids);
}
