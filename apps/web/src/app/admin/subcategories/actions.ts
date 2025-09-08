// src/app/admin/subcategories/actions.ts
'use server';

import type { Subcategory, SubcategoryFormData } from '@bidexpert/core';
import { SubcategoryService } from '@bidexpert/core';

const subcategoryService = new SubcategoryService();

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  return subcategoryService.createSubcategory(data);
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
  return subcategoryService.updateSubcategory(subcategoryId, data);
}

export async function deleteSubcategoryAction(
  subcategoryId: string
): Promise<{ success: boolean; message: string }> {
  return subcategoryService.deleteSubcategory(subcategoryId);
}
