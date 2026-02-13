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

const categoryService = new CategoryService();

export async function getLotCategories(): Promise<LotCategory[]> {
  const tenantId = await getTenantIdFromRequest();
  const result = await categoryService.getCategories(tenantId);
  return sanitizeResponse(result);
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    const tenantId = await getTenantIdFromRequest();
    return categoryService.getCategoryById(BigInt(id), tenantId);
}

export async function updateLotCategory(id: string, data: Partial<Pick<LotCategory, 'name' | 'description'>>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await categoryService.updateCategory(BigInt(id), data, tenantId);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
    }
    return result;
}

export async function createLotCategory(data: Pick<LotCategory, 'name' | 'description'>): Promise<{ success: boolean, message: string }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await categoryService.createCategory(data, tenantId);
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
