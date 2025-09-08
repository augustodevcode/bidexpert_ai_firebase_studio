// src/app/admin/categories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { LotCategory, CategoryFormData } from '@bidexpert/core';
import { CategoryService } from '@bidexpert/services';

const categoryService = new CategoryService();

export async function getLotCategories(): Promise<LotCategory[]> {
  return categoryService.getCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    return categoryService.getCategoryById(id);
}

export async function updateLotCategory(id: string, data: Partial<CategoryFormData>): Promise<{ success: boolean, message: string }> {
    const result = await categoryService.updateCategory(id, data);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
    }
    return result;
}

export async function createLotCategory(data: CategoryFormData): Promise<{ success: boolean, message: string }> {
    const result = await categoryService.createCategory(data);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/categories');
    }
    return result;
}

export async function deleteLotCategory(id: string): Promise<{ success: boolean, message: string }> {
    const result = await categoryService.deleteCategory(id);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/categories');
    }
    return result;
}
