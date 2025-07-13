// src/app/admin/bens/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Bem, BemFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const db = getDatabaseAdapter();
    // Assuming the adapter has a method to handle this logic
    // @ts-ignore
    if (db.getBens) {
        // @ts-ignore
        return await db.getBens(filter);
    }
    // Fallback if the method doesn't exist on all adapters
    const allBens = await db.getBens();
    if (!filter) {
        return allBens;
    }
    return allBens.filter(bem => {
        let match = true;
        if (filter.judicialProcessId && bem.judicialProcessId !== filter.judicialProcessId) {
            match = false;
        }
        if (filter.sellerId && bem.sellerId !== filter.sellerId) {
            match = false;
        }
        return match;
    });
}


export async function getBem(id: string): Promise<Bem | null> {
    const db = getDatabaseAdapter();
    return db.getBem(id);
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    const db = getDatabaseAdapter();
    const result = await db.createBem(data);
    if(result.success) {
      revalidatePath('/admin/bens');
    }
    return result;
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    const result = await db.updateBem(id, data);
     if(result.success) {
      revalidatePath('/admin/bens');
      revalidatePath(`/admin/bens/${id}/edit`);
    }
    return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    // In a real app, check if the asset is in an active lot before deleting
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
