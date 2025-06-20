
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Subcategory, SubcategoryFormData } from '@/types';

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.createSubcategory(data);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/categories`); // Revalidate categories in case hasSubcategories changed
  }
  return result;
}

export async function getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<Subcategory[]> {
  const db = await getDatabaseAdapter();
  return db.getSubcategories(parentCategoryId);
}

export async function getSubcategoryByIdAction(subcategoryId: string): Promise<Subcategory | null> {
  const db = await getDatabaseAdapter();
  return db.getSubcategory(subcategoryId);
}

export async function updateSubcategoryAction(
  subcategoryId: string,
  data: Partial<SubcategoryFormData>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateSubcategory(subcategoryId, data);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/subcategories/${subcategoryId}/edit`);
    revalidatePath(`/admin/categories`); // Parent category might be affected
  }
  return result;
}

export async function deleteSubcategoryAction(
  subcategoryId: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteSubcategory(subcategoryId);
  if (result.success) {
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/categories`); // Parent category might be affected
  }
  return result;
}
