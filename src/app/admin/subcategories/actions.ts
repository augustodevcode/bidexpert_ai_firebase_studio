
// src/app/admin/subcategories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Subcategory, SubcategoryFormData } from '@/types';
import { SubcategoryService } from '@/services/subcategory.service';
import { getTenantIdFromRequest } from '@/lib/actions/auth';

// Re-export SubcategoryFormData para uso em páginas
export type { SubcategoryFormData };

const subcategoryService = new SubcategoryService();

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  const tenantId = await getTenantIdFromRequest();
  const result = await subcategoryService.createSubcategory(data, tenantId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}

export async function getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<Subcategory[]> {
  const tenantId = await getTenantIdFromRequest();
  return subcategoryService.getSubcategoriesByParentId(parentCategoryId, tenantId);
}

export async function getSubcategoryByIdAction(subcategoryId: string): Promise<Subcategory | null> {
  const tenantId = await getTenantIdFromRequest();
  return subcategoryService.getSubcategoryById(subcategoryId, tenantId);
}

export async function updateSubcategoryAction(
  subcategoryId: string,
  data: Partial<SubcategoryFormData>
): Promise<{ success: boolean; message: string }> {
  const tenantId = await getTenantIdFromRequest();
  const result = await subcategoryService.updateSubcategory(subcategoryId, data, tenantId);
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
  const tenantId = await getTenantIdFromRequest();
  const result = await subcategoryService.deleteSubcategory(subcategoryId, tenantId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/subcategories');
    revalidatePath('/admin/categories');
  }
  return result;
}
