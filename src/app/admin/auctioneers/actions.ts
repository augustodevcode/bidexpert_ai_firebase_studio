
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  const publicId = `LEIL-${slugify(data.name.substring(0,10))}-${Date.now().toString(36)}`;
  const result = await db.createAuctioneer({ ...data, publicId });
  if (result.success) {
    revalidatePath('/admin/auctioneers');
  }
  return result;
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const db = await getDatabaseAdapter();
  return db.getAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getAuctioneer(id);
}

export async function getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getAuctioneerBySlug(slugOrPublicId);
}

export async function getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  const auctioneers = await db.getAuctioneers();
  const normalizedName = name.trim().toLowerCase();
  return auctioneers.find(auc => auc.name.toLowerCase() === normalizedName) || null;
}

export async function updateAuctioneer(
  idOrPublicId: string, 
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const dataToUpdate: Partial<AuctioneerFormData & { slug?: string }> = { ...data };
  if (data.name) {
    // O adapter deve cuidar da geração do slug se o nome mudar e o publicId for usado para encontrar
  }

  const result = await db.updateAuctioneer(idOrPublicId, dataToUpdate);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${idOrPublicId}/edit`);
    const auctioneer = await db.getAuctioneer(idOrPublicId);
    if (auctioneer?.slug) {
      revalidatePath(`/auctioneers/${auctioneer.slug}`);
    }
  }
  return result;
}

export async function deleteAuctioneer(
  idOrPublicId: string 
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const auctioneerToDelete = await db.getAuctioneer(idOrPublicId);
  const result = await db.deleteAuctioneer(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    if (auctioneerToDelete?.slug) {
      revalidatePath(`/auctioneers/${auctioneerToDelete.slug}`);
    }
  }
  return result;
}

