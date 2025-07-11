// src/app/admin/auctioneers/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';
import { fetchAuctions, fetchAuctioneers } from '@/lib/data-queries';

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return fetchAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const auctioneers = await getAuctioneers();
  return auctioneers.find(a => a.id === id || a.publicId === id) || null;
}

export async function getAuctioneerBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    const auctioneers = await getAuctioneers();
    return auctioneers.find(a => a.slug === slugOrId || a.id === slugOrId || a.publicId === slugOrId) || null;
}


export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const allAuctions = await fetchAuctions();
    const auctioneer = await getAuctioneerBySlug(auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneer === auctioneer.name);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.createAuctioneer) {
        return { success: false, message: "Criação de leiloeiro não implementada para o adaptador de dados de exemplo." };
    }
    // @ts-ignore
    const result = await db.createAuctioneer(data);
    if(result.success) {
        revalidatePath('/admin/auctioneers');
    }
    return result;
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.updateAuctioneer) {
        return { success: false, message: "Atualização de leiloeiro não implementada para o adaptador de dados de exemplo." };
    }
    // @ts-ignore
    const result = await db.updateAuctioneer(id, data);
     if(result.success) {
        revalidatePath('/admin/auctioneers');
        revalidatePath(`/admin/auctioneers/${id}/edit`);
    }
    return result;
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
     if (!db.deleteAuctioneer) {
        return { success: false, message: "Exclusão de leiloeiro não implementada para o adaptador de dados de exemplo." };
    }
    // @ts-ignore
    const result = await db.deleteAuctioneer(id);
    if(result.success) {
        revalidatePath('/admin/auctioneers');
    }
    return result;
}
