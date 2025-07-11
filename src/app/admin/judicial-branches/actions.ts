// src/app/admin/judicial-branches/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getJudicialBranches(): Promise<JudicialBranch[]> {
    const db = await getDatabaseAdapter();
    return db.getJudicialBranches();
}

export async function getJudicialBranch(id: string): Promise<JudicialBranch | null> {
    const db = getDatabaseAdapter();
    const branches = await db.getJudicialBranches();
    return branches.find(b => b.id === id) || null;
}

export async function createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
    const db = getDatabaseAdapter();
    const result = await db.createJudicialBranch(data);
    if(result.success) {
      revalidatePath('/admin/judicial-branches');
    }
    return result;
}

export async function updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.updateJudicialBranch(id, data);
    if (result.success) {
        revalidatePath('/admin/judicial-branches');
        revalidatePath(`/admin/judicial-branches/${id}/edit`);
    }
    return result;
}

export async function deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.deleteJudicialBranch(id);
    if (result.success) {
        revalidatePath('/admin/judicial-branches');
    }
    return result;
}
