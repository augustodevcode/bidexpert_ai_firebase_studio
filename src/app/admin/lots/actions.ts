// src/app/admin/lots/actions.ts
'use server';

import type { Lot, Bem, LotFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { fetchLots, fetchLot, fetchBensByIds, fetchLotsByIds } from '@/lib/data-queries';
import { getDatabaseAdapter } from '@/lib/database';

export async function getLots(auctionId?: string): Promise<Lot[]> {
  return fetchLots(auctionId);
}

export async function getLot(id: string): Promise<Lot | null> {
  return fetchLot(id);
}

export async function createLot(data: Partial<Lot>): Promise<{ success: boolean, message: string, lotId?: string }> {
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

export async function updateLot(id: string, data: Partial<LotFormData>): Promise<{ success: boolean, message: string }> {
  const db = getDatabaseAdapter();
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
  const db = getDatabaseAdapter();
  const lotToDelete = await db.getLot(id);
  const finalAuctionId = auctionId || lotToDelete?.auctionId;

  const result = await db.deleteLot(id);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (finalAuctionId) {
      revalidatePath(`/admin/auctions/${finalAuctionId}/edit`);
    }
  }
  return result;
}


// These functions are helpers and might need to be adjusted based on adapter capabilities
export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  return fetchBensByIds(ids);
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  return fetchLotsByIds(ids);
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
