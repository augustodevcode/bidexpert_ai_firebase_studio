// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Auction, AuctionFormData } from '@/types';
import { fetchAuctions, fetchAuction, fetchAuctionsByIds, fetchAuctionsBySellerSlug, fetchAuctionsByAuctioneerSlug } from '@/lib/data-queries';

export async function getAuctions(): Promise<Auction[]> {
    return fetchAuctions();
}

export async function getAuction(id: string): Promise<Auction | null> {
    return fetchAuction(id);
}

export async function createAuction(data: AuctionFormData): Promise<{ success: boolean, message: string, auctionId?: string }> {
    try {
        const newAuction = await prisma.auction.create({
            data: {
                ...data,
                // Ensure required fields that might be optional on the form have defaults
                status: data.status || 'RASCUNHO',
                isFeaturedOnMarketplace: data.isFeaturedOnMarketplace || false,
                automaticBiddingEnabled: data.automaticBiddingEnabled || false,
                allowInstallmentBids: data.allowInstallmentBids || false,
                softCloseEnabled: data.softCloseEnabled || false,
                softCloseMinutes: data.softCloseMinutes || 2,
                silentBiddingEnabled: data.silentBiddingEnabled || false,
                allowMultipleBidsPerUser: data.allowMultipleBidsPerUser ?? true,
                auctionStages: {
                    create: data.auctionStages,
                },
                // Prisma handles default values for createdAt/updatedAt
            }
        });
        revalidatePath('/admin/auctions');
        return { success: true, message: 'Leilão criado com sucesso!', auctionId: newAuction.id };
    } catch (error: any) {
        console.error("Error creating auction:", error);
        return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.auction.update({
            where: { id },
            data: {
                ...data,
                auctionStages: data.auctionStages ? {
                    deleteMany: {}, // Delete old stages
                    create: data.auctionStages, // Create new ones
                } : undefined,
            }
        });
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
        return { success: true, message: 'Leilão atualizado com sucesso!' };
    } catch (error: any) {
        console.error(`Error updating auction ${id}:`, error);
        return { success: false, message: `Falha ao atualizar leilão: ${error.message}` };
    }
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    try {
        const lotCount = await prisma.lot.count({ where: { auctionId: id } });
        if (lotCount > 0) {
            return { success: false, message: `Não é possível excluir. O leilão possui ${lotCount} lote(s) associado(s).` };
        }
        await prisma.auction.delete({ where: { id } });
        revalidatePath('/admin/auctions');
        return { success: true, message: 'Leilão excluído com sucesso!' };
    } catch (error: any) {
        console.error(`Error deleting auction ${id}:`, error);
        return { success: false, message: 'Falha ao excluir leilão.' };
    }
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
