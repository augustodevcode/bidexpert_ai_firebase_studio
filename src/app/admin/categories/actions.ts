
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import { AdminFieldValue, ServerTimestamp } from '@/lib/firebase/admin'; 
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data'; 

export async function createLotCategory(
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; categoryId?: string; }> {
  const db = getDatabaseAdapter();
  const result = await db.createLotCategory({
    name: data.name,
    description: data.description,
  });
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function getLotCategories(): Promise<LotCategory[]> {
  const db = getDatabaseAdapter();
  return db.getLotCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  const db = getDatabaseAdapter();
  return db.getLotCategory(id);
}

export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  // This is a simplified implementation for Firestore.
  // FirestoreAdapter would need to implement this query.
  // For SQL, it would be a WHERE slug = $1
  const categories = await getLotCategories(); // Not efficient for many categories
  return categories.find(cat => cat.slug === slug) || null;
}

export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  const categories = await getLotCategories(); // Not efficient
  const normalizedName = name.trim().toLowerCase();
  return categories.find(cat => cat.name.toLowerCase() === normalizedName) || null;
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; }> {
  const db = getDatabaseAdapter();
  const result = await db.updateLotCategory(id, {
    name: data.name,
    description: data.description,
  });
  if (result.success) {
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
  }
  return result;
}

export async function deleteLotCategory(
  id: string
): Promise<{ success: boolean; message: string; }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteLotCategory(id);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}
