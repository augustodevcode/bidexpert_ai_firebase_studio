// src/app/admin/categories/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { LotCategory } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getLotCategories(): Promise<LotCategory[]> {
  const db = await getDatabaseAdapter();
  return db.getLotCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    const categories = await getLotCategories();
    return categories.find(c => c.id === id) || null;
}

export async function updateLotCategory(id: string, data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.updateLotCategory) {
        return { success: false, message: "Atualização de categoria não implementada para o adaptador de dados de exemplo."};
    }
    // @ts-ignore
    const result = await db.updateLotCategory(id, data);
    if (result.success) {
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
    }
    return result;
}

export async function createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (!db.createLotCategory) {
        return { success: false, message: "Criação de categoria não implementada para o adaptador de dados de exemplo."};
    }
    // @ts-ignore
    const result = await db.createLotCategory(data);
    if (result.success) {
        revalidatePath('/admin/categories');
    }
    return result;
}
