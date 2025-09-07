// src/app/admin/subcategories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Subcategory, SubcategoryFormData } from '@/types';
import { SubcategoryService } from '@bidexpert/services';

const subcategoryService = new SubcategoryService();

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  const result = await subcategoryService.createSubcategory(data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<Subcategory[]> {
  return subcategoryService.getSubcategoriesByParentId(parentCategoryId);
}

export async function getSubcategoryByIdAction(subcategoryId: string): Promise<Subcategory | null> {
  return subcategoryService.getSubcategoryById(subcategoryId);
}

export async function updateSubcategoryAction(
  subcategoryId: string,
  data: Partial<SubcategoryFormData>
): Promise<{ success: boolean; message: string }> {
  const result = await subcategoryService.updateSubcategory(subcategoryId, data);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/subcategories/${subcategoryId}/edit`);
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function deleteSubcategoryAction(
  subcategoryId: string
): Promise<{ success: boolean; message: string }> {
  const result = await subcategoryService.deleteSubcategory(subcategoryId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}
