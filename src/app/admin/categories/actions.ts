// src/app/admin/categories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
// AdminFieldValue e ServerTimestamp são importados condicionalmente no firestore.adapter.ts
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data'; 

export async function createLotCategory(
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; categoryId?: string; }> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - createLotCategory] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
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
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - getLotCategories] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
  return db.getLotCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - getLotCategory] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
  return db.getLotCategory(id);
}

export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - getLotCategoryBySlug] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
  const categories = await db.getLotCategories();
  return categories.find(cat => cat.slug === slug) || null;
}

export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - getLotCategoryByName] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
  const categories = await db.getLotCategories();
  const normalizedName = name.trim().toLowerCase();
  return categories.find(cat => cat.name.toLowerCase() === normalizedName) || null;
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string; }
): Promise<{ success: boolean; message: string; }> {
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - updateLotCategory] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
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
  // LOGGING FOR DIAGNOSIS
  console.log(`[Action - deleteLotCategory] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);
  const db = await getDatabaseAdapter();
  const result = await db.deleteLotCategory(id);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}
