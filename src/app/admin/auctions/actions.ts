// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { prisma } from '@/lib/prisma'; // Keep for related simple queries
import { AuctionService } from '@/services/auction.service';

const auctionService = new AuctionService();

export async function getAuctions(): Promise<Auction[]> {
    return auctionService.getAuctions();
}

export async function getAuction(id: string): Promise<Auction | null> {
    return auctionService.getAuctionById(id);
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    const result = await auctionService.createAuction(data);
    if (result.success) {
        revalidatePath('/admin/auctions');
    }
    return result;
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    const result = await auctionService.updateAuction(id, data);
    if (result.success) {
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
    }
    return result;
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    const result = await auctionService.deleteAuction(id);
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
    if (ids.length === 0) return [];
    // This is now a simplified version. The service should be used for complex data.
    const auctions = await prisma.auction.findMany({
        where: { OR: [{ id: { in: ids }}, { publicId: { in: ids }}] },
        include: { lots: { select: { id: true } } }
    });
    // @ts-ignore
    return auctions.map(a => ({...a, totalLots: a.lots.length}));
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
   return auctionService.mapAuctionsWithDetails(
     await prisma.auction.findMany({
        where: {
            seller: {
                OR: [{ slug: sellerSlugOrPublicId }, { id: sellerSlugOrPublicId }, { publicId: sellerSlugOrPublicId }]
            }
        },
        include: { lots: { select: { id: true } }, seller: { select: { logoUrl: true, slug: true, publicId: true } } }
    })
   );
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    return auctionService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}
