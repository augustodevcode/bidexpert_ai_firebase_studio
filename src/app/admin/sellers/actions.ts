
'use server';

import { revalidatePath } from 'next/cache';
import type { SellerProfileInfo, SellerFormData } from '@/types';
import { getDatabaseAdapter } from '@/lib/database';

export async function createSeller(
  data: SellerFormData
): Promise<{ success: boolean; message: string; sellerId?: string; sellerPublicId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createSeller(data);
  if (result.success) {
    revalidatePath('/admin/sellers');
    revalidatePath('/consignor-dashboard/overview');
    // Also revalidate pages that might use the new seller
    revalidatePath('/admin/judicial-processes/new');
    revalidatePath('/admin/judicial-processes/edit'); 
    revalidatePath('/admin/wizard');
  }
  return result;
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  const db = await getDatabaseAdapter();
  return db.getSellers();
}

export async function getSeller(idOrPublicId: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getSeller(idOrPublicId);
}

export async function getSellerBySlug(slugOrPublicId: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getSellerBySlug(slugOrPublicId);
}

export async function getSellerByName(name: string): Promise<SellerProfileInfo | null> {
  const db = await getDatabaseAdapter();
  return db.getSellerByName(name);
}

export async function updateSeller(
  idOrPublicId: string,
  data: Partial<SellerFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateSeller(idOrPublicId, data);
  if (result.success) {
    revalidatePath('/admin/sellers');
    revalidatePath(`/admin/sellers/${idOrPublicId}/edit`);
    revalidatePath('/consignor-dashboard/overview'); 
    const seller = await getSeller(idOrPublicId);
    if (seller?.slug) {
      revalidatePath(`/sellers/${seller.slug}`);
    }
  }
  return result;
}

export async function deleteSeller(
  idOrPublicId: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const sellerToDelete = await getSeller(idOrPublicId);
  const result = await db.deleteSeller(idOrPublicId);
  if (result.success) {
    revalidatePath('/admin/sellers');
     if (sellerToDelete?.slug) {
      revalidatePath(`/sellers/${sellerToDelete.slug}`);
    }
  }
  return result;
}
