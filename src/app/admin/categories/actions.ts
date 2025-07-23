// src/app/admin/categories/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getLotCategories(): Promise<LotCategory[]> {
  return prisma.lotCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
    return prisma.lotCategory.findUnique({ where: { id }});
}

export async function updateLotCategory(id: string, data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.lotCategory.update({
            where: { id },
            data,
        });
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
        return { success: true, message: "Categoria atualizada com sucesso." };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar categoria: ${error.message}` };
    }
}

export async function createLotCategory(data: { name: string; description?: string }): Promise<{ success: boolean, message: string }> {
    try {
        await prisma.lotCategory.create({ data });
        revalidatePath('/admin/categories');
        return { success: true, message: "Categoria criada com sucesso." };
    } catch (error: any) {
         return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
}
