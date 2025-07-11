// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Auction, AuctionFormData } from '@/types';
import { fetchAuctions, fetchAuction, fetchAuctionsByIds, fetchAuctionsBySellerSlug, fetchAuctionsByAuctioneerSlug } from '@/lib/data-queries';

export async function getAuctions(): Promise<Auction[]> {
    return fetchAuctions();
}

export async function getAuction(id: string): Promise<Auction | null> {
    return fetchAuction(id);
}

export async function createAuction(data: AuctionFormData): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const db = await getDatabaseAdapter();
    const result = await db.createAuction(data);
    if (result.success) {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    const result = await db.updateAuction(id, data);
    if (result.success) {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    const result = await db.deleteAuction(id);
    if (result.success) {
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

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  return fetchAuctionsByIds(ids);
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    return fetchAuctionsBySellerSlug(sellerSlugOrPublicId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    return fetchAuctionsByAuctioneerSlug(auctioneerSlug);
}
