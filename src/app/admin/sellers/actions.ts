'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { SellerProfileInfo, SellerFormData } from '@/types';
import { slugify } from '@/lib/sample-data'; // slugify é usado no adapter agora

export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  // publicId é gerado pelo adapter
  const result = await db.createSeller(data);
  if (result.success) {
    revalidatePath('/admin/sellers');
  }
  return result;
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  const db = await getDatabaseAdapter();
  return db.getSellers();
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  // O adapter agora lida com ID numérico ou publicId
  return db.getSeller(id);
}

export async function getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  // Esta função agora busca por publicId (ou slug se mantivermos essa lógica no adapter)
  return db.getSellerBySlug(slugOrPublicId);
}

export async function getSellerByName(name: string): Promise<SellerProfileInfo | null> {
  // Esta função pode precisar ser otimizada se a coleção for grande
  // Por enquanto, busca todos e filtra. O adapter pode ter um getSellerByName otimizado.
  const sellers = await getSellers(); 
  const normalizedName = name.trim().toLowerCase();
  return sellers.find(sel => sel.name.toLowerCase() === normalizedName) || null;
}


export async function updateSeller(
  idOrPublicId: string, // Pode ser o ID numérico ou o publicId
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  
  const dataToUpdate: Partial<SellerFormData & { slug?: string }> = { ...data };
  if (data.name) {
    dataToUpdate.slug = slugify(data.name); // O adapter também fará isso se o nome mudar
  }

  const result = await db.updateSeller(idOrPublicId, dataToUpdate);
  if (result.success) {
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${idOrPublicId}/edit`); // Idealmente, a rota usaria publicId
    revalidatePath(`/consignor-dashboard/overview`); 
  }
  return result;
}

export async function deleteSeller(
  idOrPublicId: string // Pode ser o ID numérico ou o publicId
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteSeller(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/sellers');
  }
  return result;
}
