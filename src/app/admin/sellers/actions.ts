
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { SellerProfileInfo, SellerFormData } from '@/types';

export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string }> {
  const db = await getDatabaseAdapter();
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
  return db.getSeller(id);
}

export async function getSellerBySlug(slug: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getSellerBySlug(slug);
}

export async function getSellerByName(name: string): Promise<SellerProfileInfo | null> {
  const sellers = await getSellers(); // Not efficient
  const normalizedName = name.trim().toLowerCase();
  return sellers.find(sel => sel.name.toLowerCase() === normalizedName) || null;
}


export async function updateSeller(
  id: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateSeller(id, data);
  if (result.success) {
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${id}/edit`);
    revalidatePath(`/consignor-dashboard/overview`);
  }
  return result;
}

export async function deleteSeller(
  id: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteSeller(id);
  if (result.success) {
    revalidatePath('/admin/sellers');
  }
  return result;
}
