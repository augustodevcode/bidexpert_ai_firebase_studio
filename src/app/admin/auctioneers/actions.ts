
'use server';

import { revalidatePath } from 'next/cache';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { getDatabaseAdapter } from '@/lib/database';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createAuctioneer(data);
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
  return db.getAuctioneerByName(name);
}

export async function updateAuctioneer(
  idOrPublicId: string, 
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateAuctioneer(idOrPublicId, data);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${idOrPublicId}/edit`);
    const auctioneer = await getAuctioneer(idOrPublicId);
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
  const auctioneerToDelete = await getAuctioneer(idOrPublicId); 
  const result = await db.deleteAuctioneer(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    if (auctioneerToDelete?.slug) {
      revalidatePath(`/auctioneers/${auctioneerToDelete.slug}`);
    }
  }
  return result;
}
    