// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Auction, AuctionFormData } from '@/types';

export async function getAuctions(): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    return await db.getAuctions();
}

export async function getAuction(id: string): Promise<Auction | null> {
    const db = await getDatabaseAdapter();
    return await db.getAuction(id);
}

export async function createAuction(data: AuctionFormData): Promise<{ success: boolean, message: string, auctionId?: string }> {
    console.warn("createAuction with sample data adapter is not implemented.");
    return { success: false, message: "Criação de leilão não implementada para o adaptador de dados de exemplo." };
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // This is a simplification. A real adapter would have a deleteAuction method.
    // @ts-ignore
    const result = await db.updateAuction(id, data);
    if (result.success) {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // This is a simplification. A real adapter would have a deleteAuction method.
    console.warn("deleteAuction with sample data adapter is not implemented.");
    return { success: false, message: "Exclusão de leilão não implementada para o adaptador de dados de exemplo." };
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
  const db = await getDatabaseAdapter();
  // @ts-ignore - Assuming a method that doesn't exist on all adapters yet
  return db.getAuctionsByIds ? db.getAuctionsByIds(ids) : [];
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const allSellers = await db.getSellers();
    const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
    if (!seller) return [];
    return allAuctions.filter(a => a.seller === seller.name);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const auctioneers = await db.getAuctioneers();
    const auctioneer = auctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneer === auctioneer.name);
}
