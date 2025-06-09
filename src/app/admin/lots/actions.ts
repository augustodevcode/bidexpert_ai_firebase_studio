
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, LotFormData } from '@/types';

export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string }> {
  const db = getDatabaseAdapter();
  const result = await db.createLot(data);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  const db = getDatabaseAdapter();
  return db.getLots(auctionIdParam);
}

export async function getLot(id: string): Promise<Lot | null> {
  const db = getDatabaseAdapter();
  return db.getLot(id);
}

export async function updateLot(
  id: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateLot(id, data);
  if (result.success) {
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function deleteLot(
  id: string,
  auctionId?: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteLot(id, auctionId);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }
  }
  return result;
}
