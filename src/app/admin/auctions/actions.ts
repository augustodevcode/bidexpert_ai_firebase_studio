// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { AuctionService } from '@/services/auction.service';
import { AuctioneerService } from '@/services/auctioneer.service'; // Import AuctioneerService
import { SellerService } from '@/services/seller.service'; // Import SellerService

const auctionService = new AuctionService();
const auctioneerService = new AuctioneerService();
const sellerService = new SellerService();

export async function getAuctions(): Promise<Auction[]> {
    return auctionService.getAuctions();
}

export async function getAuctioneers() {
    return auctioneerService.getAuctioneers();
}

export async function getSellers() {
    return sellerService.getSellers();
}

export async function getAuction(id: string): Promise<Auction | null> {
    return auctionService.getAuctionById(id);
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const result = await auctionService.createAuction(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const result = await auctionService.updateAuction(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const result = await auctionService.deleteAuction(id);
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

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
    if (ids.length === 0) return [];
    return auctionService.getAuctionsByIds(ids);
}
