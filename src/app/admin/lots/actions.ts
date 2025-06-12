'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, LotFormData, LotDbData, BidInfo } from '@/types';
import { getLotCategoryByName } from '@/app/admin/categories/actions';
import { getAuction } from '@/app/admin/auctions/actions';
import { getState } from '@/app/admin/states/actions';
import { getCity } from '@/app/admin/cities/actions';

export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
  const db = await getDatabaseAdapter();

  let categoryId: string | undefined;
  if (data.type) { 
    const category = await getLotCategoryByName(data.type);
    if (!category) return { success: false, message: `Categoria '${data.type}' não encontrada.` };
    categoryId = category.id;
  }

  let numericAuctionId: string | undefined = data.auctionId; 
  // Se o auctionId fornecido for um publicId, precisamos convertê-lo para o ID numérico interno
  const auction = await getAuction(data.auctionId);
  if (!auction || !auction.id) return { success: false, message: `Leilão com ID/PublicID '${data.auctionId}' não encontrado.` };
  numericAuctionId = auction.id; // Usa o ID numérico do leilão

  let numericStateId: string | undefined = data.stateId || undefined;
  if (data.stateId) {
      const state = await getState(data.stateId); // getState já deve lidar com slug/publicId ou ID numérico
      if (!state || !state.id) return { success: false, message: `Estado com ID/Slug '${data.stateId}' não encontrado.` };
      numericStateId = state.id;
  }

  let numericCityId: string | undefined = data.cityId || undefined;
  if (data.cityId) {
      const city = await getCity(data.cityId); // getCity já deve lidar com slug/publicId ou ID numérico
      if (!city || !city.id) return { success: false, message: `Cidade com ID/Slug '${data.cityId}' não encontrada.` };
      numericCityId = city.id;
  }


  const { type, auctionName, ...restOfData } = data;
  const dataForDb: LotDbData = {
    ...restOfData,
    auctionId: numericAuctionId, // Garante que é o ID numérico
    categoryId: categoryId,
    stateId: numericStateId,
    cityId: numericCityId,
    mediaItemIds: data.mediaItemIds || [],
    galleryImageUrls: data.galleryImageUrls || [],
  };
  
  const result = await db.createLot(dataForDb);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (data.auctionId) { // Aqui, data.auctionId pode ser o publicId ou o numérico usado na URL
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
    }
  }
  return result;
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  // O adapter.getLots agora pode receber o publicId do leilão
  return db.getLots(auctionIdParam);
}

export async function getLot(idOrPublicId: string): Promise<Lot | null> {
  const db = await getDatabaseAdapter();
  // O adapter agora lida com ID numérico ou publicId
  return db.getLot(idOrPublicId);
}

export async function updateLot(
  idOrPublicId: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const updateDataForDb: Partial<LotDbData> = { ...data };

  if (data.type) {
    const category = await getLotCategoryByName(data.type);
    if (!category && data.type.trim() !== "") return { success: false, message: `Categoria '${data.type}' não encontrada.` };
    updateDataForDb.categoryId = category?.id;
    delete (updateDataForDb as any).type;
  }
  if (data.auctionName) delete (updateDataForDb as any).auctionName;
  if (data.auctionId) {
    const auction = await getAuction(data.auctionId);
    if (!auction || !auction.id) return { success: false, message: `Leilão com ID/PublicID '${data.auctionId}' não encontrado.` };
    updateDataForDb.auctionId = auction.id; // Garante que é o ID numérico
  }
  if (data.stateId) {
    const state = await getState(data.stateId);
    if (!state || !state.id) return { success: false, message: `Estado com ID/Slug '${data.stateId}' não encontrado.` };
    updateDataForDb.stateId = state.id;
  }
  if (data.cityId) {
    const city = await getCity(data.cityId);
    if (!city || !city.id) return { success: false, message: `Cidade com ID/Slug '${data.cityId}' não encontrada.` };
    updateDataForDb.cityId = city.id;
  }


  if (data.mediaItemIds && !Array.isArray(data.mediaItemIds)) updateDataForDb.mediaItemIds = [];
  if (data.galleryImageUrls && !Array.isArray(data.galleryImageUrls)) updateDataForDb.galleryImageUrls = [];

  const result = await db.updateLot(idOrPublicId, updateDataForDb);
  if (result.success) {
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${idOrPublicId}/edit`); // A rota deve usar o publicId
    if (data.auctionId) {
      revalidatePath(`/admin/auctions/${data.auctionId}/edit`); // A rota deve usar o publicId do leilão
    }
  }
  return result;
}

export async function deleteLot(
  idOrPublicId: string,
  auctionId?: string // auctionId pode ser o publicId
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteLot(idOrPublicId, auctionId);
  if (result.success) {
    revalidatePath('/admin/lots');
    if (auctionId) {
      revalidatePath(`/admin/auctions/${auctionId}/edit`); // A rota deve usar o publicId do leilão
    }
  }
  return result;
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
  if (!lotIdOrPublicId) {
    console.warn("[Server Action - getBidsForLot] Lot ID/PublicID is required.");
    return [];
  }
  const db = await getDatabaseAdapter();
  return db.getBidsForLot(lotIdOrPublicId);
}

export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
  const db = await getDatabaseAdapter();
  return db.placeBidOnLot(lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount);
}
    
