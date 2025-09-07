// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { AuctioneerService } from '@/services/auctioneer.service';

const auctioneerService = new AuctioneerService();

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return auctioneerService.getAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  return auctioneerService.getAuctioneerById(id);
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    return auctioneerService.getAuctioneerBySlug(slugOrId);
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const result = await auctioneerService.createAuctioneer(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const result = await auctioneerService.updateAuctioneer(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const result = await auctioneerService.deleteAuctioneer(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}
