// src/app/admin/categories/actions.ts
/**
 * @fileoverview Server Actions para a entidade LotCategory (Categoria de Lote).
 * Este arquivo exporta funções que lidam com a criação, leitura, atualização
 * e exclusão (CRUD) de categorias de lotes. As ações aqui expostas servem como
 * a camada de Controller que interage com a CategoryService para aplicar a lógica
 * de negócio e persistir os dados no banco.
 */
'use server';

import { revalidatePath } from 'next/cache';
import type { LotCategory } from '@/types';
import { CategoryService } from '@/services/category.service';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import type { CategoryFormValues } from './category-form-schema';

const categoryService = new CategoryService();

function normalizeCategoryFormData(data: CategoryFormValues) {
  return {
    name: data.name,
    description: data.description,
    logoUrl: data.logoUrl,
    logoMediaId: data.logoMediaId,
    dataAiHintLogo: data.dataAiHintLogo,
    coverImageUrl: data.coverImageUrl,
    coverImageMediaId: data.coverImageMediaId,
    dataAiHintCover: data.dataAiHintCover,
    megaMenuImageUrl: data.megaMenuImageUrl,
    megaMenuImageMediaId: data.megaMenuImageMediaId,
    dataAiHintMegaMenu: data.dataAiHintMegaMenu,
  };
}

export async function getLotCategories(): Promise<LotCategory[]> {
  try {
    const tenantId = await getTenantIdFromRequest();
    const result = await categoryService.getCategories(tenantId);
    return sanitizeResponse(result);
  } catch (error) {
    console.error('[getLotCategories] Error:', error);
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    const tenantId = await getTenantIdFromRequest();
    return categoryService.getCategoryById(BigInt(id), tenantId);
}

export async function updateLotCategory(id: string, data: CategoryFormValues): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
  const result = await categoryService.updateCategory(BigInt(id), normalizeCategoryFormData(data), tenantId);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
    }
    return result;
}

export async function createLotCategory(data: CategoryFormValues): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await categoryService.createCategory(normalizeCategoryFormData(data), tenantId);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/categories');
    }
    return result;
}

export async function deleteLotCategory(id: string): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await categoryService.deleteCategory(BigInt(id), tenantId);
    if (result.success && process.env.NODE_ENV !== 'test') {
      revalidatePath('/admin/categories');
    }
    return result;
}
