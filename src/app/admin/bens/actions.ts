// src/app/admin/bens/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Bem, BemFormData } from '@/types';
import { revalidatePath } from 'next/cache';


export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const db = getDatabaseAdapter();
    return db.getBens(filter);
}

export async function getBem(id: string): Promise<Bem | null> {
    const db = getDatabaseAdapter();
    return db.getBem(id);
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.createBem(data);
    if(result.success) {
      revalidatePath('/admin/bens');
    }
    return result;
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateBem(id, data);
     if(result.success) {
      revalidatePath('/admin/bens');
      revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    // Em um app real, verificar se o bem está em um lote ativo antes de excluir
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.deleteBem(id);
    if (result.success) {
        revalidatePath('/admin/bens');
    }
    return result;
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  const db = getDatabaseAdapter();
  return db.getBensByIds(ids);
}
