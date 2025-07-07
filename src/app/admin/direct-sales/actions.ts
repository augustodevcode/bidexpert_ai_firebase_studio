// src/app/admin/direct-sales/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';

export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
  const db = await getDatabaseAdapter();
  // Here, you would typically resolve category name and seller name to IDs
  // For sample data, we can pass them as is. For SQL, the adapter needs to handle resolution.
  const result = await db.createDirectSaleOffer(data);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales'); // Revalidate public page
    revalidatePath('/consignor-dashboard/direct-sales'); // Revalidate consignor page
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
  const db = await getDatabaseAdapter();
  return db.getDirectSaleOffers();
}

export async function getDirectSaleOffer(id: string): Promise<DirectSaleOffer | null> {
  const db = await getDatabaseAdapter();
  return db.getDirectSaleOffer(id);
}

export async function getDirectSaleOffersForSeller(sellerId: string): Promise<DirectSaleOffer[]> {
  const db = await getDatabaseAdapter();
  if (typeof db.getDirectSaleOffersForSeller !== 'function') {
    console.warn(`[getDirectSaleOffersForSeller] Adapter ${db.constructor.name} does not implement this method. Filtering in memory.`);
    const allOffers = await db.getDirectSaleOffers();
    return allOffers.filter(o => o.sellerId === sellerId);
  }
  return db.getDirectSaleOffersForSeller(sellerId);
}

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateDirectSaleOffer(id, data);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
    revalidatePath(`/direct-sales/${id}`);
    revalidatePath('/direct-sales');
    revalidatePath('/consignor-dashboard/direct-sales');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}

export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteDirectSaleOffer(id);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales');
    revalidatePath('/consignor-dashboard/direct-sales');
    revalidatePath('/consignor-dashboard/overview');
  }
  return result;
}