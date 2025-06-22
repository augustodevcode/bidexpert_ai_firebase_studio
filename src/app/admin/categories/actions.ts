
// src/app/admin/categories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { LotCategory } from '@/types';
import type { CategoryFormValues } from './category-form-schema';

// Simula uma pequena latência de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createLotCategory(
  data: CategoryFormValues
): Promise<{ success: boolean; message: string; categoryId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createLotCategory(data);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function getLotCategories(): Promise<LotCategory[]> {
  const db = await getDatabaseAdapter();
  return db.getLotCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  const db = await getDatabaseAdapter();
  return db.getLotCategory(id);
}

export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  console.warn("getLotCategoryBySlug may not be implemented in all adapters. Check adapter logic.");
  const db = await getDatabaseAdapter();
  // Fallback logic in case the adapter doesn't have it (like sample-data)
  if (typeof (db as any).getLotCategoryBySlug === 'function') {
      return (db as any).getLotCategoryBySlug(slug);
  }
  const allCategories = await db.getLotCategories();
  return allCategories.find(c => c.slug === slug) || null;
}

export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  const db = await getDatabaseAdapter();
  return db.getLotCategoryByName(name);
}

export async function updateLotCategory(
  id: string,
  data: CategoryFormValues
): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateLotCategory(id, data);
  if(result.success) {
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
    revalidatePath(`/category/${data.name ? slugify(data.name) : ''}`);
  }
  return result;
}

export async function deleteLotCategory(
  id: string
): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteLotCategory(id);
  if (result.success) {
      revalidatePath('/admin/categories');
  }
  return result;
}

// Helper function to be used within this file, not for direct export if it's internal logic
function slugify(text: string): string {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
