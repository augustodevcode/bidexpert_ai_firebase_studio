// src/app/admin/sellers/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { SellerProfileInfo, SellerFormData, Lot } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';


export async function getSellers(): Promise<SellerProfileInfo[]> {
    const db = await getDatabaseAdapter();
    return db.getSellers();
}

export async function getSeller(id: string): Promise<SellerProfileInfo | null> {
    const db = await getDatabaseAdapter();
    const sellers = await db.getSellers();
    return sellers.find(s => s.id === id || s.publicId === id) || null;
}

export async function getSellerBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
    const db = await getDatabaseAdapter();
    const sellers = await db.getSellers();
    return sellers.find(s => s.slug === slugOrId || s.id === slugOrId || s.publicId === slugOrId) || null;
}

export async function getLotsBySellerSlug(sellerSlugOrId: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getLotsBySellerSlug) {
    // @ts-ignore
    return await db.getLotsBySellerSlug(sellerSlugOrId);
  }
  // Fallback for adapters without the specific method
  const allLots = await db.getLots();
  const seller = await getSellerBySlug(sellerSlugOrId);
  if (!seller) return [];
  return allLots.filter(lot => lot.sellerId === seller.id || lot.sellerName === seller.name);
}


export async function createSeller(data: SellerFormData): Promise<{ success: boolean; message: string; sellerId?: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
     if (!db.createSeller) {
        return { success: false, message: "Criação não implementada para o adaptador de dados de exemplo." };
    }
    // @ts-ignore
    const result = await db.createSeller(data);
    if(result.success) {
        revalidatePath('/admin/sellers');
    }
    return result;
}

export async function updateSeller(id: string, data: Partial<SellerFormData>): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
     // @ts-ignore
    if (!db.updateSeller) {
        return { success: false, message: "Atualização não implementada para o adaptador de dados de exemplo." };
    }
     // @ts-ignore
    const result = await db.updateSeller(id, data);
    if(result.success) {
        revalidatePath('/admin/sellers');
        revalidatePath(`/admin/sellers/${id}/edit`);
    }
    return result;
}

export async function deleteSeller(id: string): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.deleteSeller) {
        return { success: false, message: "Exclusão não implementada para o adaptador de dados de exemplo." };
    }
    // @ts-ignore
    const result = await db.deleteSeller(id);
    if(result.success) {
        revalidatePath('/admin/sellers');
    }
    return result;
}
