// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { AuctioneerService } from '@/services/auctioneer.service';

const auctioneerService = new AuctioneerService();

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return auctioneerService.getAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  return auctioneerService.getAuctioneerById(id);
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    // This logic might be better inside the service/repository, but keeping here for simplicity for now
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
        include: { lots: true, seller: true }
    });
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const result = await auctioneerService.createAuctioneer(data);
    if (result.success) {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const result = await auctioneerService.updateAuctioneer(id, data);
    if (result.success) {
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const result = await auctioneerService.deleteAuctioneer(id);
    if (result.success) {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}
