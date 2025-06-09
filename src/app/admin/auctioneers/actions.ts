
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string }> {
  const db = getDatabaseAdapter();
  const result = await db.createAuctioneer(data);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
  }
  return result;
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const db = getDatabaseAdapter();
  return db.getAuctioneers();
}

export async function getAuctioneer(id: string): Promise<AuctioneerProfileInfo | null> {
  const db = getDatabaseAdapter();
  return db.getAuctioneer(id);
}

export async function updateAuctioneer(
  id: string,
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateAuctioneer(id, data);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${id}/edit`);
  }
  return result;
}

export async function deleteAuctioneer(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteAuctioneer(id);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
  }
  return result;
}
