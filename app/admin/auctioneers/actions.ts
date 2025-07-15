// src/app/admin/auctioneers/actions.ts
'use server';

import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const db = getDatabaseAdapter();
  return db.getAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  if (db.getAuctioneer) {
    // @ts-ignore
    return db.getAuctioneer(id);
  }
  const auctioneers = await db.getAuctioneers();
  return auctioneers.find(a => a.id === id || a.publicId === id) || null;
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    const db = getDatabaseAdapter();
    const auctioneers = await db.getAuctioneers();
    return auctioneers.find(a => a.slug === slugOrId || a.id === slugOrId || a.publicId === slugOrId) || null;
}


export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const auctioneer = await getAuctioneerBySlug(auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.createAuctioneer(data);
    if(result.success) {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateAuctioneer(id, data);
    if(result.success) {
      revalidatePath('/admin/auctioneers');
      revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const db = getDatabaseAdapter();
    // In a real app, check for linked auctions first
    // @ts-ignore
    const result = await db.deleteAuctioneer(id);
    if (result.success) {
      revalidatePath('/admin/auctioneers');
    }
    return result;
}
