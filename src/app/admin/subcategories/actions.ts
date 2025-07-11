// src/app/admin/subcategories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Subcategory, SubcategoryFormData } from '@/types';
import { getDatabaseAdapter } from '@/lib/database';

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  const result = await db.createSubcategory(data);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<Subcategory[]> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  if (db.getSubcategoriesByParent) {
    // @ts-ignore
    return db.getSubcategoriesByParent(parentCategoryId);
  }
  return [];
}

export async function getSubcategoryByIdAction(subcategoryId: string): Promise<Subcategory | null> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  if (db.getSubcategory) {
    // @ts-ignore
    return db.getSubcategory(subcategoryId);
  }
  return null;
}

export async function updateSubcategoryAction(
  subcategoryId: string,
  data: Partial<SubcategoryFormData>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  const result = await db.updateSubcategory(subcategoryId, data);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/subcategories/${subcategoryId}/edit`);
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteSubcategoryAction(
  subcategoryId: string
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  // @ts-ignore
  const result = await db.deleteSubcategory(subcategoryId);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}
