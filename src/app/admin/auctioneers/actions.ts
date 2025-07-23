// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SellerService } from '@/services/seller.service';

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return prisma.auctioneer.findMany({ orderBy: { name: 'asc' } });
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  return prisma.auctioneer.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    return prisma.auctioneer.findFirst({
        where: {
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    // @ts-ignore
    return prisma.auction.findMany({
        where: {
            auctioneer: {
                OR: [{ slug: auctioneerSlug }, { id: auctioneerSlug }, { publicId: auctioneerSlug }]
            }
        },
        include: { lots: true }
    });
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    try {
        const newAuctioneer = await prisma.auctioneer.create({ data: data as any });
        revalidatePath('/admin/auctioneers');
        return { success: true, message: "Leiloeiro criado com sucesso.", auctioneerId: newAuctioneer.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar leiloeiro: ${error.message}` };
    }
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.auctioneer.update({ where: { id }, data: data as any });
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
        return { success: true, message: "Leiloeiro atualizado com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    try {
        // In a real app, check for linked auctions first
        const linkedAuctions = await prisma.auction.count({ where: { auctioneerId: id } });
        if (linkedAuctions > 0) {
            return { success: false, message: `Não é possível excluir. O leiloeiro está vinculado a ${linkedAuctions} leilão(ões).` };
        }
        await prisma.auctioneer.delete({ where: { id } });
        revalidatePath('/admin/auctioneers');
        return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir leiloeiro: ${error.message}` };
    }
}
