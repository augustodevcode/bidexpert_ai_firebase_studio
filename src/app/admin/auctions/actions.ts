// src/app/admin/auctions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Auction, AuctionFormData } from '@/types';
import { prisma } from '@/lib/prisma'; // Alterado

export async function getAuctions(): Promise<Auction[]> {
    const auctions = await prisma.auction.findMany({
        orderBy: { auctionDate: 'desc' },
        include: { lots: true }
    });
    return auctions.map(a => ({...a, totalLots: a.lots.length}));
}

export async function getAuction(id: string): Promise<Auction | null> {
    const auction = await prisma.auction.findFirst({
        where: { OR: [{ id }, { publicId: id }] },
        include: { lots: true, auctionStages: true }
    });
    if (!auction) return null;
    return {...auction, totalLots: auction.lots.length};
}

export async function createAuction(data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string, auctionId?: string }> {
    try {
        const result = await prisma.auction.create({
            // @ts-ignore
            data: data
        });
        revalidatePath('/admin/auctions');
        return { success: true, message: 'Leilão criado com sucesso.', auctionId: result.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar leilão: ${error.message}` };
    }
}

export async function updateAuction(id: string, data: Partial<AuctionFormData>): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.auction.update({ where: { id }, data: data });
        revalidatePath('/admin/auctions');
        revalidatePath(`/admin/auctions/${id}/edit`);
        return { success: true, message: 'Leilão atualizado com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar leilão: ${error.message}` };
    }
}

export async function deleteAuction(id: string): Promise<{ success: boolean, message: string }> {
    try {
        const lots = await prisma.lot.count({ where: { auctionId: id }});
        if (lots > 0) {
            return { success: false, message: `Não é possível excluir. O leilão possui ${lots} lote(s) associado(s).` };
        }
        await prisma.auction.delete({ where: { id } });
        revalidatePath('/admin/auctions');
        return { success: true, message: 'Leilão excluído com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir leilão: ${error.message}` };
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
    if (ids.length === 0) return [];
    return prisma.auction.findMany({
        where: { OR: [{ id: { in: ids }}, { publicId: { in: ids }}] },
        include: { lots: true }
    });
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    return prisma.auction.findMany({
        where: {
            seller: {
                OR: [{ slug: sellerSlugOrPublicId }, { id: sellerSlugOrPublicId }, { publicId: sellerSlugOrPublicId }]
            }
        },
        include: { lots: true }
    });
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
     return prisma.auction.findMany({
        where: {
            auctioneer: {
                OR: [{ slug: auctioneerSlug }, { id: auctioneerSlug }, { publicId: auctioneerSlug }]
            }
        },
        include: { lots: true }
    });
}
