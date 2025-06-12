'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string }> {
  const db = await getDatabaseAdapter();
  const dataWithSlug: AuctioneerFormData & { slug: string } = {
    ...data,
    slug: slugify(data.name),
  };
  const result = await db.createAuctioneer(dataWithSlug);
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

export async function getAuctioneerBySlug(slug: string): Promise<AuctioneerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getAuctioneerBySlug(slug);
}

export async function getAuctioneerByName(name: string): Promise<AuctioneerProfileInfo | null> {
  const auctioneers = await getAuctioneers(); // Not the most efficient for a single lookup
  const normalizedName = name.trim().toLowerCase();
  return auctioneers.find(auc => auc.name.toLowerCase() === normalizedName) || null;
}

export async function updateAuctioneer(
  id: string,
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const dataToUpdate: Partial<AuctioneerFormData & { slug?: string }> = { ...data };
  if (data.name) {
    dataToUpdate.slug = slugify(data.name);
  }

  const result = await db.updateAuctioneer(id, dataToUpdate);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${id}/edit`);
  }
  return result;
}

export async function deleteAuctioneer(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteAuctioneer(id);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
  }
  return result;
}