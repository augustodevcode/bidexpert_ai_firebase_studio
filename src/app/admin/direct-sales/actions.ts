'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { DirectSaleOffer, DirectSaleOfferFormData } from '@/types';

export async function createDirectSaleOffer(data: DirectSaleOfferFormData): Promise<{ success: boolean; message: string; offerId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createDirectSaleOffer(data);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales');
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

export async function updateDirectSaleOffer(id: string, data: Partial<DirectSaleOfferFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateDirectSaleOffer(id, data);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath(`/admin/direct-sales/${id}/edit`);
    revalidatePath(`/direct-sales/${id}`);
    revalidatePath('/direct-sales');
  }
  return result;
}

export async function deleteDirectSaleOffer(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteDirectSaleOffer(id);
  if (result.success) {
    revalidatePath('/admin/direct-sales');
    revalidatePath('/direct-sales');
  }
  return result;
}
