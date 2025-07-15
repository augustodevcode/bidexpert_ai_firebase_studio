// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { getDatabaseAdapter } from '@/lib/database';

export async function getAuctions(): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    return db.getAuctions();
}

export async function getAuction(id: string): Promise<Auction | null> {
    const db = getDatabaseAdapter();
    return db.getAuction(id);
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const db = getDatabaseAdapter();
    // @ts-ignore - Adapter expects full Auction, but form data is partial.
    const result = await db.createAuction(data);
    if (result.success) {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    const result = await db.updateAuction(id, data);
    if (result.success) {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    const lots = await db.getLots(id);
    if (lots.length > 0) {
        return { success: false, message: `Não é possível excluir. O leilão possui ${lots.length} lote(s) associado(s).` };
    }
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
    const db = getDatabaseAdapter();
    const auctions = await Promise.all(ids.map(id => db.getAuction(id)));
    return auctions.filter((a): a is Auction => a !== null);
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const allSellers = await db.getSellers();
    const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
    if (!seller) return [];
    return allAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const allAuctioneers = await db.getAuctioneers();
    const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
}
