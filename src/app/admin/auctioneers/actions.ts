// src/app/admin/auctioneers/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { AuctioneerProfileInfo, AuctioneerFormData, Auction } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const db = await getDatabaseAdapter();
  return db.getAuctioneers();
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
    const db = await getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const auctioneer = await getAuctioneerBySlug(auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneer === auctioneer.name);
}

export async function createAuctioneer(data: AuctioneerFormData): Promise<{ success: boolean, message: string, auctioneerId?: string }> {
    console.warn("createAuctioneer with sample data adapter is not implemented.");
    return { success: false, message: "Criação de leiloeiro não implementada para o adaptador de dados de exemplo." };
}

export async function updateAuctioneer(id: string, data: Partial<AuctioneerFormData>): Promise<{ success: boolean, message: string }> {
    console.warn("updateAuctioneer with sample data adapter is not implemented.");
    return { success: false, message: "Atualização de leiloeiro não implementada para o adaptador de dados de exemplo." };
}

export async function deleteAuctioneer(id: string): Promise<{ success: boolean, message: string }> {
    console.warn("deleteAuctioneer with sample data adapter is not implemented.");
    return { success: false, message: "Exclusão de leiloeiro não implementada para o adaptador de dados de exemplo." };
}
