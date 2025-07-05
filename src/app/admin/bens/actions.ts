// src/app/admin/bens/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Bem, BemFormData } from '@/types';

export async function createBem(data: BemFormData): Promise<{ success: boolean; message: string; bemId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createBem(data);
  if (result.success) {
    revalidatePath('/admin/bens');
    revalidatePath('/admin/wizard'); // Refetch data for wizard
    revalidatePath('/admin/lots/new'); // Refetch for lot form
  }
  return result;
}

export async function getBens(filter?: { judicialProcessId?: string, sellerId?: string }): Promise<Bem[]> {
  const db = await getDatabaseAdapter();
  return db.getBens(filter);
}

export async function getBensByIdsAction(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabaseAdapter();
  return db.getBensByIds(ids);
}

export async function getBem(id: string): Promise<Bem | null> {
  const db = await getDatabaseAdapter();
  return db.getBem(id);
}

export async function updateBem(id: string, data: Partial<BemFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateBem(id, data);
  if (result.success) {
    revalidatePath('/admin/bens');
    revalidatePath(`/admin/bens/${id}/edit`);
    revalidatePath('/admin/wizard'); // Also refetch wizard page data
    revalidatePath('/admin/lots');
  }
  return result;
}

export async function deleteBem(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteBem(id);
  if (result.success) {
    revalidatePath('/admin/bens');
     revalidatePath('/admin/wizard');
     revalidatePath('/admin/lots');
  }
  return result;
}
