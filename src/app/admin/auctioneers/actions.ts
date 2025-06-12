'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { AuctioneerProfileInfo, AuctioneerFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

export async function createAuctioneer(
  data: AuctioneerFormData
): Promise<{ success: boolean; message: string; auctioneerId?: string; auctioneerPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  // publicId é gerado pelo adapter
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
  // O adapter agora lida com ID numérico ou publicId
  return db.getAuctioneer(id);
}

export async function getAuctioneerBySlug(slugOrPublicId: string): Promise<AuctioneerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  // Esta função agora busca por publicId (ou slug se mantivermos essa lógica no adapter)
  return db.getAuctioneerBySlug(slugOrPublicId);
}

export async function updateAuctioneer(
  idOrPublicId: string, // Pode ser o ID numérico ou o publicId
  data: Partial<AuctioneerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const dataToUpdate: Partial<AuctioneerFormData & { slug?: string }> = { ...data };
  if (data.name) {
    dataToUpdate.slug = slugify(data.name);
  }

  const result = await db.updateAuctioneer(idOrPublicId, dataToUpdate);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
    revalidatePath(`/admin/auctioneers/${idOrPublicId}/edit`); // Idealmente, a rota usaria publicId
  }
  return result;
}

export async function deleteAuctioneer(
  idOrPublicId: string // Pode ser o ID numérico ou o publicId
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteAuctioneer(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/auctioneers');
  }
  return result;
}
