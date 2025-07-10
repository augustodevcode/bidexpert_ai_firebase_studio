// src/app/admin/bens/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Bem, BemFormData } from '@/types';
import { revalidatePath } from 'next/cache';


export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
    const db = await getDatabaseAdapter();
    // @ts-ignore - Assuming this method exists on the adapter for now
    if (db.getBens) {
        // @ts-ignore
        return db.getBens(filter);
    }
    return [];
}

export async function getBem(id: string): Promise<Bem | null> {
    const bens = await getBens();
    return bens.find(b => b.id === id) || null;
}

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
    console.warn("createBem with sample data adapter is not fully implemented.");
    return { success: false, message: "Criação de bem não implementada para este adaptador." };
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
    console.warn("updateBem with sample data adapter is not fully implemented.");
    return { success: false, message: "Atualização de bem não implementada para este adaptador." };
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
    console.warn("deleteBem with sample data adapter is not fully implemented.");
    return { success: false, message: "Exclusão de bem não implementada para este adaptador." };
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (db.getBensByIds) {
    // @ts-ignore
    return db.getBensByIds(ids);
  }
  return [];
}
