
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import { AdminFieldValue, ServerTimestamp } from '@/lib/firebase/admin'; // For Firestore adapter potential use of serverTimestamp
import type { LotCategory } from '@/types';
// slugify can remain if used by all adapters, or moved to specific adapters
import { slugify } from '@/lib/sample-data'; 

export async function createLotCategory(
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string; categoryId?: string }> {
  const db = getDatabaseAdapter();
  // The adapter's createLotCategory should handle its own revalidation logic or pass info back
  const result = await db.createLotCategory({
    name: data.name,
    description: data.description,
    // slug and timestamps are typically handled by the adapter or DB itself
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

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateLotCategory(id, {
    name: data.name,
    description: data.description,
    // slug and updatedAt are typically handled by the adapter or DB itself
  });
  if (result.success) {
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
  }
  return result;
}

export async function deleteLotCategory(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.deleteLotCategory(id);
  if (result.success) {
    revalidatePath('/admin/categories');
  }
  return result;
}
