// src/app/admin/bens/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Bem, BemFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const whereClause: any = {};
    if (filter?.judicialProcessId) {
        whereClause.judicialProcessId = filter.judicialProcessId;
    }
    if (filter?.sellerId) {
        whereClause.sellerId = filter.sellerId;
    }
    // @ts-ignore
    return prisma.bem.findMany({ where: whereClause });
}

export async function getBem(id: string): Promise<Bem | null> {
    return prisma.bem.findUnique({ where: { id } });
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    try {
        const newBem = await prisma.bem.create({ data: data as any });
        revalidatePath('/admin/bens');
        return { success: true, message: 'Bem criado com sucesso.', bemId: newBem.id };
    } catch (error: any) {
        return { success: false, message: `Falha ao criar bem: ${error.message}` };
    }
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        await prisma.bem.update({ where: { id }, data: data as any });
        revalidatePath('/admin/bens');
        revalidatePath(`/admin/bens/${id}/edit`);
        return { success: true, message: 'Bem atualizado com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao atualizar bem: ${error.message}` };
    }
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    try {
        // In a real app, check if the asset is in an active lot before deleting
        await prisma.bem.delete({ where: { id } });
        revalidatePath('/admin/bens');
        return { success: true, message: 'Bem excluído com sucesso.' };
    } catch (error: any) {
        return { success: false, message: `Falha ao excluir bem: ${error.message}` };
    }
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  // @ts-ignore
  return prisma.bem.findMany({ where: { id: { in: ids } } });
}
