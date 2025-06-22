
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Auction, AuctionFormData, AuctionDbData } from '@/types';

// The main update action that calls the adapter
export async function updateAuction(
  idOrPublicId: string,
  data: Partial<AuctionFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();

  // The adapter expects AuctionDbData. We need to convert names to IDs.
  // For a simple title update, this is not necessary, but this is where it would go.
  const dataForDb: Partial<AuctionDbData> = {
    ...data,
  };

  const result = await db.updateAuction(idOrPublicId, dataForDb);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${idOrPublicId}/edit`);
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function updateAuctionTitle(
  idOrPublicId: string,
  newTitle: string
): Promise<{ success: boolean; message: string }> {
  if (!newTitle || newTitle.trim().length < 5) {
    return { success: false, message: "Título deve ter pelo menos 5 caracteres." };
  }

  // Call the main update action, which correctly uses the adapter
  const result = await updateAuction(idOrPublicId, { title: newTitle });

  if (result.success) {
    // Revalidate paths to ensure UI updates across the app
    revalidatePath(`/auctions/${idOrPublicId}`);
    revalidatePath('/search');
    revalidatePath('/');
  }
  return result;
}

// --- Other Auction Actions ---

export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string; auctionPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  // The adapter handles converting form data to DB data
  const result = await db.createAuction(data);
  if (result.success) {
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function getAuctions(): Promise<Auction[]> {
  const db = await getDatabaseAdapter();
  return db.getAuctions();
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  const db = await getDatabaseAdapter();
  return db.getAuctionsBySellerSlug(sellerSlugOrPublicId);
}

export async function getAuction(idOrPublicId: string): Promise<Auction | null> {
  const db = await getDatabaseAdapter();
  return db.getAuction(idOrPublicId);
}

export async function updateAuctionFeaturedStatus(
  idOrPublicId: string,
  newStatus: boolean
): Promise<{ success: boolean; message: string }> {
  const result = await updateAuction(idOrPublicId, { isFeaturedOnMarketplace: newStatus });
  if (result.success) {
    revalidatePath('/');
    revalidatePath(`/auctions/${idOrPublicId}`);
    revalidatePath('/search');
  }
  return { success: result.success, message: 'Destaque do leilão atualizado!' };
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
