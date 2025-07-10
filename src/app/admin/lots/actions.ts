// src/app/admin/lots/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, Bem } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getLots(auctionId?: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  return db.getLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  const db = await getDatabaseAdapter();
  return db.getLot(id);
}

export async function createLot(data: Partial<Lot>): Promise<{ success: boolean, message: string, lotId?: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.createLot(data);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function updateLot(id: string, data: Partial<Lot>): Promise<{ success: boolean, message: string }> {
  const db = await getDatabaseAdapter();
  const lot = await db.getLot(id);
  const result = await db.updateLot(id, data);
  if (result.success) {
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    if (lot?.auctionId) {
      revalidatePath(`/admin/auctions/${lot.auctionId}/edit`);
    }
  }
  return result;
}

export async function deleteLot(id: string, auctionId?: string): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    const lotToDelete = await db.getLot(id);
    const result = await db.deleteLot(id);
    if (result.success) {
        revalidatePath('/admin/lots');
        const finalAuctionId = auctionId || lotToDelete?.auctionId;
        if (finalAuctionId) {
            revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
        }
    }
    return result;
}


// These functions are helpers and might need to be adjusted based on adapter capabilities
export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  const db = await getDatabaseAdapter();
  // Assuming adapter has a getBensByIds method, otherwise needs implementation.
  // For sample data, this might be a simple filter.
  // @ts-ignore
  if (db.getBensByIds) {
    // @ts-ignore
    return db.getBensByIds(ids);
  }
  return [];
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  return db.getLotsByIds(ids);
}

export async function finalizeLot(lotId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Action] Finalizing lot ${lotId} - not implemented for this adapter.`);
  // This requires significant logic: finding highest bid, creating UserWin, notifications...
  return { success: false, message: "Finalização de lote não implementada." };
}

export async function updateLotFeaturedStatus(id: string, isFeatured: boolean): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { isFeatured });
}

export async function updateLotTitle(id: string, title: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { title });
}

export async function updateLotImage(id: string, mediaItemId: string, imageUrl: string): Promise<{ success: boolean, message: string }> {
  return updateLot(id, { imageMediaId: mediaItemId, imageUrl });
}
