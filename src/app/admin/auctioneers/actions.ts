// src/app/admin/auctioneers/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';
import { fetchAuctions, fetchAuctioneers } from '@/lib/data-queries';

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return fetchAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const auctioneer = await prisma.auctioneer.findFirst({
      where: { OR: [{id}, {publicId: id}]}
  });
  return auctioneer as unknown as AuctioneerProfileInfo | null;
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneer = await prisma.auctioneer.findFirst({
        where: { OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }] }
    });
    return auctioneer as unknown as AuctioneerProfileInfo | null;
}


export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const allAuctions = await fetchAuctions();
    const auctioneer = await getAuctioneerBySlug(auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneer === auctioneer.name);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    try {
        const newAuctioneer = await prisma.auctioneer.create({
            data: {
                ...data,
                slug: slugify(data.name),
            }
        });
        revalidatePath('/admin/auctioneers');
        return { success: true, message: 'Leiloeiro criado com sucesso!', auctioneerId: newAuctioneer.id };
    } catch (error: any) {
        console.error("Error creating auctioneer:", error);
        return { success: false, message: `Falha ao criar leiloeiro: ${error.message}` };
    }
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    try {
        const updateData: any = {...data};
        if (data.name) {
            updateData.slug = slugify(data.name);
        }
        await prisma.auctioneer.update({
            where: { id },
            data: updateData,
        });
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
        return { success: true, message: 'Leiloeiro atualizado com sucesso!' };
    } catch (error: any) {
        console.error(`Error updating auctioneer ${id}:`, error);
        return { success: false, message: `Falha ao atualizar leiloeiro: ${error.message}` };
    }
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    try {
        // In a real app, check for linked auctions first
        await prisma.auctioneer.delete({ where: { id } });
        revalidatePath('/admin/auctioneers');
        return { success: true, message: 'Leiloeiro excluído com sucesso.' };
    } catch (error: any) {
        console.error(`Error deleting auctioneer ${id}:`, error);
        return { success: false, message: 'Falha ao excluir leiloeiro.' };
    }
}
