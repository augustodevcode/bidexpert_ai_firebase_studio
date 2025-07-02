// src/app/admin/judicial-branches/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';

export async function createJudicialBranchAction(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.createJudicialBranch(data);
  if (result.success) {
    revalidatePath('/admin/judicial-branches');
  }
  return result;
}

export async function getJudicialBranchesAction(): Promise<JudicialBranch[]> {
  const db = await getDatabaseAdapter();
  return db.getJudicialBranches();
}

export async function getJudicialBranchAction(id: string): Promise<JudicialBranch | null> {
  const db = await getDatabaseAdapter();
  return db.getJudicialBranch(id);
}

export async function updateJudicialBranchAction(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateJudicialBranch(id, data);
  if (result.success) {
    revalidatePath('/admin/judicial-branches');
    revalidatePath(`/admin/judicial-branches/${id}/edit`);
  }
  return result;
}

export async function deleteJudicialBranchAction(id: string): Promise<{ success: boolean; message: string; }> {
  const db = await getDatabaseAdapter();
  const result = await db.deleteJudicialBranch(id);
  if (result.success) {
    revalidatePath('/admin/judicial-branches');
  }
  return result;
}
