
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, LotFormData, LotDbData, BidInfo } from '@/types';
import { getLotCategoryByName } from '@/app/admin/categories/actions';

export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string }> {
  const db = await getDatabaseAdapter();

  let categoryId: string | undefined;
  if (data.type) { // data.type is category name from form
    const category = await getLotCategoryByName(data.type);
    if (!category) {
      return { success: false, message: `Categoria '${data.type}' não encontrada.` };
    }
    categoryId = category.id;
  }

  // Remove 'type' and 'auctionName' (if present) from data passed to adapter, add categoryId
  const { type, auctionName, ...restOfData } = data;
  const dataForDb: LotDbData = {
    ...restOfData,
    categoryId: categoryId,
    mediaItemIds: data.mediaItemIds || [], // Ensure it's an array
    galleryImageUrls: data.galleryImageUrls || [], // Ensure it's an array
  };
  
  const result = await db.createLot(dataForDb);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  return db.getLots(auctionIdParam);
}

export async function getLot(id: string): Promise<Lot | null> {
  const db = await getDatabaseAdapter();
  return db.getLot(id);
}

export async function updateLot(
  id: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const updateDataForDb: Partial<LotDbData> = { ...data };

  if (data.type) {
    const category = await getLotCategoryByName(data.type);
    if (!category && data.type.trim() !== "") { // Allow unsetting category if type is empty string
        return { success: false, message: `Categoria '${data.type}' não encontrada.` };
    }
    updateDataForDb.categoryId = category?.id;
    delete (updateDataForDb as any).type; // Remove original 'type' field
  }

  if (data.auctionName) {
    delete (updateDataForDb as any).auctionName; // Not stored in DB
  }

  // Ensure mediaItemIds and galleryImageUrls are arrays if present
  if (data.mediaItemIds && !Array.isArray(data.mediaItemIds)) {
    updateDataForDb.mediaItemIds = [];
  }
  if (data.galleryImageUrls && !Array.isArray(data.galleryImageUrls)) {
    updateDataForDb.galleryImageUrls = [];
  }


  const result = await db.updateLot(id, updateDataForDb);
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
  const db = await getDatabaseAdapter();
  const result = await db.deleteLot(id, auctionId);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`);
    }
  }
  return result;
}

export async function getBidsForLot(lotId: string): Promise<BidInfo[]> {
  if (!lotId) {
    console.warn("[Server Action - getBidsForLot] Lot ID is required.");
    return [];
  }
  const db = await getDatabaseAdapter();
  return db.getBidsForLot(lotId);
}

export async function placeBidOnLot(
  lotId: string,
  auctionId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
  const db = await getDatabaseAdapter();
  return db.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
}
    
