'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Auction, AuctionFormData, AuctionDbData } from '@/types';
import { sampleAuctions } from '@/lib/sample-data'; 
import { getLotCategoryByName } from '@/app/admin/categories/actions';
import { getAuctioneerByName } from '@/app/admin/auctioneers/actions'; // Assumindo que busca por nome também pode retornar ID
import { getSellerByName } from '@/app/admin/sellers/actions';     // Assumindo que busca por nome também pode retornar ID


export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
  const db = await getDatabaseAdapter();

  let categoryId: string | undefined;
  if (data.category) {
    const categoryObj = await getLotCategoryByName(data.category);
    if (!categoryObj) return { success: false, message: `Categoria '${data.category}' não encontrada.` };
    categoryId = categoryObj.id;
  }

  let auctioneerId: string | undefined;
  if (data.auctioneer) {
    const auctioneerObj = await getAuctioneerByName(data.auctioneer); // Idealmente, o formulário enviaria o ID
    if (!auctioneerObj) return { success: false, message: `Leiloeiro '${data.auctioneer}' não encontrado.` };
    auctioneerId = auctioneerObj.id;
  }

  let sellerId: string | undefined;
  if (data.seller) {
    const sellerObj = await getSellerByName(data.seller); // Idealmente, o formulário enviaria o ID
    if (!sellerObj) return { success: false, message: `Comitente '${data.seller}' não encontrado.` };
    sellerId = sellerObj.id;
  }

  const dataForDb: AuctionDbData = {
    ...data,
    categoryId,
    auctioneerId,
    sellerId,
  };

  const result = await db.createAuction(dataForDb);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function getAuctions(): Promise<Auction[]> {
  const db = await getDatabaseAdapter();
  const auctions = await db.getAuctions();
  // O fallback para sampleAuctions pode ser removido ou ajustado se os IDs/publicIds forem diferentes
  return auctions;
}

export async function getAuctionsBySellerSlug(sellerPublicId: string): Promise<Auction[]> {
  const db = await getDatabaseAdapter();
  return db.getAuctionsBySellerSlug(sellerPublicId);
}

export async function getAuction(idOrPublicId: string): Promise<Auction | null> {
  const db = await getDatabaseAdapter();
  // O adapter agora lida com a lógica de buscar por ID numérico ou publicId
  const auction = await db.getAuction(idOrPublicId);
  return auction;
}

export async function updateAuction(
  idOrPublicId: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const dataForDb: Partial<AuctionDbData> = { ...data };
  if (data.category) {
    const categoryObj = await getLotCategoryByName(data.category);
    if (!categoryObj && data.category.trim() !== "") return { success: false, message: `Categoria '${data.category}' não encontrada.` };
    dataForDb.categoryId = categoryObj?.id;
    delete (dataForDb as any).category;
  }
  if (data.auctioneer) {
    const auctioneerObj = await getAuctioneerByName(data.auctioneer);
    if (!auctioneerObj && data.auctioneer.trim() !== "") return { success: false, message: `Leiloeiro '${data.auctioneer}' não encontrado.` };
    dataForDb.auctioneerId = auctioneerObj?.id;
    delete (dataForDb as any).auctioneer;
  }
  if (data.seller) {
    const sellerObj = await getSellerByName(data.seller);
    if (!sellerObj && data.seller.trim() !== "") return { success: false, message: `Comitente '${data.seller}' não encontrado.` };
    dataForDb.sellerId = sellerObj?.id;
    delete (dataForDb as any).seller;
  }
  
  const result = await db.updateAuction(idOrPublicId, dataForDb);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${idOrPublicId}/edit`); // Idealmente, a rota usaria publicId
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function deleteAuction(
  idOrPublicId: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteAuction(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}
