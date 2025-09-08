// src/app/admin/categories/actions.ts
'use server';

import type { LotCategory, CategoryFormData } from '@bidexpert/core';
import { CategoryService } from '@bidexpert/core';

const categoryService = new CategoryService();

export async function getLotCategories(): Promise<LotCategory[]> {
  return categoryService.getCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    return categoryService.getCategoryById(id);
}

export async function updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean, message: string }> {
    return categoryService.updateCategory(id, data);
}

export async function createLotCategory(data: CategoryFormData): Promise<{ success: boolean, message: string }> {
    return categoryService.createCategory(data);
}

export async function deleteLotCategory(id: string): Promise<{ success: boolean, message: string }> {
    return categoryService.deleteCategory(id);
}
