// src/app/admin/categories/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { LotCategory } from '@/types';

export async function getLotCategories(): Promise<LotCategory[]> {
  const db = await getDatabaseAdapter();
  return db.getLotCategories();
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    const categories = await getLotCategories();
    return categories.find(c => c.id === id) || null;
}

export async function updateLotCategory(id: string, data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    console.warn("updateLotCategory with sample data adapter is not implemented.");
    return { success: false, message: "Atualização de categoria não implementada para o adaptador de dados de exemplo."};
}

export async function createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    console.warn("createLotCategory with sample data adapter is not implemented.");
    return { success: false, message: "Criação de categoria não implementada para o adaptador de dados de exemplo."};
}
