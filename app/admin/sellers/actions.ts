// src/app/admin/sellers/actions.ts
'use server';

import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';


export async function getSellers(): Promise<SellerProfileInfo[]> {
    const db = getDatabaseAdapter();
    return db.getSellers();
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    if (db.getSeller) {
        // @ts-ignore
        return db.getSeller(id);
    }
    const sellers = await db.getSellers();
    return sellers.find(s => s.id === id || s.publicId === id) || null;
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    if (db.getSellerBySlug) {
        // @ts-ignore
        return db.getSellerBySlug(slugOrId);
    }
    const sellers = await db.getSellers();
    return sellers.find(s => s.slug === slugOrId || s.id === slugOrId || s.publicId === slugOrId) || null;
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
  const seller = await getSellerBySlug(sellerSlugOrId);
  if (!seller) return [];

  const db = getDatabaseAdapter();
  const allLots = await db.getLots();
  return allLots.filter(l => l.sellerId === seller.id || l.sellerName === seller.name);
}


export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.createSeller(data);
    if (result.success) {
        revalidatePath('/admin/sellers');
    }
    return result;
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateSeller(id, data);
    if(result.success) {
      revalidatePath('/admin/sellers');
      revalidatePath(`/admin/sellers/${id}/edit`);
    }
    return result;
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // Here you would add checks for related entities before deleting
    // @ts-ignore
    const result = await db.deleteSeller(id);
    if (result.success) {
      revalidatePath('/admin/sellers');
    }
    return result;
}
